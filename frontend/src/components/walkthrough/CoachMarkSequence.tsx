"use client";

import { useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
  Button,
  Text,
  Card,
  Badge,
  makeStyles,
  tokens,
  ProgressBar,
} from "@fluentui/react-components";
import {
  Checkmark24Regular,
  CheckmarkCircle48Regular,
  ArrowReset24Regular,
  Play24Regular,
  Dismiss24Regular,
  Trophy24Regular,
} from "@fluentui/react-icons";
import { CoachMarkOverlay } from "./CoachMarkOverlay";
import { useCoachMark, CoachMarkProvider } from "@/contexts/CoachMarkContext";
import { useStepResolver } from "@/hooks/useStepResolver";
import { buildCoachMarkSteps } from "@/lib/coachMarkUtils";
import type { CoachMarkStep } from "@/types/coachMark";
import type {
  WalkthroughTrack,
  StepLayout,
  ScreenLayout,
  TrainingAnnotation,
} from "@/types/trainingTrack";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  completionOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  completionCard: {
    maxWidth: "480px",
    minWidth: "360px",
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    boxShadow: tokens.shadow28,
  },
  completionIcon: {
    display: "flex",
    justifyContent: "center",
    marginBottom: tokens.spacingVerticalL,
  },
  completionIconCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: tokens.colorPaletteGreenBackground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  completionTitle: {
    marginBottom: tokens.spacingVerticalM,
  },
  completionDescription: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
  },
  completionStats: {
    display: "flex",
    justifyContent: "center",
    gap: tokens.spacingHorizontalXL,
    marginBottom: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXXS,
  },
  objectivesList: {
    textAlign: "left",
    marginBottom: tokens.spacingVerticalL,
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  objectiveItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  completionActions: {
    display: "flex",
    justifyContent: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
});

// ── Completion Screen ─────────────────────────────────────────────────

interface CompletionScreenProps {
  /** The track that was completed */
  track: WalkthroughTrack;
  /** Total steps completed */
  totalSteps: number;
  /** Called when user wants to restart the walkthrough */
  onRestart: () => void;
  /** Called when user wants to close/dismiss the completion screen */
  onClose: () => void;
}

