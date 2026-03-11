"use client";

/**
 * PipelineProgress — real-time progress display for the 3-agent AI pipeline.
 *
 * Shows step-by-step completion status with visual indicators for each
 * agent stage (Entity Analyser → Walkthrough Generator → Documentation
 * Generator) as SSE events stream from the backend.
 *
 * Uses Fluent UI React components for consistent D365-like styling.
 */

import { useCallback } from "react";
import {
  Button,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Spinner,
  Text,
  Subtitle1,
  Body1,
  Caption1,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowClockwise24Regular,
  Checkmark24Filled,
  Dismiss24Regular,
  DocumentSearch24Regular,
  ErrorCircle24Filled,
  Play24Filled,
  PresenceBlocked24Regular,
  Sparkle24Regular,
  TextDescription24Regular,
} from "@fluentui/react-icons";

import { usePipelineSSE } from "@/hooks/usePipelineSSE";
import {
  AGENT_STAGE_LABELS,
  AGENT_STAGE_DESCRIPTIONS,
  AGENT_STAGES,
  type AgentStage,
  type PipelineState,
  type StageState,
  type StageStatus,
} from "@/types/pipeline";

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: tokens.spacingHorizontalXXL,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  stageList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  stageCard: {
    padding: tokens.spacingHorizontalL,
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  },
  stageCardRunning: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorBrandForeground1,
    boxShadow: tokens.shadow4,
  },
  stageCardCompleted: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorPaletteGreenForeground1,
  },
  stageCardFailed: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorPaletteRedForeground1,
  },
  stageCardSkipped: {
    opacity: 0.6,
  },
  stageHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  stageIconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0,
  },
  iconPending: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  iconRunning: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  iconCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  iconFailed: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
  },
  iconSkipped: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground4,
  },
  stageInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  },
  stageTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  stageBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusSmall,
    lineHeight: "18px",
  },
  badgePending: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  badgeRunning: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  badgeCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  badgeFailed: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
  },
  badgeSkipped: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground4,
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalS,
  },
  progressDetail: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: tokens.spacingVerticalXXS,
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
  },
  overallProgress: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  errorBar: {
    marginTop: tokens.spacingVerticalS,
  },
  completedBanner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: "center",
  },
  connectedIndicator: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  connectedDot: {
    width: "8px",
    height: "8px",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  disconnectedDot: {
    width: "8px",
    height: "8px",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralForeground4,
  },
});

// ── Stage icon mapping ───────────────────────────────────────────────

const STAGE_ICONS: Record<AgentStage, React.ReactElement> = {
  solution_analyzer: <DocumentSearch24Regular />,
  walkthrough_generator: <Sparkle24Regular />,
  documentation_generator: <TextDescription24Regular />,
};

// ── Props ────────────────────────────────────────────────────────────

interface PipelineProgressProps {
  projectId: string;
  /** The app_unique_name to pass when starting the pipeline. */
  appUniqueName: string;
  /** Whether to auto-start the pipeline on mount. */
  autoStart?: boolean;
  /** Callback when pipeline completes successfully. */
  onComplete?: () => void;
  /** Callback when pipeline fails. */
  onFailed?: (errorMessage: string) => void;
}

// ── Component ────────────────────────────────────────────────────────

export function PipelineProgress({
  projectId,
  appUniqueName,
  autoStart = false,
  onComplete,
  onFailed,
}: PipelineProgressProps) {
  const styles = useStyles();
  const { state, start, cancel, retry, isRunning } =
    usePipelineSSE(projectId);

  // Auto-start on mount if requested
  const hasAutoStarted = useCallback(() => {
    if (autoStart && state.status === "idle") {
      start(appUniqueName);
    }
  }, [autoStart, state.status, start, appUniqueName]);

  // Trigger auto-start effect
  // Using a ref-based pattern to avoid re-triggering
  const autoStartRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && autoStart && state.status === "idle") {
        start(appUniqueName);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoStart]
  );

  // Notify parent on completion/failure
  const prevStatus = useCallback(() => {
    if (state.status === "completed") {
      onComplete?.();
    } else if (state.status === "failed" && state.errorMessage) {
      onFailed?.(state.errorMessage);
    }
  }, [state.status, state.errorMessage, onComplete, onFailed]);

  // Trigger callbacks (will re-run when state.status changes)
  prevStatus();

  // ── Computed values ─────────────────────────────────────────────

  const completedCount = state.stages.filter(
    (s) => s.status === "completed"
  ).length;
  const totalStages = state.stages.length;
  const overallPercent = Math.round((completedCount / totalStages) * 100);

  return (
    <div className={styles.root} ref={autoStartRef}>
      {/* Header */}
      <div className={styles.header}>
        <Subtitle1>AI Pipeline</Subtitle1>
        <Body1 className={styles.subtitle}>
          {state.status === "idle" &&
            "Ready to analyse your solution and generate training materials."}
          {state.status === "running" &&
            "Processing your solution through the 3-agent AI pipeline..."}
          {state.status === "completed" &&
            "Pipeline completed successfully! Your training materials are ready."}
          {state.status === "failed" &&
            "The pipeline encountered an error. You can retry the process."}
        </Body1>
      </div>

      {/* Connection status while running */}
      {isRunning && (
        <div className={styles.connectedIndicator}>
          <div
            className={
              state.connected ? styles.connectedDot : styles.disconnectedDot
            }
          />
          <Caption1>
            {state.connected ? "Connected" : "Reconnecting..."}
          </Caption1>
        </div>
      )}

      {/* Overall progress bar (only while running) */}
      {state.status === "running" && (
        <div className={styles.overallProgress}>
          <Spinner size="tiny" />
          <div style={{ flex: 1 }}>
            <ProgressBar
              value={overallPercent / 100}
              thickness="large"
              color="brand"
            />
          </div>
          <Caption1>
            {completedCount} / {totalStages} stages
          </Caption1>
        </div>
      )}

      {/* Stage cards */}
      <div className={styles.stageList} role="list" aria-label="Pipeline stages">
        {state.stages.map((stageState, index) => (
          <StageCard
            key={stageState.stage}
            stageState={stageState}
            stageIndex={index}
          />
        ))}
      </div>

      {/* Error message */}
      {state.status === "failed" && state.errorMessage && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>
            <MessageBarTitle>Pipeline Error</MessageBarTitle>
            {state.errorMessage}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Completed banner */}
      {state.status === "completed" && (
        <div className={styles.completedBanner}>
          <Checkmark24Filled
            style={{ color: tokens.colorPaletteGreenForeground1, fontSize: 32 }}
          />
          <Text size={400} weight="semibold">
            Training materials generated successfully
          </Text>
          <Caption1>
            All 3 agents completed. You can now review and edit the generated
            content.
          </Caption1>
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actions}>
        {state.status === "idle" && (
          <Button
            appearance="primary"
            size="large"
            icon={<Play24Filled />}
            onClick={() => start(appUniqueName)}
          >
            Start Pipeline
          </Button>
        )}

        {isRunning && (
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={cancel}
          >
            Cancel
          </Button>
        )}

        {state.status === "failed" && (
          <Button
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={retry}
          >
            Retry Pipeline
          </Button>
        )}
      </div>
    </div>
  );
}

