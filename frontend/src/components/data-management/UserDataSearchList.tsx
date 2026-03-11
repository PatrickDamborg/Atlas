"use client";

import { useState, useMemo, useCallback } from "react";
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
  Input,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  ProgressBar,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Search24Regular,
  Delete24Regular,
  CheckmarkCircle16Regular,
  DismissCircle16Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import type { SeatAssignmentResponse } from "@/types/invite";

const useStyles = makeStyles({
  container: {
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: "280px",
    flexGrow: 1,
    maxWidth: "400px",
  },
  emptyState: {
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  noResults: {
    textAlign: "center",
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  warningBox: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS,
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  warningIcon: {
    color: tokens.colorPaletteRedForeground1,
    flexShrink: 0,
    marginTop: "2px",
  },
  deleteButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground2,
    },
  },
  resultCount: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
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

interface UserDataSearchListProps {
  seats: SeatAssignmentResponse[];
  onDeleteUser: (seatId: string) => Promise<void>;
  isDeleting: boolean;
}

export function UserDataSearchList({
  seats,
  onDeleteUser,
  isDeleting,
}: UserDataSearchListProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SeatAssignmentResponse | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const filteredSeats = useMemo(() => {
    if (!searchQuery.trim()) return seats;
    const query = searchQuery.toLowerCase().trim();
    return seats.filter(
      (seat) =>
        seat.user_email.toLowerCase().includes(query) ||
        (seat.user_display_name?.toLowerCase().includes(query) ?? false)
    );
  }, [seats, searchQuery]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteInProgress(true);
    try {
      await onDeleteUser(deleteTarget.id);
    } finally {
      setDeleteInProgress(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDeleteUser]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold" size={500}>
          Individual User Data
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.spacingHorizontalM }}>
          <Text size={200} className={styles.resultCount}>
            {filteredSeats.length} of {seats.length} user{seats.length !== 1 ? "s" : ""}
          </Text>
          <Input
            className={styles.searchInput}
            contentBefore={<Search24Regular />}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            size="medium"
          />
        </div>
      </div>

      {seats.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={400}>No users in this project</Text>
          <Text
            as="p"
            size={300}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            There are no end-user records to manage
          </Text>
        </div>
      ) : filteredSeats.length === 0 ? (
        <div className={styles.noResults}>
          <Text size={300}>
            No users match &ldquo;{searchQuery}&rdquo;
          </Text>
        </div>
      ) : (
        <Table aria-label="User data for deletion">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Consent</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
              <TableHeaderCell style={{ width: "100px" }}>
                GDPR Action
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeats.map((seat) => (
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
                    {seat.consent_given_at
                      ? formatDate(seat.consent_given_at)
                      : "—"}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text size={200}>{formatDate(seat.assigned_at)}</Text>
                </TableCell>
                <TableCell>
                  <Tooltip
                    content="Permanently delete this user's data (GDPR)"
                    relationship="label"
                  >
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      size="small"
                      onClick={() => setDeleteTarget(seat)}
                      aria-label={`Delete data for ${seat.user_display_name || seat.user_email}`}
                      disabled={isDeleting}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Per-User Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(_, d) => {
          if (!d.open && !deleteInProgress) setDeleteTarget(null);
        }}
      >
        <DialogSurface style={{ maxWidth: "480px" }}>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Delete24Regular
                  style={{ color: tokens.colorPaletteRedForeground1 }}
                />
                Delete User Data
              </div>
            </DialogTitle>
            <DialogContent>
              {deleteInProgress ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: tokens.spacingVerticalS,
                    alignItems: "center",
                    padding: tokens.spacingVerticalM,
                  }}
                >
                  <ProgressBar />
                  <Text size={200}>Deleting user data...</Text>
                </div>
              ) : (
                <>
                  <Text>
                    Permanently delete all data for{" "}
                    <strong>
                      {deleteTarget?.user_display_name || deleteTarget?.user_email}
                    </strong>{" "}
                    ({deleteTarget?.user_email})?
                  </Text>

                  <div className={styles.warningBox}>
                    <Warning24Regular className={styles.warningIcon} />
                    <div>
                      <Text size={200} weight="semibold" block>
                        This GDPR hard delete will permanently remove:
                      </Text>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px" }}>
                        <li>
                          <Text size={200}>Seat assignment</Text>
                        </li>
                        <li>
                          <Text size={200}>Consent records</Text>
                        </li>
                        <li>
                          <Text size={200}>Session data</Text>
                        </li>
                        <li>
                          <Text size={200}>Walkthrough progress</Text>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteInProgress}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={deleteInProgress}
                icon={<Delete24Regular />}
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
