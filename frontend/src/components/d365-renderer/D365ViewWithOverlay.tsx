"use client";

import { useMemo } from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { D365ViewGrid } from "./D365ViewGrid";
import { D365FormRenderer } from "@/components/d365-form/D365FormRenderer";
import { WalkthroughSequence } from "@/components/walkthrough/WalkthroughSequence";
import { TargetRefRegistryProvider } from "@/contexts/TargetRefRegistry";
import type {
  ScreenLayout,
  StepLayout,
  WalkthroughTrack,
  TrackNavigationState,
} from "@/types/trainingTrack";

// ── Styles ───────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  gridArea: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  noScreenState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
  },
});

// ── Types ────────────────────────────────────────────────────────────────

export interface D365ViewWithOverlayProps {
  /** The current walkthrough track */
  track: WalkthroughTrack;
  /** Navigation state for the active track */
  navState: TrackNavigationState;
  /** All screen layouts from the training content */
  screens: ScreenLayout[];
  /** All step layouts from the training content */
  stepLayouts: StepLayout[];
  /** Go to next step */
  onNext: () => void;
  /** Go to previous step */
  onPrev: () => void;
  /** Go to a specific step index */
  onGoToStep: (index: number) => void;
  /** Reset track to beginning */
  onReset: () => void;
  /** Whether on first step */
  isFirst: boolean;
  /** Whether on last step */
  isLast: boolean;
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * D365ViewWithOverlay combines the D365ViewGrid with the WalkthroughSequence
 * overlay. It determines which screen to show based on the current step's
 * StepLayout, then renders the appropriate view/grid with the coach mark
 * overlay positioned on top.
 *
 * This is the main composite component for displaying a D365-like entity
 * view with a guided walkthrough step annotation overlay.
 */
export function D365ViewWithOverlay({
  track,
  navState,
  screens,
  stepLayouts,
  onNext,
  onPrev,
  onGoToStep,
  onReset,
  isFirst,
  isLast,
}: D365ViewWithOverlayProps) {
  const styles = useStyles();

  // Determine the current step and its associated screen
  const currentAnnotation = track.annotations[navState.currentStepIndex];

  const currentStepLayout = useMemo(() => {
    if (!currentAnnotation) return null;
    return (
      stepLayouts.find((sl) => sl.step_id === currentAnnotation.step_id) ?? null
    );
  }, [currentAnnotation, stepLayouts]);

  const currentScreen = useMemo(() => {
    if (!currentStepLayout) {
      // Fallback: find any view-type screen for this track
      return (
        screens.find(
          (s) =>
            s.screen_type === "view" ||
            s.screen_type === "grid" ||
            s.screen_type === "list"
        ) ?? screens[0] ?? null
      );
    }
    return (
      screens.find((s) => s.screen_id === currentStepLayout.screen_id) ?? null
    );
  }, [currentStepLayout, screens]);

  // Determine screen type for rendering
  const isFormScreen =
    currentScreen &&
    (currentScreen.screen_type === "form_view" ||
      currentScreen.screen_type === "form" ||
      currentScreen.screen_type === "main_form" ||
      // Heuristic: has form fields but no view columns
      (currentScreen.elements.some((el) => el.element_type === "form_field") &&
        !currentScreen.elements.some(
          (el) =>
            el.element_type === "column" ||
            el.element_type === "view_column" ||
            el.element_type === "grid_column"
        )));

  // Build field annotation map for form screens
  const fieldAnnotations = useMemo(() => {
    if (!isFormScreen || !currentAnnotation || !currentStepLayout || !currentScreen) {
      return {};
    }
    if (currentStepLayout.screen_id !== currentScreen.screen_id) return {};

    const targetId = currentStepLayout.target_element_id;
    if (!targetId) return {};

    const targetEl = currentScreen.elements.find(
      (el) => el.element_id === targetId
    );

    if (targetEl?.element_type === "form_field") {
      const text = currentAnnotation.instruction || currentAnnotation.detail_text || "";
      if (text.trim()) {
        return { [targetId]: text };
      }
    }
    return {};
  }, [isFormScreen, currentAnnotation, currentStepLayout, currentScreen]);

  if (!currentScreen) {
    return (
      <div className={styles.root}>
        <div className={styles.noScreenState}>
          <Text size={400} weight="semibold">
            No View Available
          </Text>
          <Text size={200}>
            No screen layout is associated with the current walkthrough step.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <TargetRefRegistryProvider>
      <div className={styles.root}>
        {/* Walkthrough control bar + overlay */}
        <WalkthroughSequence
          track={track}
          navState={navState}
          stepLayouts={stepLayouts}
          screens={screens}
          onNext={onNext}
          onPrev={onPrev}
          onGoToStep={onGoToStep}
          onReset={onReset}
          isFirst={isFirst}
          isLast={isLast}
        />

        {/* Render either the form or the grid based on screen type */}
        <div className={styles.gridArea}>
          {isFormScreen ? (
            <D365FormRenderer
              screen={currentScreen}
              highlightedElementId={currentStepLayout?.target_element_id}
              fieldAnnotations={fieldAnnotations}
            />
          ) : (
            <D365ViewGrid
              screen={currentScreen}
              activeStepLayout={currentStepLayout}
              activeAnnotation={currentAnnotation}
              highlightedElementId={currentStepLayout?.target_element_id}
            />
          )}
        </div>
      </div>
    </TargetRefRegistryProvider>
  );
}
