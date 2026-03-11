/**
 * SSE (Server-Sent Events) client utilities for the AI pipeline.
 *
 * Supports two connection strategies:
 * 1. EventSource (GET) — for the SSE stream endpoint after starting a run
 * 2. fetch + ReadableStream — fallback for POST-based or header-requiring SSE
 *
 * Pipeline flow:
 *   POST /api/projects/{id}/pipeline/run   → { run_id, sse_url }
 *   GET  /api/projects/{id}/pipeline/{run_id}/stream  → SSE event stream
 */

import type { PipelineEvent, PipelineStartRequest } from "@/types/pipeline";

const BASE = "/api";

export interface SSEOptions {
  /** Called for each parsed SSE event. */
  onEvent: (event: PipelineEvent) => void;
  /** Called when the SSE connection is established. */
  onOpen?: () => void;
  /** Called when the connection closes (normally or due to error). */
  onClose?: () => void;
  /** Called on connection or parse errors. */
  onError?: (error: Error) => void;
  /** AbortSignal to cancel the SSE stream. */
  signal?: AbortSignal;
}

// Named SSE event types emitted by the backend
const SSE_EVENT_TYPES = [
  "pipeline_started",
  "pipeline_completed",
  "pipeline_failed",
  "agent_started",
  "agent_progress",
  "agent_completed",
  "agent_failed",
  "validation_started",
  "validation_passed",
  "validation_failed",
  "heartbeat",
] as const;

/**
 * Connect to a pipeline SSE stream via native EventSource.
 *
 * Use this after starting a run via POST and receiving the sse_url.
 *
 * @param sseUrl - SSE endpoint URL (from PipelineStartResponse.sse_url)
 * @param options - Event handlers
 * @returns AbortController to close the connection
 */
export function connectPipelineSSEByUrl(
  sseUrl: string,
  options: SSEOptions
): AbortController {
  const controller = new AbortController();

  // Normalise URL
  const fullUrl = sseUrl.startsWith("/api") ? sseUrl : `${BASE}${sseUrl}`;
  const es = new EventSource(fullUrl);

  es.onopen = () => {
    options.onOpen?.();
  };

  es.onerror = () => {
    if (controller.signal.aborted) {
      es.close();
      options.onClose?.();
      return;
    }
    options.onError?.(new Error("SSE connection error"));
  };

  // Listen for each named event type
  for (const eventType of SSE_EVENT_TYPES) {
    es.addEventListener(eventType, ((e: MessageEvent) => {
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        options.onEvent(event);

        // Auto-close on terminal events
        if (
          event.event_type === "pipeline_completed" ||
          event.event_type === "pipeline_failed"
        ) {
          es.close();
          options.onClose?.();
        }
      } catch (err) {
        console.error(`Failed to parse SSE event (${eventType}):`, err);
      }
    }) as EventListener);
  }

  // Wire up abort to close EventSource
  controller.signal.addEventListener("abort", () => {
    es.close();
    options.onClose?.();
  });

  return controller;
}

/**
 * Start a pipeline run and connect to its SSE stream.
 *
 * This is the main entry point: it POSTs to start the run,
 * then connects via fetch streaming to the SSE URL.
 *
 * @param projectId - UUID of the project
 * @param request - Pipeline start parameters
 * @param options - Event handlers
 * @returns AbortController for cancelling the connection
 */
export function connectPipelineSSE(
  projectId: string,
  request: PipelineStartRequest,
  options: SSEOptions
): AbortController {
  const controller = new AbortController();
  const signal = options.signal
    ? combineSignals(options.signal, controller.signal)
    : controller.signal;

  const url = `${BASE}/projects/${projectId}/pipeline/run`;

  (async () => {
    try {
      // Step 1: Start the pipeline run
      const startResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal,
      });

      if (!startResponse.ok) {
        const body = await startResponse.json().catch(() => ({}));
        throw new Error(
          body.detail ?? `Pipeline request failed: ${startResponse.status}`
        );
      }

      const { sse_url } = await startResponse.json();

      // Step 2: Connect to SSE stream via fetch (for custom header support)
      const streamUrl = sse_url.startsWith("/api") ? sse_url : `${BASE}${sse_url}`;
      const streamResponse = await fetch(streamUrl, {
        method: "GET",
        headers: { Accept: "text/event-stream" },
        signal,
      });

      if (!streamResponse.ok) {
        const body = await streamResponse.json().catch(() => ({}));
        throw new Error(
          body.detail ?? `SSE stream failed: ${streamResponse.status}`
        );
      }

      if (!streamResponse.body) {
        throw new Error("No response body — SSE streaming not supported");
      }

      options.onOpen?.();
      await readSSEStream(streamResponse.body, options, signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      options.onError?.(
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      options.onClose?.();
    }
  })();

  return controller;
}

// ── Internal helpers ─────────────────────────────────────────────────

/**
 * Read and parse an SSE stream from a ReadableStream<Uint8Array>.
 */
async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  options: SSEOptions,
  signal: AbortSignal
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete events (separated by double newlines)
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const event = parseSSEEvent(trimmed);
        if (event) {
          options.onEvent(event);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse a single SSE event block into a PipelineEvent.
 *
 * Expected format:
 *   event: agent_started
 *   data: {"event_type": "agent_started", ...}
 */
function parseSSEEvent(raw: string): PipelineEvent | null {
  const lines = raw.split("\n");
  let eventType = "";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    } else if (line.startsWith(":")) {
      // Comment line — skip (keepalive)
      continue;
    }
  }

  if (!dataLines.length) return null;

  try {
    const parsed = JSON.parse(dataLines.join("\n"));
    if (eventType && !parsed.event_type) {
      parsed.event_type = eventType;
    }
    return parsed as PipelineEvent;
  } catch {
    return null;
  }
}

/**
 * Combine two AbortSignals so that aborting either one aborts the result.
 */
function combineSignals(
  signal1: AbortSignal,
  signal2: AbortSignal
): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();

  if (signal1.aborted || signal2.aborted) {
    controller.abort();
    return controller.signal;
  }

  signal1.addEventListener("abort", abort, { once: true });
  signal2.addEventListener("abort", abort, { once: true });

  return controller.signal;
}
