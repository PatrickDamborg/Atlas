"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Spinner,
  Text,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowSync20Regular } from "@fluentui/react-icons";
import { getAdoptionDashboard, ApiError } from "@/lib/api";
import type { AdoptionDashboardResponse } from "@/types/adoptionDashboard";
import { OverviewCards } from "./OverviewCards";
import { TrackCompletionCard } from "./TrackCompletionCard";

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
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacingVerticalXXXL,
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalM,
  },
});

interface AdoptionDashboardPageProps {
  projectId: string;
}

export function AdoptionDashboardPage({
  projectId,
}: AdoptionDashboardPageProps) {
  const styles = useStyles();

  const [data, setData] = useState<AdoptionDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const result = await getAdoptionDashboard(projectId);
      setData(result);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to load adoption metrics";
      setError(message);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner label="Loading adoption metrics..." size="large" />
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
            Adoption Dashboard
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Track end-user progress across all training walkthroughs in this
            project.
          </Text>
        </div>
        <Button
          appearance="subtle"
          icon={<ArrowSync20Regular />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {data && data.total_enrolled_users === 0 && data.total_tracks === 0 ? (
        <div className={styles.emptyState}>
          <Text
            size={500}
            weight="semibold"
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            No data yet
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Generate training walkthroughs and invite end users to see adoption
            metrics here.
          </Text>
        </div>
      ) : (
        data && (
          <>
            {/* Overview metric cards */}
            <OverviewCards data={data} />

            <Divider style={{ marginBottom: tokens.spacingVerticalL }} />

            {/* Per-track completion section */}
            <div className={styles.sectionHeader}>
              <Text size={500} weight="semibold">
                Track Completion
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Click a track to see per-user step completion details
              </Text>
            </div>

            {data.tracks.length === 0 ? (
              <Text
                size={300}
                style={{
                  color: tokens.colorNeutralForeground3,
                  display: "block",
                  padding: tokens.spacingVerticalL,
                }}
              >
                No ready training tracks. Generate walkthroughs to see track
                metrics.
              </Text>
            ) : (
              data.tracks.map((track) => (
                <TrackCompletionCard
                  key={track.app_track_id}
                  track={track}
                />
              ))
            )}
          </>
        )
      )}
    </div>
  );
}
