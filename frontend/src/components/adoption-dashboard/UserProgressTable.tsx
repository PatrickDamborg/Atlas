"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Badge,
  ProgressBar,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle16Filled,
  Clock16Regular,
  SubtractCircle16Regular,
} from "@fluentui/react-icons";
import type { UserTrackProgress } from "@/types/adoptionDashboard";

const useStyles = makeStyles({
  table: {
    width: "100%",
  },
  progressCell: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: "160px",
  },
  progressBar: {
    flexGrow: 1,
    minWidth: "80px",
  },
  statusCell: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  emailCell: {
    maxWidth: "240px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

interface UserProgressTableProps {
  users: UserTrackProgress[];
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function UserProgressTable({ users }: UserProgressTableProps) {
  const styles = useStyles();

  // Sort: incomplete users first (by completion %), then complete users
  const sorted = [...users].sort((a, b) => {
    if (a.is_complete !== b.is_complete) {
      return a.is_complete ? 1 : -1;
    }
    return b.completion_percentage - a.completion_percentage;
  });

  return (
    <Table className={styles.table} aria-label="User progress details">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>User</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Steps</TableHeaderCell>
          <TableHeaderCell>Progress</TableHeaderCell>
          <TableHeaderCell>Last Activity</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((user) => (
          <TableRow key={user.seat_id}>
            {/* Status */}
            <TableCell>
              <div className={styles.statusCell}>
                {user.is_complete ? (
                  <Tooltip content="Completed" relationship="label">
                    <CheckmarkCircle16Filled
                      style={{ color: tokens.colorPaletteGreenForeground1 }}
                    />
                  </Tooltip>
                ) : user.started_at ? (
                  <Tooltip content="In progress" relationship="label">
                    <Clock16Regular
                      style={{ color: tokens.colorPaletteYellowForeground1 }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip content="Not started" relationship="label">
                    <SubtractCircle16Regular
                      style={{ color: tokens.colorNeutralForeground3 }}
                    />
                  </Tooltip>
                )}
              </div>
            </TableCell>

            {/* Display Name */}
            <TableCell>
              <Text weight="semibold" size={300}>
                {user.user_display_name}
              </Text>
            </TableCell>

            {/* Email */}
            <TableCell>
              <Text
                size={200}
                className={styles.emailCell}
                style={{ color: tokens.colorNeutralForeground3 }}
              >
                {user.user_email}
              </Text>
            </TableCell>

            {/* Steps count */}
            <TableCell>
              <Text size={300}>
                {user.completed_count} / {user.total_steps}
              </Text>
            </TableCell>

            {/* Progress bar */}
            <TableCell>
              <div className={styles.progressCell}>
                <ProgressBar
                  className={styles.progressBar}
                  value={user.total_steps > 0 ? user.completion_percentage / 100 : 0}
                  thickness="medium"
                  color={user.is_complete ? "success" : "brand"}
                />
                <Text size={200} weight="semibold">
                  {user.completion_percentage}%
                </Text>
              </div>
            </TableCell>

            {/* Last activity */}
            <TableCell>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {formatRelativeTime(user.last_activity_at)}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
