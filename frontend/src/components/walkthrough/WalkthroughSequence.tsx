"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Button,
  Text,
  Badge,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Play24Regular,
  ArrowReset24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import { CoachMarkOverlay } from "./CoachMarkOverlay";
import { useStepResolver } from "@/hooks/useStepResolver";
import type {
  WalkthroughTrack,
  StepLayout,
  ScreenLayout,
  TrackNavigationState,
  TrainingAnnotation,
} from "@/types/trainingTrack";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  controlBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "40px",
  },
  controlLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  controlRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  progressInfo: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  progressBar: {
    width: "120px",
    height: "4px",
    borderRadius: "2px",
    backgroundColor: tokens.colorNeutralBackground5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: "2px",
    transitionProperty: "width",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },
});

// ── Types ─────────────────────────────────────────────────────────────

export interface WalkthroughSequenceProps {
  /** The current walkthrough track */
  track: WalkthroughTrack;
  /** Navigation state from useTrackNavigation */
  navState: TrackNavigationState;
  /** All step layouts from the training content */
  stepLayouts: StepLayout[];
  /** All screen layouts from the training content */
  screens: ScreenLayout[];
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

/**
 * WalkthroughSequence integrates the sequence manager (track navigation)
 * with the CoachMark overlay. It resolves the current step to its layout
 * and target element, then renders the CoachMark with the correct content
 * and highlight position.
 *
 * Usage: Place this component alongside the D365 renderer. When the
 * walkthrough is active, it overlays coach marks on top of the renderer
 * elements, highlighting the correct target for each step in order.
 */
export function WalkthroughSequence({
  track,
  navState,
  stepLayouts,
  screens,
  onNext,
  onPrev,
  onGoToStep,
  onReset,
  isFirst,
  isLast,
}: WalkthroughSequenceProps) {
  const styles = useStyles();
  const [isActive, setIsActive] = useState(false);

  // Filter out disabled steps — only show enabled steps to end users
  const enabledAnnotations: TrainingAnnotation[] = useMemo(() => {
    const disabledSet = new Set(track.disabled_step_ids ?? []);
    if (disabledSet.size === 0) return track.annotations;
    return track.annotations.filter((a) => !disabledSet.has(a.step_id));
  }, [track.annotations, track.disabled_step_ids]);

  // Resolve current step to its annotation, layout, and target element
  // Use enabledAnnotations so disabled steps are skipped
  const resolvedStep = useStepResolver(
    enabledAnnotations,
    stepLayouts,
    screens,
    navState.currentStepIndex
  );

  // Use enabled annotation count for progress
  const effectiveTotalSteps = enabledAnnotations.length;

  const progressPercent = useMemo(() => {
    if (effectiveTotalSteps === 0) return 0;
    return ((navState.currentStepIndex + 1) / effectiveTotalSteps) * 100;
  }, [navState.currentStepIndex, effectiveTotalSteps]);

  const handleStart = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      // Advance to finish, then close overlay
      onNext();
      setIsActive(false);
    } else {
      onNext();
    }
  }, [isLast, onNext]);

  const handleRestart = useCallback(() => {
    onReset();
    setIsActive(true);
  }, [onReset]);

  if (enabledAnnotations.length === 0) {
    return null;
  }

  return (
    <>
      {/* Control bar: start/restart walkthrough */}
      <div className={styles.controlBar}>
        <div className={styles.controlLeft}>
          <Text size={300} weight="semibold">
            {track.title}
          </Text>
          <div className={styles.progressInfo}>
            <Text size={100}>
              Step {navState.currentStepIndex + 1} of {effectiveTotalSteps}
            </Text>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {navState.completed && (
              <Badge appearance="filled" color="success" size="small">
                <Checkmark24Regular
                  style={{ fontSize: "12px", marginRight: "2px" }}
                />
                Complete
              </Badge>
            )}
          </div>
        </div>

        <div className={styles.controlRight}>
          {navState.completed && (
            <Button
              appearance="subtle"
              icon={<ArrowReset24Regular />}
              size="small"
              onClick={handleRestart}
            >
              Restart
            </Button>
          )}
          {!isActive ? (
            <Button
              appearance="primary"
              icon={<Play24Regular />}
              size="small"
              onClick={handleStart}
            >
              {navState.currentStepIndex > 0 && !navState.completed
                ? "Resume Walkthrough"
                : navState.completed
                ? "Replay Walkthrough"
                : "Start Walkthrough"}
            </Button>
          ) : (
            <Button
              appearance="subtle"
              size="small"
              onClick={handleDismiss}
            >
              Pause
            </Button>
          )}
        </div>
      </div>

      {/* CoachMark overlay (only when walkthrough is active) */}
      {isActive && resolvedStep && (
        <CoachMarkOverlay
          step={resolvedStep}
          stepIndex={navState.currentStepIndex}
          totalSteps={effectiveTotalSteps}
          isFirst={isFirst}
          isLast={isLast}
          onNext={handleNext}
          onPrev={onPrev}
          onDismiss={handleDismiss}
          preferredPosition={
            resolvedStep.layout?.annotation_position as
              | "top"
              | "bottom"
              | "left"
              | "right"
              | undefined ?? "auto"
          }
        />
      )}
    </>
  );
}
