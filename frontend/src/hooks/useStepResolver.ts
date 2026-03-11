"use client";

import { useMemo } from "react";
import type {
  TrainingAnnotation,
  StepLayout,
  ScreenLayout,
  ScreenElement,
} from "@/types/trainingTrack";

/**
 * Resolved step data combining annotation content with layout/target info.
 */
export interface ResolvedStep {
  /** The annotation content (title, instruction, Markdown, tips) */
  annotation: TrainingAnnotation;
  /** The layout positioning info for this step */
  layout: StepLayout | null;
  /** The screen this step belongs to */
  screen: ScreenLayout | null;
  /** The target element to highlight */
  targetElement: ScreenElement | null;
}

/**
 * Hook that resolves the current step's annotation, layout, screen,
 * and target element from the combined training content.
 *
 * This bridges the sequence manager (which tracks step index) with
 * the CoachMark overlay (which needs to know what to highlight and
 * where to position the callout).
 */
export function useStepResolver(
  annotations: TrainingAnnotation[],
  stepLayouts: StepLayout[],
  screens: ScreenLayout[],
  currentStepIndex: number
): ResolvedStep | null {
  return useMemo(() => {
    const annotation = annotations[currentStepIndex];
    if (!annotation) return null;

    // Find the matching StepLayout by step_id
    const layout =
      stepLayouts.find((sl) => sl.step_id === annotation.step_id) ?? null;

    // Find the screen this step is on
    const screen = layout
      ? screens.find((s) => s.screen_id === layout.screen_id) ?? null
      : null;

    // Find the target element within the screen
    const targetElement =
      layout && screen
        ? screen.elements.find(
            (el) => el.element_id === layout.target_element_id
          ) ?? null
        : null;

    return { annotation, layout, screen, targetElement };
  }, [annotations, stepLayouts, screens, currentStepIndex]);
}
