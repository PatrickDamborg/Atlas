"use client";

import {
  Button,
  Text,
  Card,
  Badge,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Lightbulb24Regular,
  Info24Regular,
  ArrowReset24Regular,
  ShieldTask24Regular,
} from "@fluentui/react-icons";
import type {
  WalkthroughTrack,
  TrainingAnnotation,
  TrackNavigationState,
  StepLayout,
  ScreenLayout,
} from "@/types/trainingTrack";
import { CoachMarkOverlay } from "@/components/walkthrough/CoachMarkOverlay";
import { QuickCreateForm } from "@/components/d365-form/QuickCreateForm";
import { useStepResolver } from "@/hooks/useStepResolver";
import { useQuickCreateWalkthrough } from "@/hooks/useQuickCreateWalkthrough";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    flex: 1,
    overflow: "hidden",
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  stepProgress: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  progressBar: {
    width: "200px",
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
  stepContent: {
    flex: 1,
    overflowY: "auto",
    padding: tokens.spacingVerticalXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
  },
  annotationCard: {
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  annotationTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  instruction: {
    lineHeight: "1.6",
    marginBottom: tokens.spacingVerticalL,
  },
  detailSection: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalS,
  },
  tipsSection: {
    marginTop: tokens.spacingVerticalM,
  },
  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS,
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  tipIcon: {
    color: tokens.colorPaletteYellowForeground1,
    marginTop: "2px",
    flexShrink: 0,
  },
  stepNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  navButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    height: "100%",
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
  },
  objectives: {
    marginBottom: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  objectivesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  objectiveItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  /** Visual treatment for text-only (business rule) annotation steps */
  textStepBadge: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  businessRuleName: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
});

interface StepViewerProps {
  track: WalkthroughTrack;
  navState: TrackNavigationState;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (stepIndex: number) => void;
  onReset: () => void;
  isFirst: boolean;
  isLast: boolean;
  /** Step layouts from the UX Expert agent (enables CoachMark overlay) */
  stepLayouts?: StepLayout[];
  /** Screen layouts from the UX Expert agent (enables CoachMark overlay) */
  screens?: ScreenLayout[];
  /** Whether the CoachMark overlay mode is active */
  overlayActive?: boolean;
  /** Callback when overlay is dismissed */
  onOverlayDismiss?: () => void;
}

