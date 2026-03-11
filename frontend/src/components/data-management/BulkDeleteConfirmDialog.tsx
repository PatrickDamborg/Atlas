"use client";

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
  Input,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Warning24Regular,
  Delete24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
type DialogStatus = "idle" | "deleting" | "success" | "error";

const useStyles = makeStyles({
  warningBox: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  warningHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorPaletteRedForeground1,
  },
  warningList: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalXL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  confirmInput: {
    marginTop: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    alignItems: "center",
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
  },
  deleteButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground2,
    },
  },
});

const CONFIRM_PHRASE = "DELETE ALL DATA";

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectId: string;
  userCount: number;
}

export function BulkDeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  projectId,
  userCount,
}: BulkDeleteConfirmDialogProps) {
  const styles = useStyles();
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState<DialogStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletedCount, setDeletedCount] = useState(0);

  const isConfirmValid = confirmText === CONFIRM_PHRASE;

  const handleConfirm = useCallback(async () => {
    setStatus("deleting");
    setErrorMessage(null);
    try {
      await onConfirm();
      setDeletedCount(userCount);
      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Bulk deletion failed"
      );
      setStatus("error");
    }
  }, [onConfirm, userCount]);

  const handleClose = useCallback(() => {
    setConfirmText("");
    setStatus("idle");
    setErrorMessage(null);
    setDeletedCount(0);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        if (!d.open && status !== "deleting") handleClose();
      }}
    >
      <DialogSurface style={{ maxWidth: "520px" }}>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Delete24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
              Delete All User Data for Project
            </div>
          </DialogTitle>

          <DialogContent>
            {status === "success" ? (
              <div className={styles.successContainer}>
                <Checkmark24Regular
                  style={{ fontSize: "48px" }}
                  className={styles.successIcon}
                />
                <Text size={400} weight="semibold">
                  Deletion Complete
                </Text>
                <Text align="center">
                  Successfully deleted data for {deletedCount} user(s) in this
                  project. All seat assignments, consent records, sessions, and
                  progress tracking data have been permanently removed.
                </Text>
              </div>
            ) : (
              <>
                <Text>
                  You are about to permanently delete <strong>all end-user data</strong>{" "}
                  for this project ({userCount} user{userCount !== 1 ? "s" : ""}).
                </Text>

                <div className={styles.warningBox}>
                  <div className={styles.warningHeader}>
                    <Warning24Regular />
                    <Text weight="bold" size={300}>
                      This action cannot be undone
                    </Text>
                  </div>
                  <ul className={styles.warningList}>
                    <li>
                      <Text size={200}>
                        All seat assignments will be permanently removed
                      </Text>
                    </li>
                    <li>
                      <Text size={200}>
                        All consent records will be erased
                      </Text>
                    </li>
                    <li>
                      <Text size={200}>
                        All active sessions will be terminated
                      </Text>
                    </li>
                    <li>
                      <Text size={200}>
                        All walkthrough progress data will be lost
                      </Text>
                    </li>
                    <li>
                      <Text size={200}>
                        Affected users will lose all access immediately
                      </Text>
                    </li>
                  </ul>
                </div>

                {status === "deleting" ? (
                  <div className={styles.progressContainer}>
                    <ProgressBar />
                    <Text size={200}>
                      Deleting all user data... Please do not close this dialog.
                    </Text>
                  </div>
                ) : (
                  <div className={styles.confirmInput}>
                    <Text size={200} weight="semibold">
                      Type <strong>{CONFIRM_PHRASE}</strong> to confirm:
                    </Text>
                    <Input
                      value={confirmText}
                      onChange={(_, d) => setConfirmText(d.value)}
                      placeholder={CONFIRM_PHRASE}
                      disabled={false}
                      autoComplete="off"
                    />
                  </div>
                )}

                {status === "error" && errorMessage && (
                  <MessageBar
                    intent="error"
                    style={{ marginTop: tokens.spacingVerticalM }}
                  >
                    <MessageBarBody>
                      <MessageBarTitle>Deletion Failed</MessageBarTitle>
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
                Done
              </Button>
            ) : (
              <>
                <Button
                  appearance="secondary"
                  onClick={handleClose}
                  disabled={status === "deleting"}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  className={styles.deleteButton}
                  onClick={handleConfirm}
                  disabled={!isConfirmValid || status === "deleting"}
                  icon={<Delete24Regular />}
                >
                  Delete All User Data
                </Button>
              </>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
