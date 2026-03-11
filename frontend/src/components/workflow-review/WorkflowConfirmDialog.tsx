"use client";

/**
 * WorkflowConfirmDialog — Confirmation dialog before triggering the AI pipeline.
 *
 * Shows a summary of what the consultant has selected/edited, asks for
 * explicit confirmation, then displays a loading/progress state while
 * the backend locks the workflows and starts the pipeline.
 *
 * States:
 *   idle       → Shows summary and confirm/cancel buttons
 *   submitting → Shows indeterminate progress bar, buttons disabled
 *   success    → Shows success message with SSE URL for pipeline tracking
 *   error      → Shows error message with retry option
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Text,
  ProgressBar,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Badge,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Checkmark24Regular,
  Checkmark24Filled,
  Dismiss24Regular,
  Play24Filled,
  Warning24Regular,
  ArrowClockwise24Regular,
  Sparkle24Regular,
} from "@fluentui/react-icons";

import type {
  WorkflowOverride,
  WorkflowConfirmResponse,
} from "@/types/workflow";

// ── Types ─────────────────────────────────────────────────────────────

type DialogStatus = "idle" | "submitting" | "success" | "error";

export interface WorkflowConfirmDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called to close the dialog. */
  onClose: () => void;
  /** Number of selected workflows. */
  selectedCount: number;
  /** Total estimated walkthrough steps. */
  estimatedSteps: number;
  /** Number of workflows with consultant edits. */
  editedCount: number;
  /** Called to execute the confirm action. Returns the response on success. */
  onConfirm: () => Promise<WorkflowConfirmResponse>;
  /** Called after successful confirmation with pipeline run info. */
  onPipelineStarted?: (response: WorkflowConfirmResponse) => void;
}

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  summaryBox: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningBox: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  warningIcon: {
    color: tokens.colorPaletteYellowForeground2,
    flexShrink: 0,
    marginTop: "2px",
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    alignItems: "center",
  },
  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    width: "100%",
  },
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: "48px",
    width: "48px",
    height: "48px",
  },
  pipelineInfo: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    alignItems: "center",
  },
});

// ── Component ─────────────────────────────────────────────────────────

export function WorkflowConfirmDialog({
  open,
  onClose,
  selectedCount,
  estimatedSteps,
  editedCount,
  onConfirm,
  onPipelineStarted,
}: WorkflowConfirmDialogProps) {
  const styles = useStyles();
  const [status, setStatus] = useState<DialogStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<WorkflowConfirmResponse | null>(
    null
  );

  const handleConfirm = useCallback(async () => {
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const result = await onConfirm();
      setResponse(result);
      setStatus("success");
      onPipelineStarted?.(result);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to confirm workflows"
      );
      setStatus("error");
    }
  }, [onConfirm, onPipelineStarted]);

  const handleRetry = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const handleClose = useCallback(() => {
    // Don't allow closing while submitting
    if (status === "submitting") return;
    setStatus("idle");
    setErrorMessage(null);
    setResponse(null);
    onClose();
  }, [onClose, status]);

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        if (!d.open && status !== "submitting") handleClose();
      }}
    >
      <DialogSurface style={{ maxWidth: "520px" }}>
        <DialogBody>
          <DialogTitle>
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Sparkle24Regular
                style={{ color: tokens.colorBrandForeground1 }}
              />
              Confirm Workflows & Generate Training
            </div>
          </DialogTitle>

          <DialogContent>
            {status === "success" && response ? (
              /* ── Success state ─────────────────────────────────── */
              <div className={styles.successContainer}>
                <Checkmark24Filled className={styles.successIcon} />
                <Text size={400} weight="semibold">
                  Pipeline Started
                </Text>
                <Text align="center" size={300}>
                  Your {response.selected_count} workflow
                  {response.selected_count !== 1 ? "s have" : " has"} been
                  locked in and the AI generation pipeline has started.
                </Text>
                <div className={styles.pipelineInfo}>
                  <Text size={200} weight="semibold">
                    Pipeline Run
                  </Text>
                  <Badge appearance="outline" color="brand" size="medium">
                    {response.run_id}
                  </Badge>
                </div>
              </div>
            ) : (
              <>
                {/* ── Summary ─────────────────────────────────────── */}
                <Text>
                  You are about to lock in your workflow selection and start
                  the AI generation pipeline. This will generate:
                </Text>

                <div className={styles.summaryBox}>
                  <div className={styles.summaryRow}>
                    <Text size={300}>Selected workflows</Text>
                    <Badge appearance="filled" color="brand" size="medium">
                      {selectedCount}
                    </Badge>
                  </div>
                  <Divider />
                  <div className={styles.summaryRow}>
                    <Text size={300}>Estimated walkthrough steps</Text>
                    <Badge appearance="outline" color="informative" size="medium">
                      ~{estimatedSteps}
                    </Badge>
                  </div>
                  {editedCount > 0 && (
                    <>
                      <Divider />
                      <div className={styles.summaryRow}>
                        <Text size={300}>Workflows with your edits</Text>
                        <Badge appearance="tint" color="warning" size="medium">
                          {editedCount}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Warning ─────────────────────────────────────── */}
                <div className={styles.warningBox}>
                  <Warning24Regular className={styles.warningIcon} />
                  <div>
                    <Text size={300} weight="semibold">
                      This will start full regeneration
                    </Text>
                    <br />
                    <Text size={200}>
                      Any previously generated training content will be
                      replaced. The pipeline may take several minutes to
                      complete.
                    </Text>
                  </div>
                </div>

                {/* ── Submitting progress ──────────────────────────── */}
                {status === "submitting" && (
                  <div className={styles.progressContainer}>
                    <div className={styles.progressRow}>
                      <Spinner size="tiny" />
                      <div style={{ flex: 1 }}>
                        <ProgressBar thickness="medium" color="brand" />
                      </div>
                    </div>
                    <Text size={200}>
                      Locking workflows and starting the AI pipeline...
                    </Text>
                  </div>
                )}

                {/* ── Error state ──────────────────────────────────── */}
                {status === "error" && errorMessage && (
                  <MessageBar
                    intent="error"
                    style={{ marginTop: tokens.spacingVerticalS }}
                  >
                    <MessageBarBody>
                      <MessageBarTitle>Confirmation Failed</MessageBarTitle>
                      {errorMessage}
                    </MessageBarBody>
                  </MessageBar>
                )}
              </>
            )}
          </DialogContent>

          <DialogActions>
            {status === "success" ? (
              <Button appearance="primary" onClick={handleClose}>
                Continue to Pipeline
              </Button>
            ) : status === "error" ? (
              <>
                <Button appearance="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowClockwise24Regular />}
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <Button
                  appearance="secondary"
                  icon={<Dismiss24Regular />}
                  onClick={handleClose}
                  disabled={status === "submitting"}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  icon={<Play24Filled />}
                  onClick={handleConfirm}
                  disabled={status === "submitting"}
                >
                  {status === "submitting"
                    ? "Starting Pipeline..."
                    : "Confirm & Generate"}
                </Button>
              </>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
