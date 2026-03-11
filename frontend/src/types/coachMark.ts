/**
 * Types for the guided linear coach mark sequence manager.
 *
 * Coach marks are overlay callouts that highlight specific UI elements
 * in the D365 walkthrough renderer and guide the end user step-by-step
 * through a training track.
 */

/** Placement of the coach mark callout relative to the target element */
export type CoachMarkPlacement =
  | "above"
  | "below"
  | "before" // left in LTR
  | "after"; // right in LTR

/** Highlight style applied to the target element */
export type CoachMarkHighlightStyle =
  | "outline"   // Colored border around the element
  | "pulse"     // Animated pulse ring
  | "spotlight" // Dim everything except the target
  | "none";

/** A single coach mark step in the guided sequence */
export interface CoachMarkStep {
  /** Unique identifier for this step (matches StepLayout.step_id) */
  stepId: string;
  /** ID of the screen/view this step belongs to (matches ScreenLayout.screen_id) */
  screenId: string;
  /** CSS selector or element ID of the target element to highlight */
  targetElementId: string;
  /** Callout placement relative to the target */
  placement: CoachMarkPlacement;
  /** Highlight style for the target element */
  highlightStyle: CoachMarkHighlightStyle;
  /**
   * Whether this step targets a UI element (`"interactive"`) or is a
   * standalone text annotation (`"text"`, e.g. a business rule).
   * Defaults to `"interactive"` for backwards compatibility.
   */
  stepType: "interactive" | "text";
  /** Title displayed in the coach mark callout */
  title: string;
  /** Primary instruction text */
  instruction: string;
  /** Short tooltip/hint text */
  tooltipText: string;
  /** Expanded detail text (shown on demand) */
  detailText: string;
  /** Quick tips shown in the callout */
  tips: string[];
  /** Name of the business rule (only for text/business-rule steps). */
  businessRuleName?: string | null;
}

/** State of the coach mark sequence */
export interface CoachMarkSequenceState {
  /** Ordered list of coach mark steps */
  steps: CoachMarkStep[];
  /** Index of the currently active step (0-based) */
  currentIndex: number;
  /** Total number of steps in the sequence */
  totalSteps: number;
  /** Whether the sequence has been completed (reached the end) */
  isCompleted: boolean;
  /** Whether the sequence is currently active (visible) */
  isActive: boolean;
  /** The currently active coach mark step, or null if inactive/empty */
  currentStep: CoachMarkStep | null;
  /** Whether the current step is the first */
  isFirstStep: boolean;
  /** Whether the current step is the last */
  isLastStep: boolean;
  /** Progress as a percentage (0-100) */
  progressPercent: number;
}

/** Actions available on the coach mark sequence */
export interface CoachMarkActions {
  /** Load a new sequence of coach mark steps and activate */
  loadSteps: (steps: CoachMarkStep[]) => void;
  /** Advance to the next step; triggers onComplete callback if at last step */
  next: () => void;
  /** Go back to the previous step */
  previous: () => void;
  /** Jump to a specific step by index */
  goToStep: (index: number) => void;
  /** Mark the sequence as completed */
  complete: () => void;
  /** Reset the sequence to the first step */
  reset: () => void;
  /** Dismiss/deactivate the coach mark overlay without completing */
  dismiss: () => void;
  /** Reactivate a dismissed sequence at the current position */
  resume: () => void;
}

/** Combined context value */
export interface CoachMarkContextValue extends CoachMarkSequenceState, CoachMarkActions {}

/** Callback fired when the sequence is completed */
export type OnCoachMarkComplete = (trackId: string) => void;
