"use client";

import { useEffect, useCallback } from "react";
import { useCoachMark } from "@/contexts/CoachMarkContext";
import { useOptionalTargetRefRegistry } from "@/contexts/TargetRefRegistry";
import { buildCoachMarkStepsFromContent } from "@/lib/coachMarkUtils";
import type { AppTrainingContent } from "@/types/trainingTrack";

/**
 * Bridge hook that wires walkthrough data into the CoachMarkContext.
 *
 * When the track changes, this hook:
 * 1. Builds CoachMarkSteps from the AppTrainingContent for the given track
 * 2. Loads them into the CoachMarkContext (activating the sequence)
 * 3. Provides helpers to find target elements via either the registry or DOM query
 *
 * This is the key connection between the data layer (pipeline output)
 * and the presentation layer (CoachMark overlay positioning).
 */
export function useWalkthroughCoachMarks(
  content: AppTrainingContent | null,
  trackId: string | null
) {
  const coachMark = useCoachMark();
  const registry = useOptionalTargetRefRegistry();

  // Load steps whenever the track or content changes
  useEffect(() => {
    if (!content || !trackId) {
      // No content or track — reset if we have steps loaded
      if (coachMark.steps.length > 0) {
        coachMark.reset();
      }
      return;
    }

    const steps = buildCoachMarkStepsFromContent(content, trackId);
    if (steps.length > 0) {
      coachMark.loadSteps(steps);
    }
  }, [content, trackId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Find a target DOM element by element ID.
   * Uses the ref registry first (O(1)), falls back to DOM query.
   */
  const findTargetElement = useCallback(
    (elementId: string): HTMLElement | null => {
      // 1. Try registry lookup (fast path)
      if (registry) {
        const el = registry.getElement(elementId);
        if (el) return el;
      }

      // 2. Fall back to DOM query via data-element-id attribute
      return (
        document.querySelector<HTMLElement>(
          `[data-element-id="${elementId}"]`
        ) ??
        document.querySelector<HTMLElement>(`#${CSS.escape(elementId)}`) ??
        null
      );
    },
    [registry]
  );

  /**
   * Get the bounding rect for a target element.
   * Uses cached rects from the registry when available.
   */
  const getTargetRect = useCallback(
    (elementId: string): DOMRect | null => {
      // 1. Try registry cached rect
      if (registry) {
        const rect = registry.getRect(elementId);
        if (rect) return rect;
      }

      // 2. Fall back to direct DOM measurement
      const el = findTargetElement(elementId);
      return el?.getBoundingClientRect() ?? null;
    },
    [registry, findTargetElement]
  );

  return {
    ...coachMark,
    findTargetElement,
    getTargetRect,
    /** Force recompute all target positions (call after scroll/resize) */
    recomputePositions: registry?.recomputeAll ?? (() => {}),
  };
}
