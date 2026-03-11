"use client";

import { useMemo } from "react";
import type { CoachMarkPosition } from "./CoachMark";
import type { StepLayout, ScreenLayout } from "@/types/trainingTrack";

/**
 * Hook that resolves the target element selector and preferred position
 * for a CoachMark based on the StepLayout and ScreenLayout data from
 * the AI pipeline.
 *
 * The pipeline provides:
 * - StepLayout.target_element_id: the element_id within the screen
 * - StepLayout.annotation_position: preferred tooltip position ("top" | "bottom" | "left" | "right")
 * - ScreenLayout.elements[]: elements with element_id used for DOM targeting
 *
 * This hook maps those to a CSS selector and CoachMarkPosition that the
 * CoachMark component can use.
 */
export interface CoachMarkTargetInfo {
  /** CSS selector to locate the target element in the DOM */
  targetSelector: string | undefined;
  /** Preferred position for the tooltip */
  position: CoachMarkPosition;
  /** The target element ID from the step layout */
  targetElementId: string | undefined;
}

export function useCoachMarkPositioning(
  stepId: string | undefined,
  stepLayouts: StepLayout[],
  screens: ScreenLayout[]
): CoachMarkTargetInfo {
  return useMemo(() => {
    if (!stepId) {
      return {
        targetSelector: undefined,
        position: "auto" as CoachMarkPosition,
        targetElementId: undefined,
      };
    }

    // Find the step layout for the current step
    const stepLayout = stepLayouts.find((sl) => sl.step_id === stepId);

    if (!stepLayout) {
      return {
        targetSelector: undefined,
        position: "auto" as CoachMarkPosition,
        targetElementId: undefined,
      };
    }

    // Build CSS selector using data attribute convention
    // The D365 renderer components will set data-element-id on rendered elements
    const targetSelector = stepLayout.target_element_id
      ? `[data-element-id="${stepLayout.target_element_id}"]`
      : undefined;

    // Map annotation_position to CoachMarkPosition
    const positionMap: Record<string, CoachMarkPosition> = {
      top: "top",
      bottom: "bottom",
      left: "left",
      right: "right",
      above: "top",
      below: "bottom",
    };

    const position: CoachMarkPosition =
      positionMap[stepLayout.annotation_position?.toLowerCase()] ?? "auto";

    return {
      targetSelector,
      position,
      targetElementId: stepLayout.target_element_id,
    };
  }, [stepId, stepLayouts, screens]);
}
