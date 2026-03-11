"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Spinner,
  Text,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { SeatSummaryCard } from "./SeatSummaryCard";
import { CreateInviteDialog } from "./CreateInviteDialog";
import { InviteLinkTable } from "./InviteLinkTable";
import { SeatAssignmentTable } from "./SeatAssignmentTable";
import {
  listInviteLinks,
  createInviteLink,
  revokeInviteLink,
  getSeatSummary,
  updateSeatLimit,
  listSeatAssignments,
  revokeSeatAssignment,
  hardDeleteSeat,
  ApiError,
} from "@/lib/api";
import type {
  InviteLinkResponse,
  InviteLinkCreateRequest,
  SeatSummary,
  SeatAssignmentResponse,
} from "@/types/invite";

const useStyles = makeStyles({
  page: {
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
  topSection: {
    display: "flex",
    gap: tokens.spacingHorizontalXXL,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: tokens.spacingVerticalXL,
  },
  createButtonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    justifyContent: "center",
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
});

interface InviteManagementPageProps {
  projectId: string;
}

export function InviteManagementPage({ projectId }: InviteManagementPageProps) {
  const styles = useStyles();

  // Data state
  const [summary, setSummary] = useState<SeatSummary | null>(null);
  const [invites, setInvites] = useState<InviteLinkResponse[]>([]);
  const [seats, setSeats] = useState<SeatAssignmentResponse[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [isSeatAction, setIsSeatAction] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [summaryData, inviteData, seatData] = await Promise.all([
        getSeatSummary(projectId),
        listInviteLinks(projectId, showRevoked),
        listSeatAssignments(projectId, true),
      ]);
      setSummary(summaryData);
      setInvites(inviteData.items);
      setSeats(seatData.items);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to load invite data";
      setError(message);
    }
  }, [projectId, showRevoked]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // ── Actions ───────────────────────────────────────────────────────
  const handleCreateInvite = useCallback(
    async (data: InviteLinkCreateRequest) => {
      setIsCreating(true);
      try {
        await createInviteLink(projectId, data);
        await loadData();
      } finally {
        setIsCreating(false);
      }
    },
    [projectId, loadData]
  );

  const handleRevokeInvite = useCallback(
    async (inviteId: string) => {
      setIsRevoking(true);
      try {
        await revokeInviteLink(projectId, inviteId);
        await loadData();
      } finally {
        setIsRevoking(false);
      }
    },
    [projectId, loadData]
  );

  const handleUpdateSeatLimit = useCallback(
    async (newLimit: number) => {
      setIsUpdatingLimit(true);
      try {
        await updateSeatLimit(projectId, { seat_limit: newLimit });
        await loadData();
      } finally {
        setIsUpdatingLimit(false);
      }
    },
    [projectId, loadData]
  );

  const handleRevokeSeat = useCallback(
    async (seatId: string) => {
      setIsSeatAction(true);
      try {
        await revokeSeatAssignment(projectId, seatId);
        await loadData();
      } finally {
        setIsSeatAction(false);
      }
    },
    [projectId, loadData]
  );

  const handleHardDeleteSeat = useCallback(
    async (seatId: string) => {
      setIsSeatAction(true);
      try {
        await hardDeleteSeat(projectId, seatId);
        await loadData();
      } finally {
        setIsSeatAction(false);
      }
    },
    [projectId, loadData]
  );

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner label="Loading invite management..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
          <Text size={800} weight="bold">
            Invite & Seat Management
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Generate invite links, manage seat allocations, and track end-user
            access for this project.
          </Text>
        </div>
      </div>

      {/* Seat Limit Reached Banner */}
      {summary && summary.seats_available <= 0 && (
        <MessageBar
          intent="warning"
          className={styles.errorBar}
        >
          <MessageBarBody>
            <MessageBarTitle>Seat Limit Reached</MessageBarTitle>
            All {summary.seat_limit} seat(s) are in use. New invite links
            cannot be generated and new end users cannot join until you
            increase the seat limit or revoke existing seats.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Top Section: Seat Summary + Create Button */}
      <div className={styles.topSection}>
        {summary && (
          <SeatSummaryCard
            summary={summary}
            onUpdateLimit={handleUpdateSeatLimit}
            isUpdating={isUpdatingLimit}
          />
        )}
        <div className={styles.createButtonContainer}>
          <CreateInviteDialog
            onSubmit={handleCreateInvite}
            isSubmitting={isCreating}
            seatsAvailable={summary?.seats_available ?? 0}
          />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {summary
              ? `${summary.seats_available} seat(s) remaining`
              : "Loading..."}
          </Text>
        </div>
      </div>

      <Divider style={{ marginBottom: tokens.spacingVerticalL }} />

      {/* Invite Links Table */}
      <InviteLinkTable
        invites={invites}
        onRevoke={handleRevokeInvite}
        showRevoked={showRevoked}
        onToggleShowRevoked={setShowRevoked}
        isRevoking={isRevoking}
      />

      <Divider style={{ marginTop: tokens.spacingVerticalL }} />

      {/* Seat Assignments Table */}
      <SeatAssignmentTable
        seats={seats}
        onRevoke={handleRevokeSeat}
        onHardDelete={handleHardDeleteSeat}
        isLoading={isSeatAction}
      />
    </div>
  );
}
