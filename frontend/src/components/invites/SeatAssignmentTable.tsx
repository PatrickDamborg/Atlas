"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  Text,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  PersonDelete24Regular,
  Delete24Regular,
  CheckmarkCircle16Regular,
  DismissCircle16Regular,
} from "@fluentui/react-icons";
import type { SeatAssignmentResponse } from "@/types/invite";

const useStyles = makeStyles({
  container: {
    width: "100%",
    marginTop: tokens.spacingVerticalXL,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalM,
  },
  emptyState: {
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  actionButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  gdprWarning: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: tokens.spacingVerticalS,
    display: "block",
  },
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SeatAssignmentTableProps {
  seats: SeatAssignmentResponse[];
  onRevoke: (seatId: string) => Promise<void>;
  onHardDelete: (seatId: string) => Promise<void>;
  isLoading?: boolean;
}

export function SeatAssignmentTable({
  seats,
  onRevoke,
  onHardDelete,
  isLoading = false,
}: SeatAssignmentTableProps) {
  const styles = useStyles();
  const [revokeTarget, setRevokeTarget] = useState<SeatAssignmentResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeatAssignmentResponse | null>(null);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    await onRevoke(revokeTarget.id);
    setRevokeTarget(null);
  }, [revokeTarget, onRevoke]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await onHardDelete(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, onHardDelete]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold" size={500}>
          Seated Users ({seats.length})
        </Text>
      </div>

      {seats.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={400}>No users have joined yet</Text>
          <Text
            as="p"
            size={300}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            Share an invite link with end users to get started
          </Text>
        </div>
      ) : (
        <Table aria-label="Seat assignments">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Consent</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seats.map((seat) => (
              <TableRow key={seat.id}>
                <TableCell>
                  <Text>{seat.user_display_name || "—"}</Text>
                </TableCell>
                <TableCell>
                  <Text size={200}>{seat.user_email}</Text>
                </TableCell>
                <TableCell>
                  {seat.is_active ? (
                    <Badge
                      appearance="filled"
                      color="success"
                      icon={<CheckmarkCircle16Regular />}
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      appearance="filled"
                      color="danger"
                      icon={<DismissCircle16Regular />}
                    >
                      Revoked
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Text size={200}>
                    {seat.consent_given_at ? formatDate(seat.consent_given_at) : "—"}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text size={200}>{formatDate(seat.assigned_at)}</Text>
                </TableCell>
                <TableCell>
                  <div className={styles.actionButtons}>
                    {seat.is_active && (
                      <Tooltip content="Revoke access" relationship="label">
                        <Button
                          appearance="subtle"
                          icon={<PersonDelete24Regular />}
                          size="small"
                          onClick={() => setRevokeTarget(seat)}
                          aria-label="Revoke seat"
                          disabled={isLoading}
                        />
                      </Tooltip>
                    )}
                    <Tooltip
                      content="Permanently delete (GDPR)"
                      relationship="label"
                    >
                      <Button
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        size="small"
                        onClick={() => setDeleteTarget(seat)}
                        aria-label="Hard delete seat"
                        disabled={isLoading}
                      />
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Revoke Confirmation */}
      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(_, d) => {
          if (!d.open) setRevokeTarget(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Revoke User Access</DialogTitle>
            <DialogContent>
              <Text>
                Revoke access for{" "}
                <strong>
                  {revokeTarget?.user_display_name || revokeTarget?.user_email}
                </strong>
                ? They will no longer be able to access training materials. This
                frees up one seat.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setRevokeTarget(null)}
              >
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleRevoke} disabled={isLoading}>
                Revoke Access
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(_, d) => {
          if (!d.open) setDeleteTarget(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Permanently Delete User Data</DialogTitle>
            <DialogContent>
              <Text>
                This will permanently delete all data for{" "}
                <strong>
                  {deleteTarget?.user_display_name || deleteTarget?.user_email}
                </strong>
                , including their seat assignment, consent records, and any
                progress tracking data.
              </Text>
              <Text className={styles.gdprWarning} weight="semibold" size={300}>
                This is a GDPR hard delete and cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleDelete}
                disabled={isLoading}
                style={{
                  backgroundColor: tokens.colorPaletteRedBackground3,
                }}
              >
                Delete Permanently
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