// ── StageCard sub-component ──────────────────────────────────────────

interface StageCardProps {
  stageState: StageState;
  stageIndex: number;
}

function StageCard({ stageState, stageIndex }: StageCardProps) {
  const styles = useStyles();

  const { stage, status, message, progressPercent, itemsProcessed, itemsTotal } =
    stageState;

  const cardClass = mergeClasses(
    styles.stageCard,
    status === "running" && styles.stageCardRunning,
    status === "completed" && styles.stageCardCompleted,
    status === "failed" && styles.stageCardFailed,
    status === "skipped" && styles.stageCardSkipped
  );

  const iconClass = mergeClasses(
    styles.stageIconContainer,
    status === "pending" && styles.iconPending,
    status === "running" && styles.iconRunning,
    status === "completed" && styles.iconCompleted,
    status === "failed" && styles.iconFailed,
    status === "skipped" && styles.iconSkipped
  );

  const badgeClass = mergeClasses(
    styles.stageBadge,
    status === "pending" && styles.badgePending,
    status === "running" && styles.badgeRunning,
    status === "completed" && styles.badgeCompleted,
    status === "failed" && styles.badgeFailed,
    status === "skipped" && styles.badgeSkipped
  );

  return (
    <Card className={cardClass} role="listitem" aria-label={`Agent ${stageIndex + 1}: ${AGENT_STAGE_LABELS[stage]}`}>
      <CardHeader
        image={
          <div className={iconClass}>
            <StageStatusIcon status={status} stage={stage} />
          </div>
        }
        header={
          <div className={styles.stageInfo}>
            <div className={styles.stageTitle}>
              <Text weight="semibold" size={400}>
                Agent {stageIndex + 1}: {AGENT_STAGE_LABELS[stage]}
              </Text>
              <span className={badgeClass}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <Caption1>{message}</Caption1>
          </div>
        }
      />

      {/* Progress bar for running stages */}
      {status === "running" && progressPercent !== undefined && (
        <div className={styles.progressContainer}>
          <ProgressBar
            value={progressPercent / 100}
            thickness="medium"
            color="brand"
          />
          <div className={styles.progressDetail}>
            <Caption1>{progressPercent}%</Caption1>
            {itemsProcessed !== undefined && itemsTotal !== undefined && (
              <Caption1>
                {itemsProcessed} / {itemsTotal} items
              </Caption1>
            )}
          </div>
        </div>
      )}

      {/* Indeterminate spinner for running stages without progress */}
      {status === "running" && progressPercent === undefined && (
        <div className={styles.progressContainer}>
          <ProgressBar thickness="medium" color="brand" />
        </div>
      )}

      {/* Error detail */}
      {status === "failed" && stageState.errorMessage && (
        <MessageBar intent="error" style={{ marginTop: tokens.spacingVerticalS }}>
          <MessageBarBody>{stageState.errorMessage}</MessageBarBody>
        </MessageBar>
      )}
    </Card>
  );
}

// ── Status helpers ───────────────────────────────────────────────────

const STATUS_LABELS: Record<StageStatus, string> = {
  pending: "Waiting",
  running: "In Progress",
  completed: "Done",
  failed: "Failed",
  skipped: "Skipped",
};

function StageStatusIcon({
  status,
  stage,
}: {
  status: StageStatus;
  stage: AgentStage;
}) {
  switch (status) {
    case "running":
      return <Spinner size="tiny" />;
    case "completed":
      return <Checkmark24Filled />;
    case "failed":
      return <ErrorCircle24Filled />;
    case "skipped":
      return <PresenceBlocked24Regular />;
    case "pending":
    default:
      return STAGE_ICONS[stage];
  }
}

export default PipelineProgress;