function CompletionScreen({
  track,
  totalSteps,
  onRestart,
  onClose,
}: CompletionScreenProps) {
  const styles = useStyles();

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.completionOverlay}
      role="dialog"
      aria-label="Walkthrough completed"
    >
      <Card className={styles.completionCard}>
        {/* Success icon */}
        <div className={styles.completionIcon}>
          <div className={styles.completionIconCircle}>
            <Trophy24Regular
              style={{
                fontSize: "40px",
                width: "40px",
                height: "40px",
                color: tokens.colorPaletteGreenForeground1,
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className={styles.completionTitle}>
          <Text size={600} weight="bold" block>
            Walkthrough Complete!
          </Text>
        </div>

        {/* Description */}
        <div className={styles.completionDescription}>
          <Text size={300} block>
            You have successfully completed all {totalSteps} steps in{" "}
            <Text weight="semibold">{track.title}</Text>.
          </Text>
        </div>

        {/* Stats */}
        <div className={styles.completionStats}>
          <div className={styles.statItem}>
            <Text size={600} weight="bold">
              {totalSteps}
            </Text>
            <Text size={100}>Steps Completed</Text>
          </div>
          {track.estimated_duration_minutes > 0 && (
            <div className={styles.statItem}>
              <Text size={600} weight="bold">
                ~{track.estimated_duration_minutes}
              </Text>
              <Text size={100}>Minutes</Text>
            </div>
          )}
        </div>

        {/* Learning objectives achieved */}
        {track.learning_objectives.length > 0 && (
          <ul className={styles.objectivesList}>
            {track.learning_objectives.map((objective, idx) => (
              <li key={idx} className={styles.objectiveItem}>
                <Checkmark24Regular
                  style={{
                    color: tokens.colorPaletteGreenForeground1,
                    flexShrink: 0,
                  }}
                />
                <Text size={200}>{objective}</Text>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className={styles.completionActions}>
          <Button
            appearance="subtle"
            icon={<ArrowReset24Regular />}
            onClick={onRestart}
          >
            Restart
          </Button>
          <Button
            appearance="primary"
            icon={<Checkmark24Regular />}
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── CoachMarkSequence Inner (consumes CoachMarkContext) ────────────────

interface CoachMarkSequenceInnerProps {
  /** The walkthrough track to sequence through */
  track: WalkthroughTrack;
  /** All step layouts from training content */
  stepLayouts: StepLayout[];
  /** All screen layouts from training content */
  screens: ScreenLayout[];
  /** Children rendered behind the overlay (e.g. the D365 renderer) */
  children?: ReactNode;
  /** Callback when the entire sequence is completed */
  onComplete?: (trackId: string) => void;
  /** Callback when the sequence is dismissed without completing */
  onDismiss?: () => void;
  /** Optional: resume from a specific step index (for progress restore) */
  initialStepIndex?: number;
}

function CoachMarkSequenceInner({
  track,
  stepLayouts,
  screens,
  children,
  onComplete,
  onDismiss,
  initialStepIndex = 0,
}: CoachMarkSequenceInnerProps) {
  const styles = useStyles();
  const ctx = useCoachMark();

  // Filter out disabled steps
  const enabledAnnotations: TrainingAnnotation[] = useMemo(() => {
    const disabledSet = new Set(track.disabled_step_ids ?? []);
    if (disabledSet.size === 0) return track.annotations;
    return track.annotations.filter((a) => !disabledSet.has(a.step_id));
  }, [track.annotations, track.disabled_step_ids]);

  const effectiveTotalSteps = enabledAnnotations.length;

  // Build coach mark steps and load them into the context on mount
  useEffect(() => {
    const steps = buildCoachMarkSteps(track, stepLayouts);

    // Filter out disabled steps
    const disabledSet = new Set(track.disabled_step_ids ?? []);
    const enabledSteps =
      disabledSet.size === 0
        ? steps
        : steps.filter((s) => !disabledSet.has(s.stepId));

    ctx.loadSteps(enabledSteps);

    // If resuming from a specific step, jump to it
    if (initialStepIndex > 0 && initialStepIndex < enabledSteps.length) {
      ctx.goToStep(initialStepIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.track_id]);

  // Resolve current step annotation to layout/screen/target
  const resolvedStep = useStepResolver(
    enabledAnnotations,
    stepLayouts,
    screens,
    ctx.currentIndex
  );

  // Handle next: advance or complete
  const handleNext = useCallback(() => {
    if (ctx.isLastStep) {
      ctx.complete();
    } else {
      ctx.next();
    }
  }, [ctx]);

  // Handle previous
  const handlePrev = useCallback(() => {
    ctx.previous();
  }, [ctx]);

  // Handle dismiss (pause without completing)
  const handleDismiss = useCallback(() => {
    ctx.dismiss();
    onDismiss?.();
  }, [ctx, onDismiss]);

  // Handle completion screen close
  const handleCompletionClose = useCallback(() => {
    ctx.dismiss();
    onComplete?.(track.track_id);
  }, [ctx, onComplete, track.track_id]);

  // Handle restart from completion screen
  const handleRestart = useCallback(() => {
    ctx.reset();
  }, [ctx]);

  // If no steps, render children only
  if (effectiveTotalSteps === 0) {
    return <>{children}</>;
  }

  return (
    <>
      {/* The underlying content (D365 renderer) */}
      {children}

      {/* Coach mark overlay for the current step */}
      {ctx.isActive && !ctx.isCompleted && resolvedStep && (
        <CoachMarkOverlay
          step={resolvedStep}
          stepIndex={ctx.currentIndex}
          totalSteps={effectiveTotalSteps}
          isFirst={ctx.isFirstStep}
          isLast={ctx.isLastStep}
          onNext={handleNext}
          onPrev={handlePrev}
          onDismiss={handleDismiss}
          preferredPosition={
            (resolvedStep.layout?.annotation_position as
              | "top"
              | "bottom"
              | "left"
              | "right"
              | undefined) ?? "auto"
          }
        />
      )}

      {/* Completion screen displayed when final step is advanced */}
      {ctx.isCompleted && (
        <CompletionScreen
          track={track}
          totalSteps={effectiveTotalSteps}
          onRestart={handleRestart}
          onClose={handleCompletionClose}
        />
      )}
    </>
  );
}

// ── CoachMarkSequence (public API, wraps with Provider) ───────────────

export interface CoachMarkSequenceProps {
  /** The walkthrough track to sequence through */
  track: WalkthroughTrack;
  /** All step layouts from training content */
  stepLayouts: StepLayout[];
  /** All screen layouts from training content */
  screens: ScreenLayout[];
  /** Children rendered behind the overlay (e.g. the D365 renderer) */
  children?: ReactNode;
  /** Callback when the entire sequence is completed */
  onComplete?: (trackId: string) => void;
  /** Callback when the sequence is dismissed without completing */
  onDismiss?: () => void;
  /** Optional: resume from a specific step index (for progress restore) */
  initialStepIndex?: number;
}

/**
 * CoachMarkSequence is the top-level container that manages linear
 * progression through an ordered list of coach mark steps.
 *
 * It wraps the content (typically the D365 renderer) and overlays
 * coach marks one at a time, advancing on "Next", going back on
 * "Previous", and displaying a completion screen when the user
 * finishes the final step.
 *
 * ## Key features:
 * - **Linear progression**: Steps advance strictly in order via Next/Back
 * - **Step index tracking**: Current position is managed in context and
 *   can be restored on resume via `initialStepIndex`
 * - **Disabled step filtering**: Steps marked as disabled by the consultant
 *   are automatically skipped
 * - **Completion screen**: A celebration/summary screen appears after the
 *   user advances past the last step, showing stats and learning objectives
 * - **Keyboard navigation**: Arrow keys, Enter, and Escape work for
 *   Next, Previous, and Dismiss respectively
 *
 * @example
 * ```tsx
 * <CoachMarkSequence
 *   track={activeTrack}
 *   stepLayouts={content.step_layouts}
 *   screens={content.screens}
 *   onComplete={(trackId) => reportProgress(trackId)}
 *   initialStepIndex={savedProgress?.lastStepIndex ?? 0}
 * >
 *   <D365ChromeLayout ... />
 * </CoachMarkSequence>
 * ```
 */
export function CoachMarkSequence({
  track,
  stepLayouts,
  screens,
  children,
  onComplete,
  onDismiss,
  initialStepIndex = 0,
}: CoachMarkSequenceProps) {
  return (
    <CoachMarkProvider trackId={track.track_id} onComplete={onComplete}>
      <CoachMarkSequenceInner
        track={track}
        stepLayouts={stepLayouts}
        screens={screens}
        onComplete={onComplete}
        onDismiss={onDismiss}
        initialStepIndex={initialStepIndex}
      >
        {children}
      </CoachMarkSequenceInner>
    </CoachMarkProvider>
  );
}
