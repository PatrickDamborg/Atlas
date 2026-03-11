"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  CoachMarkStep,
  CoachMarkSequenceState,
  CoachMarkContextValue,
  OnCoachMarkComplete,
} from "@/types/coachMark";

// ── Internal state & reducer ────────────────────────────────────────

interface InternalState {
  steps: CoachMarkStep[];
  currentIndex: number;
  isCompleted: boolean;
  isActive: boolean;
}

type Action =
  | { type: "LOAD_STEPS"; steps: CoachMarkStep[] }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "GO_TO_STEP"; index: number }
  | { type: "COMPLETE" }
  | { type: "RESET" }
  | { type: "DISMISS" }
  | { type: "RESUME" };

const initialState: InternalState = {
  steps: [],
  currentIndex: 0,
  isCompleted: false,
  isActive: false,
};

function clampIndex(index: number, totalSteps: number): number {
  if (totalSteps === 0) return 0;
  return Math.max(0, Math.min(index, totalSteps - 1));
}

function coachMarkReducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case "LOAD_STEPS":
      return {
        steps: action.steps,
        currentIndex: 0,
        isCompleted: false,
        isActive: action.steps.length > 0,
      };

    case "NEXT": {
      if (!state.isActive || state.steps.length === 0) return state;
      const isLast = state.currentIndex >= state.steps.length - 1;
      if (isLast) {
        // At last step — mark completed
        return { ...state, isCompleted: true };
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isCompleted: false,
      };
    }

    case "PREVIOUS": {
      if (!state.isActive || state.currentIndex === 0) return state;
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        isCompleted: false,
      };
    }

    case "GO_TO_STEP": {
      const clamped = clampIndex(action.index, state.steps.length);
      return {
        ...state,
        currentIndex: clamped,
        isCompleted: false,
        isActive: state.steps.length > 0,
      };
    }

    case "COMPLETE":
      return { ...state, isCompleted: true };

    case "RESET":
      return {
        ...state,
        currentIndex: 0,
        isCompleted: false,
        isActive: state.steps.length > 0,
      };

    case "DISMISS":
      return { ...state, isActive: false };

    case "RESUME":
      return {
        ...state,
        isActive: state.steps.length > 0,
      };

    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────

const CoachMarkContext = createContext<CoachMarkContextValue | null>(null);
CoachMarkContext.displayName = "CoachMarkContext";

// ── Provider ────────────────────────────────────────────────────────

interface CoachMarkProviderProps {
  children: ReactNode;
  /** Optional callback when the full sequence is completed */
  onComplete?: OnCoachMarkComplete;
  /** Track ID for the current walkthrough (passed to onComplete) */
  trackId?: string;
}

export function CoachMarkProvider({
  children,
  onComplete,
  trackId,
}: CoachMarkProviderProps) {
  const [state, dispatch] = useReducer(coachMarkReducer, initialState);

  // ── Derived state ───────────────────────────────────────────────

  const sequenceState: CoachMarkSequenceState = useMemo(() => {
    const totalSteps = state.steps.length;
    const currentStep =
      totalSteps > 0 && state.currentIndex < totalSteps
        ? state.steps[state.currentIndex]
        : null;
    const isFirstStep = state.currentIndex === 0;
    const isLastStep = totalSteps === 0 || state.currentIndex >= totalSteps - 1;
    const progressPercent =
      totalSteps > 0
        ? Math.round(((state.currentIndex + 1) / totalSteps) * 100)
        : 0;

    return {
      steps: state.steps,
      currentIndex: state.currentIndex,
      totalSteps,
      isCompleted: state.isCompleted,
      isActive: state.isActive,
      currentStep,
      isFirstStep,
      isLastStep,
      progressPercent,
    };
  }, [state]);

  // ── Actions ─────────────────────────────────────────────────────

  const loadSteps = useCallback((steps: CoachMarkStep[]) => {
    dispatch({ type: "LOAD_STEPS", steps });
  }, []);

  const next = useCallback(() => {
    // If already at last step, trigger completion
    const isLast =
      state.steps.length > 0 &&
      state.currentIndex >= state.steps.length - 1;

    if (isLast && !state.isCompleted) {
      dispatch({ type: "COMPLETE" });
      if (onComplete && trackId) {
        onComplete(trackId);
      }
    } else {
      dispatch({ type: "NEXT" });
    }
  }, [state.currentIndex, state.steps.length, state.isCompleted, onComplete, trackId]);

  const previous = useCallback(() => {
    dispatch({ type: "PREVIOUS" });
  }, []);

  const goToStep = useCallback((index: number) => {
    dispatch({ type: "GO_TO_STEP", index });
  }, []);

  const complete = useCallback(() => {
    dispatch({ type: "COMPLETE" });
    if (onComplete && trackId) {
      onComplete(trackId);
    }
  }, [onComplete, trackId]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const dismiss = useCallback(() => {
    dispatch({ type: "DISMISS" });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: "RESUME" });
  }, []);

  // ── Context value ───────────────────────────────────────────────

  const value: CoachMarkContextValue = useMemo(
    () => ({
      ...sequenceState,
      loadSteps,
      next,
      previous,
      goToStep,
      complete,
      reset,
      dismiss,
      resume,
    }),
    [sequenceState, loadSteps, next, previous, goToStep, complete, reset, dismiss, resume]
  );

  return (
    <CoachMarkContext.Provider value={value}>
      {children}
    </CoachMarkContext.Provider>
  );
}

// ── Consumer hook ───────────────────────────────────────────────────

/**
 * Hook to access the coach mark sequence manager.
 *
 * Must be used within a <CoachMarkProvider>.
 *
 * @example
 * ```tsx
 * const { currentStep, next, previous, isLastStep, progressPercent } = useCoachMark();
 *
 * if (currentStep) {
 *   return <Callout target={currentStep.targetElementId}>...</Callout>;
 * }
 * ```
 */
export function useCoachMark(): CoachMarkContextValue {
  const context = useContext(CoachMarkContext);
  if (!context) {
    throw new Error(
      "useCoachMark must be used within a <CoachMarkProvider>. " +
        "Wrap your walkthrough renderer tree with <CoachMarkProvider>."
    );
  }
  return context;
}
