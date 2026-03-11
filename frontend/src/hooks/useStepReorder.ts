"use client";

/**
 * useStepReorder — Hook for managing step reorder state with API persistence.
 *
 * Handles optimistic reorder with debounced persistence. If a save fails,
 * the error is surfaced but the local reorder is preserved so the user
 * can retry (the next reorder or manual save will re-attempt).
 */

import { useState, useCallback, useRef } from "react";
import { reorderTrackSteps, ApiError } from "@/lib/api";

interface UseStepReorderOptions {
  projectId: string;
  appUniqueName: string;
  trackId: string;
  /** Debounce delay in ms before persisting (default: 800ms). */
  debounceMs?: number;
}

interface UseStepReorderReturn {
  /** Whether a save request is in flight. */
  saving: boolean;
  /** Error from the last failed save attempt, or null. */
  saveError: string | null;
  /** True briefly after a successful save. */
  saveSuccess: boolean;
  /** Call this when step order changes. Debounces and persists automatically. */
  handleReorder: (stepIds: string[]) => void;
  /** Immediately persist the given step order (no debounce). */
  persistNow: (stepIds: string[]) => Promise<void>;
  /** Clear any existing error. */
  clearError: () => void;
}

export function useStepReorder({
  projectId,
  appUniqueName,
  trackId,
  debounceMs = 800,
}: UseStepReorderOptions): UseStepReorderReturn {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Debounce timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest pending step IDs (for deduplication)
  const latestStepIdsRef = useRef<string[] | null>(null);
  // Success timeout ref for auto-clearing the checkmark
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (stepIds: string[]) => {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Clear any previous success timer
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }

      try {
        await reorderTrackSteps(projectId, appUniqueName, trackId, stepIds);
        setSaveSuccess(true);
        // Auto-clear success indicator after 2 seconds
        successTimerRef.current = setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to save step order";
        setSaveError(message);
      } finally {
        setSaving(false);
      }
    },
    [projectId, appUniqueName, trackId]
  );

  const handleReorder = useCallback(
    (stepIds: string[]) => {
      latestStepIdsRef.current = stepIds;
      setSaveError(null);

      // Debounce: clear any pending timer and set a new one
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const ids = latestStepIdsRef.current;
        if (ids) {
          persist(ids);
          latestStepIdsRef.current = null;
        }
      }, debounceMs);
    },
    [persist, debounceMs]
  );

  const persistNow = useCallback(
    async (stepIds: string[]) => {
      // Cancel any pending debounced save
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      latestStepIdsRef.current = null;
      await persist(stepIds);
    },
    [persist]
  );

  const clearError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    saving,
    saveError,
    saveSuccess,
    handleReorder,
    persistNow,
    clearError,
  };
}
