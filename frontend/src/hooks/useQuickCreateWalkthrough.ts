"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  ScreenLayout,
  StepLayout,
  TrainingAnnotation,
} from "@/types/trainingTrack";

/**
 * State returned by the Quick Create walkthrough hook.
 */
export interface QuickCreateWalkthroughState {
  /** Whether the Quick Create dialog is currently open */
  isOpen: boolean;
  /** The screen layout for the currently-open Quick Create form */
  activeScreen: ScreenLayout | null;
  /** Element IDs that should be highlighted on the current step */
  highlightedElementIds: string[];
  /** The current annotation for the Quick Create step (if any) */
  activeAnnotation: TrainingAnnotation | null;
  /** Open the Quick Create dialog for a specific screen */
  open: (screen: ScreenLayout) => void;
  /** Close the Quick Create dialog */
  close: () => void;
}

/**
 * Hook to manage Quick Create form visibility and highlighting
 * during a walkthrough sequence.
 *
 * When the walkthrough step references a `quick_create` screen,
 * this hook opens the Quick Create dialog and highlights the
 * target element specified in the step layout.
 *
 * Usage:
 * ```tsx
 * const qcWalkthrough = useQuickCreateWalkthrough(stepLayouts, screens);
 *
 * // Call on step change to auto-open/close quick create:
 * useEffect(() => {
 *   qcWalkthrough.syncWithStep(currentStepLayout, currentScreen);
 * }, [currentStepIndex]);
 * ```
 */
export function useQuickCreateWalkthrough(
  stepLayouts: StepLayout[],
  screens: ScreenLayout[]
): QuickCreateWalkthroughState & {
  /** Sync the quick create state with the current walkthrough step */
  syncWithStep: (
    currentAnnotation: TrainingAnnotation | null,
    currentStepLayout: StepLayout | null
  ) => void;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [highlightedElementIds, setHighlightedElementIds] = useState<string[]>(
    []
  );
  const [activeAnnotation, setActiveAnnotation] =
    useState<TrainingAnnotation | null>(null);

  // Resolve active screen from ID
  const activeScreen = useMemo(
    () => screens.find((s) => s.screen_id === activeScreenId) ?? null,
    [screens, activeScreenId]
  );

  // Open the Quick Create dialog for a specific screen
  const open = useCallback((screen: ScreenLayout) => {
    setActiveScreenId(screen.screen_id);
    setIsOpen(true);
  }, []);

  // Close the Quick Create dialog
  const close = useCallback(() => {
    setIsOpen(false);
    setActiveScreenId(null);
    setHighlightedElementIds([]);
    setActiveAnnotation(null);
  }, []);

  // Sync with current walkthrough step — auto-open/close and highlight
  const syncWithStep = useCallback(
    (
      currentAnnotation: TrainingAnnotation | null,
      currentStepLayout: StepLayout | null
    ) => {
      if (!currentAnnotation || !currentStepLayout) {
        // No step active — close if open
        if (isOpen) close();
        return;
      }

      // Find the screen for this step
      const screen = screens.find(
        (s) => s.screen_id === currentStepLayout.screen_id
      );

      if (screen?.screen_type === "quick_create") {
        // Auto-open the Quick Create dialog
        if (!isOpen || activeScreenId !== screen.screen_id) {
          setActiveScreenId(screen.screen_id);
          setIsOpen(true);
        }
        // Store the current annotation for Markdown rendering
        setActiveAnnotation(currentAnnotation);
        // Highlight the target element
        if (currentStepLayout.target_element_id) {
          setHighlightedElementIds([currentStepLayout.target_element_id]);
        } else {
          setHighlightedElementIds([]);
        }
      } else {
        // Step is not on a quick_create screen — close dialog
        if (isOpen) close();
      }
    },
    [screens, isOpen, activeScreenId, close]
  );

  return {
    isOpen,
    activeScreen,
    highlightedElementIds,
    activeAnnotation,
    open,
    close,
    syncWithStep,
  };
}
