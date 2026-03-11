"use client";

import {
  Card,
  CardHeader,
  Text,
  Badge,
  ProgressBar,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  CheckmarkCircle16Filled,
  Circle16Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import type { TrackAdoptionMetrics } from "@/types/adoptionDashboard";
import { UserProgressTable } from "./UserProgressTable";

const useStyles = makeStyles({
  card: {
    marginBottom: tokens.spacingVerticalM,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    borderRadius: tokens.borderRadiusMedium,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexGrow: 1,
  },
  trackName: {
    minWidth: "200px",
  },
  metricsRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXL,
  },
  metricItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXXS,
  },
  progressContainer: {
    width: "200px",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  progressBar: {
    flexGrow: 1,
  },
  expandedContent: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  statusIcon: {
    flexShrink: 0,
  },
});

interface TrackCompletionCardProps {
  track: TrackAdoptionMetrics;
}

export function TrackCompletionCard({ track }: TrackCompletionCardProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);

  const allComplete =
    track.enrolled_users > 0 &&
    track.completed_users === track.enrolled_users;

  return (
    <Card className={styles.card}>
      <div
        className={styles.headerRow}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${track.app_name} track details`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
      >
        <div className={styles.headerLeft}>
          <span className={styles.statusIcon}>
            {allComplete ? (
              <CheckmarkCircle16Filled
                style={{ color: tokens.colorPaletteGreenForeground1 }}
              />
            ) : (
              <Circle16Regular
                style={{ color: tokens.colorNeutralForeground3 }}
              />
            )}
          </span>

          <Text weight="semibold" className={styles.trackName}>
            {track.app_name}
          </Text>

          <div className={styles.metricsRow}>
            <div className={styles.metricItem}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Enrolled
              </Text>
              <Badge appearance="outline" color="informative">
                {track.enrolled_users}
              </Badge>
            </div>

            <div className={styles.metricItem}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Completed
              </Text>
              <Badge
                appearance="outline"
                color={track.completed_users > 0 ? "success" : "subtle"}
              >
                {track.completed_users}
              </Badge>
            </div>

            <div className={styles.progressContainer}>
              <ProgressBar
                className={styles.progressBar}
                value={track.average_completion_percentage / 100}
                thickness="large"
                color={allComplete ? "success" : "brand"}
              />
              <Text size={200} weight="semibold">
                {track.average_completion_percentage}%
              </Text>
            </div>
          </div>
        </div>

        {expanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
      </div>

      {expanded && (
        <div className={styles.expandedContent}>
          {track.user_progress.length === 0 ? (
            <Text
              size={300}
              style={{ color: tokens.colorNeutralForeground3 }}
            >
              No enrolled users yet.
            </Text>
          ) : (
            <UserProgressTable users={track.user_progress} />
          )}
        </div>
      )}
    </Card>
  );
}
