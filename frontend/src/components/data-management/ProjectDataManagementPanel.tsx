"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Spinner,
  Text,
  Button,
  Divider,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  ShieldLock24Regular,
} from "@fluentui/react-icons";
import { BulkDeleteConfirmDialog } from "./BulkDeleteConfirmDialog";
import { UserDataSearchList } from "./UserDataSearchList";
import { GdprAuditLogTable } from "./GdprAuditLogTable";
import {
  listSeatAssignments,
  gdprBulkDeleteProject,
  gdprDeleteEndUser,
  ApiError,
} from "@/lib/api";
import type { SeatAssignmentResponse } from "@/types/invite";

const useStyles = makeStyles({
  panel: {
    padding: tokens.spacingHorizontalXXL,
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: tokens.spacingVerticalL,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  headerIcon: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  bulkSection: {
    marginBottom: tokens.spacingVerticalXL,
  },
  bulkCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalM,
  },
  bulkCardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    padding: `0 ${tokens.spacingHorizontalM}`,
    paddingBottom: tokens.spacingVerticalM,
  },
  bulkInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    flex: 1,
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacingVerticalXXXL,
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  deleteButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground2,
    },
    flexShrink: 0,
  },
  gdprBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface ProjectDataManagementPanelProps {
  projectId: string;
}

export function ProjectDataManagementPanel({
  projectId,
}: ProjectDataManagementPanelProps) {
  const styles = useStyles();

  const [seats, setSeats] = useState<SeatAssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [auditRefresh, setAuditRefresh] = useState(0);

  const loadSeats = useCallback(async () => {
    try {
      const data = await listSeatAssignments(projectId, true);
      setSeats(data.items);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load user data";
      setError(message);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    loadSeats().finally(() => setLoading(false));
  }, [loadSeats]);

  // ── Bulk Delete ──────────────────────────────────────────────────────

  const handleBulkDelete = useCallback(async () => {
    await gdprBulkDeleteProject(projectId);
    await loadSeats();
    setAuditRefresh((n) => n + 1);
  }, [projectId, loadSeats]);

  // ── Individual Delete ────────────────────────────────────────────────

  const handleDeleteUser = useCallback(
    async (seatId: string) => {
      setIsDeleting(true);
      try {
        await gdprDeleteEndUser(projectId, seatId);
        await loadSeats();
        setAuditRefresh((n) => n + 1);
      } finally {
        setIsDeleting(false);
      }
    },
    [projectId, loadSeats]
  );

  // ── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner label="Loading data management..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {error && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ShieldLock24Regular />
            <Text size={800} weight="bold">
              Data Management
            </Text>
          </div>
          <Text
            size={300}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            GDPR-compliant data deletion for end-user records in this project.
            All deletions are permanent hard deletes.
          </Text>
        </div>
        <div className={styles.gdprBadge}>
          <ShieldLock24Regular />
          GDPR Compliant
        </div>
      </div>

      {/* Bulk Delete Section */}
      <div className={styles.bulkSection}>
        <Card className={styles.bulkCard}>
          <CardHeader
            header={
              <Text weight="semibold" size={400}>
                Project-Level Bulk Deletion
              </Text>
            }
            description={
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Remove all end-user data from this project at once
              </Text>
            }
          />
          <div className={styles.bulkCardContent}>
            <div className={styles.bulkInfo}>
              <Text size={300}>
                This project currently has{" "}
                <strong>{seats.length}</strong> user record
                {seats.length !== 1 ? "s" : ""}. Bulk deletion will
                permanently remove all seat assignments, consent records,
                session data, invite links, and walkthrough progress for every user.
              </Text>
            </div>
            <Button
              appearance="primary"
              className={styles.deleteButton}
              icon={<Delete24Regular />}
              onClick={() => setShowBulkDialog(true)}
              disabled={seats.length === 0}
            >
              Delete All User Data
            </Button>
          </div>
        </Card>
      </div>

      <BulkDeleteConfirmDialog
        open={showBulkDialog}
        onClose={() => {
          setShowBulkDialog(false);
          loadSeats();
        }}
        onConfirm={handleBulkDelete}
        projectId={projectId}
        userCount={seats.length}
      />

      <Divider style={{ marginBottom: tokens.spacingVerticalXL }} />

      {/* Individual User Data List */}
      <UserDataSearchList
        seats={seats}
        onDeleteUser={handleDeleteUser}
        isDeleting={isDeleting}
      />

      <Divider style={{ marginTop: tokens.spacingVerticalXL }} />

      {/* GDPR Audit Log */}
      <GdprAuditLogTable projectId={projectId} refreshTrigger={auditRefresh} />
    </div>
  );
}
