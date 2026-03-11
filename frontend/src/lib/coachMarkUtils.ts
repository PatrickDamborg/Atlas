/**
 * Utility functions for building coach mark steps from pipeline output.
 *
 * Converts StepLayout + TrainingAnnotation pairs (from the AI pipeline)
 * into CoachMarkStep objects consumed by the CoachMarkProvider.
 */

import type {
  CoachMarkStep,
  CoachMarkPlacement,
  CoachMarkHighlightStyle,
} from "@/types/coachMark";
import type {
  StepLayout,
  TrainingAnnotation,
  WalkthroughTrack,
  AppTrainingContent,
} from "@/types/trainingTrack";

/** Map pipeline annotation_position strings to CoachMarkPlacement */
function parsePlacement(position: string): CoachMarkPlacement {
  const normalized = position.toLowerCase().trim();
  switch (normalized) {
    case "above":
    case "top":
      return "above";
    case "below":
    case "bottom":
      return "below";
    case "before":
    case "left":
      return "before";
    case "after":
    case "right":
      return "after";
    default:
      return "below";
  }
}

/** Map pipeline highlight_style strings to CoachMarkHighlightStyle */
function parseHighlightStyle(style: string): CoachMarkHighlightStyle {
  const normalized = style.toLowerCase().trim();
  switch (normalized) {
    case "outline":
      return "outline";
    case "pulse":
      return "pulse";
    case "spotlight":
      return "spotlight";
    case "none":
      return "none";
    default:
      return "outline";
  }
}

/**
 * Build an ordered list of CoachMarkSteps for a walkthrough track
 * by joining StepLayouts with TrainingAnnotations.
 *
 * Steps are ordered by their position in the track's annotations array,
 * which defines the guided linear sequence.
 */
export function buildCoachMarkSteps(
  track: WalkthroughTrack,
  stepLayouts: StepLayout[]
): CoachMarkStep[] {
  // Index layouts by step_id for fast lookup
  const layoutMap = new Map<string, StepLayout>();
  for (const layout of stepLayouts) {
    layoutMap.set(layout.step_id, layout);
  }

  return track.annotations.map((annotation: TrainingAnnotation) => {
    const layout = layoutMap.get(annotation.step_id);
    const isText = annotation.step_type === "text";

    return {
      stepId: annotation.step_id,
      screenId: layout?.screen_id ?? "",
      // Text-only steps (business rules) have no target element
      targetElementId: isText ? "" : (layout?.target_element_id ?? ""),
      placement: parsePlacement(layout?.annotation_position ?? "below"),
      highlightStyle: isText ? "none" as const : parseHighlightStyle(layout?.highlight_style ?? "outline"),
      stepType: annotation.step_type ?? "interactive",
      title: annotation.title,
      instruction: annotation.instruction,
      tooltipText: annotation.tooltip_text,
      detailText: annotation.detail_text,
      tips: annotation.tips,
      businessRuleName: annotation.business_rule_name ?? null,
    };
  });
}

/**
 * Build coach mark steps for a specific track within loaded app training content.
 *
 * Convenience wrapper that extracts the relevant step_layouts
 * from AppTrainingContent.
 */
export function buildCoachMarkStepsFromContent(
  content: AppTrainingContent,
  trackId: string
): CoachMarkStep[] {
  const track = content.tracks.find((t) => t.track_id === trackId);
  if (!track) return [];

  return buildCoachMarkSteps(track, content.step_layouts);
}

/**
 * Get the screen ID for the currently active coach mark step.
 * Used to determine which D365 screen/view to render.
 */
export function getActiveScreenId(
  steps: CoachMarkStep[],
  currentIndex: number
): string | null {
  if (currentIndex < 0 || currentIndex >= steps.length) return null;
  return steps[currentIndex].screenId || null;
}