export function StepViewer({
  track,
  navState,
  onNext,
  onPrev,
  onGoToStep,
  onReset,
  isFirst,
  isLast,
  stepLayouts = [],
  screens = [],
  overlayActive = false,
  onOverlayDismiss,
}: StepViewerProps) {
  const styles = useStyles();

  const currentAnnotation: TrainingAnnotation | undefined =
    track.annotations[navState.currentStepIndex];

  // Resolve step to layout/target for CoachMark overlay
  const resolvedStep = useStepResolver(
    track.annotations,
    stepLayouts,
    screens,
    navState.currentStepIndex
  );

  // Quick Create form integration — auto-opens when step targets a quick_create screen
  const quickCreate = useQuickCreateWalkthrough(stepLayouts, screens);

  // Sync Quick Create dialog with current step
  // (opens/closes the dialog and highlights the target element automatically)
  const currentStepLayout =
    stepLayouts.find(
      (sl) => sl.step_id === currentAnnotation?.step_id
    ) ?? null;

  // We use a React effect-like pattern inline — the hook's syncWithStep
  // handles idempotent open/close based on screen type
  if (currentAnnotation && currentStepLayout) {
    // Check if current step is on a quick_create screen
    const stepScreen = screens.find(
      (s) => s.screen_id === currentStepLayout.screen_id
    );
    if (stepScreen?.screen_type === "quick_create" && !quickCreate.isOpen) {
      quickCreate.syncWithStep(currentAnnotation, currentStepLayout);
    } else if (stepScreen?.screen_type !== "quick_create" && quickCreate.isOpen) {
      quickCreate.close();
    }
  }

  const progressPercent =
    track.annotations.length > 0
      ? ((navState.currentStepIndex + 1) / track.annotations.length) * 100
      : 0;

  if (track.annotations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Info24Regular style={{ fontSize: "48px", width: "48px", height: "48px" }} />
          <Text size={500} weight="semibold">
            No Steps Available
          </Text>
          <Text size={300}>
            This training track does not contain any walkthrough steps yet.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Step header with progress */}
      <div className={styles.stepHeader}>
        <Text size={400} weight="semibold">
          {track.title}
        </Text>
        <div className={styles.stepProgress}>
          <Text size={200}>
            Step {navState.currentStepIndex + 1} of {track.annotations.length}
          </Text>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {navState.completed && (
            <Badge appearance="filled" color="success" size="small">
              Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Step content */}
      <div className={styles.stepContent}>
        {/* Learning objectives on first step */}
        {navState.currentStepIndex === 0 && track.learning_objectives.length > 0 && (
          <div className={styles.objectives}>
            <Text size={300} weight="semibold" block>
              Learning Objectives
            </Text>
            <ul className={styles.objectivesList}>
              {track.learning_objectives.map((obj, idx) => (
                <li key={idx} className={styles.objectiveItem}>
                  <Badge appearance="outline" color="brand" size="small">
                    {idx + 1}
                  </Badge>
                  <Text size={200}>{obj}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Current annotation */}
        {currentAnnotation && (
          <Card className={styles.annotationCard}>
            <div className={styles.annotationTitle}>
              <Badge
                appearance="filled"
                color={currentAnnotation.step_type === "text" ? "warning" : "brand"}
                size="medium"
              >
                {navState.currentStepIndex + 1}
              </Badge>
              <Text size={500} weight="semibold">
                {currentAnnotation.title || `Step ${navState.currentStepIndex + 1}`}
              </Text>
            </div>

            {/* Business rule badge for text-only steps */}
            {currentAnnotation.step_type === "text" && (
              <div className={styles.textStepBadge}>
                <Badge
                  appearance="outline"
                  color="warning"
                  size="medium"
                  icon={<ShieldTask24Regular />}
                >
                  Business Rule
                </Badge>
              </div>
            )}

            {/* Business rule name */}
            {currentAnnotation.step_type === "text" &&
              currentAnnotation.business_rule_name && (
                <div className={styles.businessRuleName}>
                  <ShieldTask24Regular
                    style={{ fontSize: "16px", flexShrink: 0 }}
                  />
                  <Text size={200} weight="semibold">
                    {currentAnnotation.business_rule_name}
                  </Text>
                </div>
              )}

            {/* Instruction */}
            {currentAnnotation.instruction && (
              <div className={styles.instruction}>
                <Text size={300}>{currentAnnotation.instruction}</Text>
              </div>
            )}

            {/* Tooltip text */}
            {currentAnnotation.tooltip_text && (
              <div style={{ marginBottom: tokens.spacingVerticalM }}>
                <Badge appearance="tint" color="informative" size="small">
                  Hint
                </Badge>
                <Text
                  size={200}
                  style={{
                    marginLeft: tokens.spacingHorizontalS,
                    color: tokens.colorNeutralForeground3,
                  }}
                >
                  {currentAnnotation.tooltip_text}
                </Text>
              </div>
            )}

            {/* Detail section */}
            {currentAnnotation.detail_text && (
              <div className={styles.detailSection}>
                <div className={styles.detailHeader}>
                  <Info24Regular style={{ fontSize: "16px" }} />
                  <Text size={200} weight="semibold">
                    More Detail
                  </Text>
                </div>
                <Text size={200}>{currentAnnotation.detail_text}</Text>
              </div>
            )}

            {/* Tips */}
            {currentAnnotation.tips.length > 0 && (
              <div className={styles.tipsSection}>
                <Divider />
                <div className={styles.tipsList}>
                  {currentAnnotation.tips.map((tip, idx) => (
                    <div key={idx} className={styles.tipItem}>
                      <Lightbulb24Regular
                        className={styles.tipIcon}
                        style={{ fontSize: "16px", width: "16px", height: "16px" }}
                      />
                      <Text size={200}>{tip}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Navigation bar */}
      <div className={styles.stepNav}>
        <div className={styles.navButtons}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            disabled={isFirst}
            onClick={onPrev}
          >
            Previous
          </Button>
        </div>
        <div className={styles.navButtons}>
          {navState.completed && (
            <Button
              appearance="subtle"
              icon={<ArrowReset24Regular />}
              onClick={onReset}
            >
              Restart
            </Button>
          )}
          <Button
            appearance="primary"
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            disabled={isLast}
            onClick={onNext}
          >
            {isLast ? "Finished" : "Next"}
          </Button>
        </div>
      </div>

      {/* Quick Create form dialog — auto-opens for quick_create steps */}
      {quickCreate.isOpen && quickCreate.activeScreen && (
        <QuickCreateForm
          screen={quickCreate.activeScreen}
          open={quickCreate.isOpen}
          onClose={quickCreate.close}
          highlightedElementIds={quickCreate.highlightedElementIds}
          annotation={quickCreate.activeAnnotation}
          stepIndex={navState.currentStepIndex}
          totalSteps={track.annotations.length}
        />
      )}

      {/* CoachMark overlay: renders on top of D365 renderer elements */}
      {overlayActive && resolvedStep && (
        <CoachMarkOverlay
          step={resolvedStep}
          stepIndex={navState.currentStepIndex}
          totalSteps={track.annotations.length}
          isFirst={isFirst}
          isLast={isLast}
          onNext={onNext}
          onPrev={onPrev}
          onDismiss={onOverlayDismiss}
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
    </div>
  );
}
