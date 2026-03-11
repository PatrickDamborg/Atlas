"use client";

import { useState, useEffect, useCallback } from "react";
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
  Spinner,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  History24Regular,
  ArrowClockwise20Regular,
  ShieldLock24Regular,
  Info16Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { getGdprAuditLogs, ApiError } from "@/lib/api";
import type { GdprAuditLogEntry } from "@/types/data-management";

const PAGE_SIZE = 10;

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
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    textAlign: "center",
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground3,
  },
  spinnerRow: {
    display: "flex",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
  },
  countCell: {
    fontVariantNumeric: "tabular-nums",
  },
  pagination: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM,
  },
  immutabilityBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalM,
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  detailLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  countsCard: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM,
  },
  countRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalXXS} 0`,
  },
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface GdprAuditLogTableProps {
  projectId: string;
  /** Increment this counter to trigger a refresh (e.g. after a deletion). */
  refreshTrigger?: number;
}

export function GdprAuditLogTable({
  projectId,
  refreshTrigger = 0,
}: GdprAuditLogTableProps) {
  const styles = useStyles();
  const [logs, setLogs] = useState<GdprAuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<GdprAuditLogEntry | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGdprAuditLogs(projectId, PAGE_SIZE, page * PAGE_SIZE);
      setLogs(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load audit logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs, refreshTrigger]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <History24Regular />
          <Text weight="semibold" size={500}>
            Deletion Audit Log
          </Text>
          {total > 0 && (
            <Text
              size={200}
              style={{ color: tokens.colorNeutralForeground3 }}
            >
              ({total} entr{total === 1 ? "y" : "ies"})
            </Text>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.spacingHorizontalM }}>
          <div className={styles.immutabilityBadge}>
            <ShieldLock24Regular />
            <Text size={200}>Immutable records</Text>
          </div>
          <Tooltip content="Refresh audit log" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowClockwise20Regular />}
              onClick={loadLogs}
              disabled={loading}
              size="small"
            />
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinnerRow}>
          <Spinner size="small" label="Loading audit logs..." />
        </div>
      ) : error ? (
        <Text
          size={300}
          style={{ color: tokens.colorPaletteRedForeground1 }}
        >
          {error}
        </Text>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={300}>
            No deletion events recorded yet. Audit log entries are created
            automatically when GDPR data deletions are performed.
          </Text>
        </div>
      ) : (
        <Table aria-label="GDPR deletion audit log">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Scope</TableHeaderCell>
              <TableHeaderCell>Requested By</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>
                Sessions
              </TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>
                Consent
              </TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>
                Seats
              </TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>
                Progress
              </TableHeaderCell>
              <TableHeaderCell style={{ textAlign: "right" }}>
                Total
              </TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell style={{ width: "50px" }} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Text size={200}>{formatDate(log.executed_at)}</Text>
                </TableCell>
                <TableCell>
                  <Badge
                    appearance="tint"
                    color={
                      log.scope === "project_bulk" ? "danger" : "warning"
                    }
                    size="small"
                  >
                    {log.scope === "project_bulk"
                      ? "Bulk Delete"
                      : "Single User"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip
                    content={log.requested_by_email}
                    relationship="label"
                  >
                    <Text size={200}>{log.requested_by_email}</Text>
                  </Tooltip>
                </TableCell>
                <TableCell
                  className={styles.countCell}
                  style={{ textAlign: "right" }}
                >
                  <Text size={200}>{log.sessions_deleted}</Text>
                </TableCell>
                <TableCell
                  className={styles.countCell}
                  style={{ textAlign: "right" }}
                >
                  <Text size={200}>{log.consent_records_deleted}</Text>
                </TableCell>
                <TableCell
                  className={styles.countCell}
                  style={{ textAlign: "right" }}
                >
                  <Text size={200}>{log.seat_assignments_deleted}</Text>
                </TableCell>
                <TableCell
                  className={styles.countCell}
                  style={{ textAlign: "right" }}
                >
                  <Text size={200}>{log.progress_records_deleted}</Text>
                </TableCell>
                <TableCell
                  className={styles.countCell}
                  style={{ textAlign: "right" }}
                >
                  <Text size={200} weight="semibold">
                    {log.total_records_deleted}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text size={200}>
                    {log.reason || "\u2014"}
                  </Text>
                </TableCell>
                <TableCell>
                  <Tooltip content="View details" relationship="label">
                    <Button
                      appearance="subtle"
                      icon={<Info16Regular />}
                      size="small"
                      onClick={() => setSelectedLog(log)}
                      aria-label="View audit log details"
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Page {page + 1} of {totalPages}
          </Text>
          <Button
            appearance="subtle"
            icon={<ChevronLeft24Regular />}
            size="small"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          />
          <Button
            appearance="subtle"
            icon={<ChevronRight24Regular />}
            size="small"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next page"
          />
        </div>
      )}

      {/* Audit Log Detail Dialog */}
      <Dialog
        open={selectedLog !== null}
        onOpenChange={(_, d) => { if (!d.open) setSelectedLog(null); }}
      >
        <DialogSurface style={{ maxWidth: "560px" }}>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldLock24Regular />
                Audit Log Detail
              </div>
            </DialogTitle>
            <DialogContent>
              {selectedLog && (
                <>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>Executed At</Text>
                      <Text size={300}>{formatDate(selectedLog.executed_at)}</Text>
                    </div>
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>Scope</Text>
                      <Badge
                        appearance="tint"
                        color={selectedLog.scope === "project_bulk" ? "danger" : "warning"}
                        size="small"
                      >
                        {selectedLog.scope === "project_bulk" ? "Bulk Delete" : "Single User"}
                      </Badge>
                    </div>
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>Requested By</Text>
                      <Text size={300}>{selectedLog.requested_by_email}</Text>
                    </div>
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>Audit Log ID</Text>
                      <Text size={200} style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                        {selectedLog.id}
                      </Text>
                    </div>
                  </div>

                  {selectedLog.reason && (
                    <div style={{ marginTop: tokens.spacingVerticalM }}>
                      <Text className={styles.detailLabel}>Reason</Text>
                      <Text size={300} block>{selectedLog.reason}</Text>
                    </div>
                  )}

                  <Divider style={{ marginTop: tokens.spacingVerticalM }} />

                  <div className={styles.countsCard}>
                    <Text weight="semibold" size={300} block
                      style={{ marginBottom: tokens.spacingVerticalXS }}
                    >
                      Records Permanently Deleted
                    </Text>
                    {[
                      ["Sessions", selectedLog.sessions_deleted],
                      ["Consent Records", selectedLog.consent_records_deleted],
                      ["Seat Assignments", selectedLog.seat_assignments_deleted],
                      ["Invite Links", selectedLog.invite_links_deleted],
                      ["Walkthrough Progress", selectedLog.progress_records_deleted],
                    ].map(([label, count]) => (
                      <div key={label as string} className={styles.countRow}>
                        <Text size={200}>{label as string}</Text>
                        <Text size={200} weight="semibold">{count as number}</Text>
                      </div>
                    ))}
                    <Divider />
                    <div className={styles.countRow}>
                      <Text size={200} weight="bold">Total</Text>
                      <Text size={200} weight="bold">{selectedLog.total_records_deleted}</Text>
                    </div>
                  </div>

                  {selectedLog.extra_metadata?.affected_tables && (
                    <div style={{ marginTop: tokens.spacingVerticalM }}>
                      <Text className={styles.detailLabel}>Affected Tables</Text>
                      <Text size={200} block>
                        {(selectedLog.extra_metadata.affected_tables as string[]).join(", ")}
                      </Text>
                    </div>
                  )}

                  <div className={styles.immutabilityBadge}
                    style={{ marginTop: tokens.spacingVerticalM }}
                  >
                    <ShieldLock24Regular />
                    <Text size={200}>
                      This record is immutable and protected by database-level triggers.
                      It cannot be modified or deleted.
                    </Text>
                  </div>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
