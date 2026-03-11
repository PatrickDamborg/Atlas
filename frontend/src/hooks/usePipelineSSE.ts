/**
 * React hook for managing the pipeline SSE connection and state.
 *
 * Provides a clean API for components to:
 *   - Start a pipeline run (which triggers the SSE connection)
 *   - Observe real-time progress of each agent stage
 *   - Retry on failure (full restart per MVP constraints)
 *   - Cancel an in-progress run
 *
 * Usage:
 *   const { state, start, cancel, retry } = usePipelineSSE(projectId);
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectPipelineSSE } from "@/lib/sse";
import {
  AGENT_NUMBER_TO_STAGE,
  createInitialPipelineState,
  type AgentStage,
  type PipelineEvent,
  type PipelineState,
  type StageState,
} from "@/types/pipeline";

export interface UsePipelineSSEReturn {
  /** Current pipeline state with per-stage statuses. */
  state: PipelineState;
  /** Start the pipeline run (connects to SSE endpoint). */
  start: (appUniqueName: string) => void;
  /** Cancel the current pipeline run. */
  cancel: () => void;
  /** Retry after a failure (full restart per MVP constraints). */
  retry: () => void;
  /** Whether a run is currently in progress. */
  isRunning: boolean;
}

export function usePipelineSSE(projectId: string): UsePipelineSSEReturn {
  const [state, setState] = useState<PipelineState>(
    createInitialPipelineState
  );
  const controllerRef = useRef<AbortController | null>(null);
  const lastAppRef = useRef<string>("");

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  // ── Event handler ───────────────────────────────────────────────

  const handleEvent = useCallback((event: PipelineEvent) => {
    setState((prev) => applyEvent(prev, event));
  }, []);

  // ── Start pipeline ──────────────────────────────────────────────

  const start = useCallback(
    (appUniqueName: string) => {
      // Abort any existing connection
      controllerRef.current?.abort();
      lastAppRef.current = appUniqueName;

      // Reset state
      const initial = createInitialPipelineState();
      initial.status = "running";
      setState(initial);

      const controller = connectPipelineSSE(
        projectId,
        { app_unique_name: appUniqueName },
        {
          onEvent: handleEvent,
          onOpen: () => {
            setState((prev) => ({ ...prev, connected: true }));
          },
          onClose: () => {
            setState((prev) => ({ ...prev, connected: false }));
          },
          onError: (error) => {
            setState((prev) => ({
              ...prev,
              connected: false,
              status: prev.status === "completed" ? "completed" : "failed",
              errorMessage:
                prev.errorMessage ?? error.message ?? "Connection lost",
            }));
          },
        }
      );

      controllerRef.current = controller;
    },
    [projectId, handleEvent]
  );

  // ── Cancel pipeline ─────────────────────────────────────────────

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    setState((prev) => ({
      ...prev,
      connected: false,
      status: "idle",
      stages: prev.stages.map((s) =>
        s.status === "running"
          ? { ...s, status: "skipped" as const, message: "Cancelled" }
          : s
      ),
    }));
  }, []);

  // ── Retry (full restart per MVP) ────────────────────────────────

  const retry = useCallback(() => {
    if (lastAppRef.current) {
      start(lastAppRef.current);
    }
  }, [start]);

  return {
    state,
    start,
    cancel,
    retry,
    isRunning: state.status === "running",
  };
}

// ── State reducer ────────────────────────────────────────────────────

/**
 * Pure function that applies a pipeline SSE event to the current state.
 * Returns a new state object (immutable update).
 */
function applyEvent(
  prev: PipelineState,
  event: PipelineEvent
): PipelineState {
  const now = event.timestamp ?? new Date().toISOString();
  const updatedEvents = [...prev.events, event];

  switch (event.event_type) {
    case "pipeline_started":
      return {
        ...prev,
        runId: event.run_id,
        status: "running",
        currentStage: event.stage,
        events: updatedEvents,
        lastEventAt: now,
        errorMessage: null,
      };

    case "agent_started": {
      const agentStage = event.agent
        ? AGENT_NUMBER_TO_STAGE[event.agent.agent_number]
        : null;
      return {
        ...prev,
        currentStage: event.stage,
        events: updatedEvents,
        lastEventAt: now,
        stages: agentStage
          ? updateStage(prev.stages, agentStage, {
              status: "running",
              message: event.agent?.agent_name
                ? `Running ${event.agent.agent_name}...`
                : "Running...",
              progressPercent: undefined,
              itemsProcessed: undefined,
              itemsTotal: undefined,
              errorMessage: undefined,
            })
          : prev.stages,
      };
    }

    case "agent_progress": {
      const agentStage = event.agent
        ? AGENT_NUMBER_TO_STAGE[event.agent.agent_number]
        : null;
      if (!agentStage || !event.progress) return { ...prev, events: updatedEvents, lastEventAt: now };

      const pct =
        event.progress.items_total > 0
          ? Math.round(
              (event.progress.items_completed / event.progress.items_total) *
                100
            )
          : undefined;

      return {
        ...prev,
        events: updatedEvents,
        lastEventAt: now,
        stages: updateStage(prev.stages, agentStage, {
          message: event.progress.message,
          progressPercent: pct,
          itemsProcessed: event.progress.items_completed,
          itemsTotal: event.progress.items_total,
        }),
      };
    }

    case "agent_completed": {
      const agentStage = event.agent
        ? AGENT_NUMBER_TO_STAGE[event.agent.agent_number]
        : null;
      return {
        ...prev,
        currentStage: event.stage,
        events: updatedEvents,
        lastEventAt: now,
        stages: agentStage
          ? updateStage(prev.stages, agentStage, {
              status: "completed",
              message: "Completed",
              progressPercent: 100,
            })
          : prev.stages,
      };
    }

    case "agent_failed": {
      const agentStage = event.agent
        ? AGENT_NUMBER_TO_STAGE[event.agent.agent_number]
        : null;
      return {
        ...prev,
        currentStage: event.stage,
        events: updatedEvents,
        lastEventAt: now,
        stages: agentStage
          ? updateStage(prev.stages, agentStage, {
              status: "failed",
              errorMessage: event.error_message ?? "Agent failed",
              message: event.error_message ?? "Agent failed",
            })
          : prev.stages,
      };
    }

    case "validation_started":
      return {
        ...prev,
        currentStage: event.stage,
        events: updatedEvents,
        lastEventAt: now,
      };

    case "validation_passed":
      return {
        ...prev,
        currentStage: event.stage,
        events: updatedEvents,
        lastEventAt: now,
      };

    case "validation_failed":
      return {
        ...prev,
        currentStage: event.stage,
        status: "failed",
        errorMessage: event.error_message ?? "Validation failed",
        events: updatedEvents,
        lastEventAt: now,
      };

    case "pipeline_completed":
      return {
        ...prev,
        status: "completed",
        currentStage: "completed",
        events: updatedEvents,
        lastEventAt: now,
      };

    case "pipeline_failed":
      return {
        ...prev,
        status: "failed",
        currentStage: "failed",
        errorMessage: event.error_message ?? "Pipeline failed",
        events: updatedEvents,
        lastEventAt: now,
      };

    case "heartbeat":
      return {
        ...prev,
        lastEventAt: now,
      };

    default:
      return { ...prev, events: updatedEvents };
  }
}

/**
 * Immutably update a single stage in the stages array.
 */
function updateStage(
  stages: StageState[],
  stageId: AgentStage,
  updates: Partial<StageState>
): StageState[] {
  return stages.map((s) =>
    s.stage === stageId ? { ...s, ...updates } : s
  );
}
