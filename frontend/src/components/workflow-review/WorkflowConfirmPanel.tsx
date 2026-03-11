"use client";

/**
 * WorkflowConfirmPanel — Orchestrates the workflow review → confirm → pipeline flow.
 *
 * Composes:
 * - WorkflowListEditor (select, reorder, edit workflows)
 * - WorkflowConfirmDialog (confirmation dialog)
 * - PipelineProgress (real-time pipeline progress tracking)
 *
 * Flow:
 * 1. Consultant reviews/edits workflow list in the editor
 * 2. Clicks "Confirm Selection" → confirmation dialog opens
 * 3. Confirms → backend locks workflows & starts pipeline
 * 4. Dialog closes → panel switches to PipelineProgress view
 */

import { useState, useCallback, useMemo } from "react";
import {
  Text,
  Subtitle1,
  Body1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";

import { WorkflowListEditor } from "./WorkflowListEditor";
import { WorkflowConfirmDialog } from "./WorkflowConfirmDialog";
import { PipelineProgress } from "@/components/pipeline/PipelineProgress";
import { confirmWorkflows } from "@/lib/api";
import type {
  ProposedWorkflow,
  WorkflowOverride,
  WorkflowConfirmResponse,
} from "@/types/workflow";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    maxWidth: "960px",
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
});

// ── Types ─────────────────────────────────────────────────────────────

type PanelPhase = "editing" | "pipeline";

export interface WorkflowConfirmPanelProps {
  /** The project UUID. */
  projectId: string;
  /** The selected app module unique name. */
  appUniqueName: string;
  /** The proposed workflows from the inference engine. */
  workflows: ProposedWorkflow[];
  /** Called when the pipeline completes successfully. */
  onComplete?: () => void;
  /** Called when the pipeline fails. */
  onFailed?: (errorMessage: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

export function WorkflowConfirmPanel({
  projectId,
  appUniqueName,
  workflows,
  onComplete,
  onFailed,
}: WorkflowConfirmPanelProps) {
  const styles = useStyles();

  // ── Phase state ────────────────────────────────────────────────────
  const [phase, setPhase] = useState<PanelPhase>("editing");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Workflow selection state (captured when confirm dialog opens) ──
  const [pendingSelectedIds, setPendingSelectedIds] = useState<string[]>([]);
  const [pendingOverrides, setPendingOverrides] = useState<WorkflowOverride[]>(
    []
  );

  // ── Pipeline tracking state ────────────────────────────────────────
  const [pipelineRunId, setPipelineRunId] = useState<string | null>(null);

  // ── Derived values for the dialog ──────────────────────────────────
  const selectedWorkflows = useMemo(
    () => workflows.filter((w) => pendingSelectedIds.includes(w.id)),
    [workflows, pendingSelectedIds]
  );

  const estimatedSteps = useMemo(
    () => selectedWorkflows.reduce((sum, w) => sum + w.estimated_steps, 0),
    [selectedWorkflows]
  );

  const editedCount = useMemo(
    () => pendingOverrides.length,
    [pendingOverrides]
  );

  // ── Handlers ───────────────────────────────────────────────────────

  /** Called by WorkflowListEditor when user clicks "Confirm Selection". */
  const handleEditorConfirm = useCallback(
    (selectedIds: string[], overrides: WorkflowOverride[]) => {
      setPendingSelectedIds(selectedIds);
      setPendingOverrides(overrides);
      setDialogOpen(true);
      setError(null);
    },
    []
  );

  /** Called by the confirm dialog to execute the confirm API call. */
  const handleDialogConfirm = useCallback(async (): Promise<WorkflowConfirmResponse> => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await confirmWorkflows(projectId, {
        selected_workflow_ids: pendingSelectedIds,
        overrides: pendingOverrides,
        app_unique_name: appUniqueName,
      });
      return response;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, appUniqueName, pendingSelectedIds, pendingOverrides]);

  /** Called when the pipeline is confirmed and started. */
  const handlePipelineStarted = useCallback(
    (response: WorkflowConfirmResponse) => {
      setPipelineRunId(response.run_id);
    },
    []
  );

  /** Called when the confirm dialog closes. */
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    // If pipeline was started, switch to pipeline view
    if (pipelineRunId) {
      setPhase("pipeline");
    }
  }, [pipelineRunId]);

  // ── Render ─────────────────────────────────────────────────────────

  if (phase === "pipeline") {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Subtitle1>Generating Training Materials</Subtitle1>
          <Body1 className={styles.subtitle}>
            The AI pipeline is processing your {pendingSelectedIds.length}{" "}
            confirmed workflow{pendingSelectedIds.length !== 1 ? "s" : ""}.
          </Body1>
        </div>
        <PipelineProgress
          projectId={projectId}
          appUniqueName={appUniqueName}
          autoStart={false}
          onComplete={onComplete}
          onFailed={onFailed}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Subtitle1>Review Training Workflows</Subtitle1>
        <Body1 className={styles.subtitle}>
          Review, reorder, and edit the AI-proposed workflows. Select which
          ones to include in the training walkthrough, then confirm to start
          generation.
        </Body1>
      </div>

      <WorkflowListEditor
        workflows={workflows}
        onConfirm={handleEditorConfirm}
        submitting={submitting}
        error={error}
      />

      <WorkflowConfirmDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        selectedCount={pendingSelectedIds.length}
        estimatedSteps={estimatedSteps}
        editedCount={editedCount}
        onConfirm={handleDialogConfirm}
        onPipelineStarted={handlePipelineStarted}
      />
    </div>
  );
}
