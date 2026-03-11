"use client";

import {
  Card,
  CardHeader,
  Text,
  makeStyles,
  tokens,
  ProgressBar,
} from "@fluentui/react-components";
import {
  PeopleTeam24Regular,
  AppFolder24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import type { AdoptionDashboardResponse } from "@/types/adoptionDashboard";

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  card: {
    minHeight: "120px",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`,
  },
  metricValue: {
    fontSize: "32px",
    fontWeight: 700 as const,
    lineHeight: "36px",
  },
  metricLabel: {
    color: tokens.colorNeutralForeground3,
  },
  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  progressBar: {
    flexGrow: 1,
  },
});

interface OverviewCardsProps {
  data: AdoptionDashboardResponse;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const styles = useStyles();

  const completedTracks = data.tracks.filter(
    (t) => t.completed_users > 0 && t.completed_users === t.enrolled_users
  ).length;

  return (
    <div className={styles.grid}>
      {/* Enrolled Users */}
      <Card className={styles.card}>
        <CardHeader
          image={
            <PeopleTeam24Regular
              style={{ color: tokens.colorBrandForeground1 }}
            />
          }
          header={
            <Text size={300} weight="semibold">
              Enrolled Users
            </Text>
          }
        />
        <div className={styles.cardBody}>
          <Text className={styles.metricValue}>
            {data.total_enrolled_users}
          </Text>
          <Text size={200} className={styles.metricLabel}>
            Active seat assignments
          </Text>
        </div>
      </Card>

      {/* Training Tracks */}
      <Card className={styles.card}>
        <CardHeader
          image={
            <AppFolder24Regular
              style={{ color: tokens.colorBrandForeground1 }}
            />
          }
          header={
            <Text size={300} weight="semibold">
              Training Tracks
            </Text>
          }
        />
        <div className={styles.cardBody}>
          <Text className={styles.metricValue}>{data.total_tracks}</Text>
          <Text size={200} className={styles.metricLabel}>
            {completedTracks > 0
              ? `${completedTracks} fully completed by all users`
              : "Ready app tracks"}
          </Text>
        </div>
      </Card>

      {/* Overall Completion */}
      <Card className={styles.card}>
        <CardHeader
          image={
            <CheckmarkCircle24Regular
              style={{ color: tokens.colorBrandForeground1 }}
            />
          }
          header={
            <Text size={300} weight="semibold">
              Overall Completion
            </Text>
          }
        />
        <div className={styles.cardBody}>
          <Text className={styles.metricValue}>
            {data.overall_completion_percentage}%
          </Text>
          <div className={styles.progressRow}>
            <ProgressBar
              className={styles.progressBar}
              value={data.overall_completion_percentage / 100}
              thickness="large"
              color="brand"
            />
          </div>
          <Text size={200} className={styles.metricLabel}>
            Across all tracks and users
          </Text>
        </div>
      </Card>
    </div>
  );
}
