"use client";

/**
 * Hook to manage per-step visibility toggle with backend persistence.
 *
 * Provides optimistic updates (immediate UI feedback) and debounced
 * persistence to the backend via the step visibility API.
 */

import { useState, useCallback, useRef } from "react";
import { updateStepVisibility } from "@/lib/api";

interface UseStepVisibilityOptions {
  projectId: string;
  appUniqueName: string;
  trackId: string;
  /** Initial disabled step IDs from the backend */
  initialDisabledStepIds?: string[];
}

interface UseStepVisibilityReturn {
  /** Currently disabled step IDs (optimistic state) */
  disabledStepIds: string[];
  /** Toggle a step's visibility. Returns immediately with optimistic update. */
  toggleStep: (stepId: string, enabled: boolean) => void;
  /** Whether a save is in progress */
  saving: boolean;
  /** Error from the last save attempt, or null */
  saveError: string | null;
  /** Whether the last save succeeded (briefly true for UI feedback) */
  saveSuccess: boolean;
}

/**
 * Manages per-step enabled/disabled state with backend persistence.
 *
 * Toggle changes are applied optimistically to the local state and then
 * persisted to the backend. Each toggle triggers its own save call.
 */
export function useStepVisibility({
  projectId,
  appUniqueName,
  trackId,
  initialDisabledStepIds = [],
}: UseStepVisibilityOptions): UseStepVisibilityReturn {
  const [disabledStepIds, setDisabledStepIds] = useState<string[]>(
    initialDisabledStepIds
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const successTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleStep = useCallback(
    async (stepId: string, enabled: boolean) => {
      // Optimistic update
      setDisabledStepIds((prev) => {
        if (enabled) {
          return prev.filter((id) => id !== stepId);
        } else {
          return prev.includes(stepId) ? prev : [...prev, stepId];
        }
      });

      setSaveError(null);
      setSaving(true);

      // Clear previous success timeout
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
        successTimeout.current = null;
      }
      setSaveSuccess(false);

      try {
        const response = await updateStepVisibility(
          projectId,
          appUniqueName,
          trackId,
          [{ step_id: stepId, enabled }]
        );

        // Sync with server state
        setDisabledStepIds(response.disabled_step_ids);

        setSaveSuccess(true);
        successTimeout.current = setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
      } catch (err) {
        // Rollback optimistic update
        setDisabledStepIds((prev) => {
          if (enabled) {
            // Was enabling — re-disable
            return prev.includes(stepId) ? prev : [...prev, stepId];
          } else {
            // Was disabling — re-enable
            return prev.filter((id) => id !== stepId);
          }
        });

        setSaveError(
          err instanceof Error
            ? err.message
            : "Failed to update step visibility"
        );
      } finally {
        setSaving(false);
      }
    },
    [projectId, appUniqueName, trackId]
  );

  return {
    disabledStepIds,
    toggleStep,
    saving,
    saveError,
    saveSuccess,
  };
}
