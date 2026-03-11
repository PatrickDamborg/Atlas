/**
 * React hook for managing walkthrough progress state.
 *
 * Handles:
 * - Loading resume state when a walkthrough is opened
 * - Recording step completions as the user advances
 * - Tracking completed steps for visual indicators (checkmarks)
 * - Resetting progress to start over
 *
 * The hook manages both server state (persisted progress) and local
 * optimistic state (immediate UI updates before server responds).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeWalkthroughStep,
  getWalkthroughResumeState,
  resetWalkthroughProgress,
} from "@/lib/api";
import type {
  ResumeStateResponse,
  StepCompletionResponse,
} from "@/types/walkthroughProgress";

export interface UseWalkthroughProgressOptions {
  /** The project ID. */
  projectId: string;
  /** The app track ID for this walkthrough. */
  appTrackId: string;
  /** The end user's session token. */
  sessionToken: string;
  /** Total number of visible steps in the track. */
  totalSteps: number;
  /** Called when all steps are completed. */
  onComplete?: () => void;
}

export interface WalkthroughProgressState {
  /** Whether the resume state is still loading. */
  isLoading: boolean;
  /** The 0-based index of the current step to show. */
  currentStepIndex: number;
  /** Set of completed step IDs for visual indicators. */
  completedStepIds: Set<string>;
  /** Whether all steps have been completed. */
  isComplete: boolean;
  /** Completion percentage (0-100). */
  completionPercentage: number;
  /** Error message if any operation failed. */
  error: string | null;

  /**
   * Mark the current step as completed and advance to the next.
   * Optimistically updates local state, then persists to the server.
   */
  completeCurrentStep: (stepId: string) => Promise<void>;

  /**
   * Go to a specific step index (for navigation controls).
   * Only allows going to completed steps or the next uncompleted step.
   */
  goToStep: (index: number) => void;

  /**
   * Reset all progress and start from step 0.
   */
  resetProgress: () => Promise<void>;
}

export function useWalkthroughProgress(
  options: UseWalkthroughProgressOptions
): WalkthroughProgressState {
  const { projectId, appTrackId, sessionToken, totalSteps, onComplete } =
    options;

  const [isLoading, setIsLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    new Set()
  );
  const [isComplete, setIsComplete] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate completion calls
  const pendingCompletion = useRef<string | null>(null);

  // ── Load resume state on mount ─────────────────────────────────
  useEffect(() => {
    if (!projectId || !appTrackId || !sessionToken) return;

    let cancelled = false;

    async function loadResumeState() {
      try {
        setIsLoading(true);
        setError(null);

        const resume: ResumeStateResponse = await getWalkthroughResumeState(
          projectId,
          appTrackId,
          sessionToken
        );

        if (cancelled) return;

        setCurrentStepIndex(resume.next_step_index);
        setCompletedStepIds(new Set(resume.completed_steps));
        setIsComplete(resume.is_complete);
        setCompletionPercentage(resume.completion_percentage);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load walkthrough resume state:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load progress. Starting from the beginning."
        );
        // On error, start from step 0 (graceful degradation)
        setCurrentStepIndex(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadResumeState();

    return () => {
      cancelled = true;
    };
  }, [projectId, appTrackId, sessionToken]);

  // ── Complete current step ──────────────────────────────────────
  const completeCurrentStep = useCallback(
    async (stepId: string) => {
      // Prevent duplicate calls for the same step
      if (pendingCompletion.current === stepId) return;
      if (completedStepIds.has(stepId)) {
        // Already completed — just advance
        setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps));
        return;
      }

      pendingCompletion.current = stepId;

      // Optimistic update
      const newCompleted = new Set(completedStepIds);
      newCompleted.add(stepId);
      setCompletedStepIds(newCompleted);

      const newIndex = Math.min(currentStepIndex + 1, totalSteps);
      setCurrentStepIndex(newIndex);

      const newPercentage =
        totalSteps > 0
          ? Math.round((newCompleted.size / totalSteps) * 1000) / 10
          : 0;
      setCompletionPercentage(newPercentage);

      const nowComplete = newCompleted.size >= totalSteps;
      if (nowComplete) {
        setIsComplete(true);
      }

      try {
        setError(null);
        const response: StepCompletionResponse =
          await completeWalkthroughStep(projectId, appTrackId, sessionToken, {
            step_id: stepId,
            step_index: currentStepIndex,
            total_steps: totalSteps,
          });

        // Reconcile with server state
        setCompletedStepIds(new Set(response.completed_steps));
        setIsComplete(response.is_complete);
        setCompletionPercentage(response.completion_percentage);

        if (response.is_complete && onComplete) {
          onComplete();
        }
      } catch (err) {
        console.error("Failed to persist step completion:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save progress. Your progress may not be saved."
        );
        // Keep the optimistic state — user can retry
      } finally {
        pendingCompletion.current = null;
      }
    },
    [
      projectId,
      appTrackId,
      sessionToken,
      currentStepIndex,
      completedStepIds,
      totalSteps,
      onComplete,
    ]
  );

  // ── Navigate to a specific step ────────────────────────────────
  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index > totalSteps) return;
      // Allow going to any completed step or the next uncompleted step
      setCurrentStepIndex(index);
    },
    [totalSteps]
  );

  // ── Reset progress ─────────────────────────────────────────────
  const doResetProgress = useCallback(async () => {
    try {
      setError(null);
      await resetWalkthroughProgress(projectId, appTrackId, sessionToken);

      // Reset local state
      setCurrentStepIndex(0);
      setCompletedStepIds(new Set());
      setIsComplete(false);
      setCompletionPercentage(0);
    } catch (err) {
      console.error("Failed to reset progress:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reset progress."
      );
    }
  }, [projectId, appTrackId, sessionToken]);

  return {
    isLoading,
    currentStepIndex,
    completedStepIds,
    isComplete,
    completionPercentage,
    error,
    completeCurrentStep,
    goToStep,
    resetProgress: doResetProgress,
  };
}
