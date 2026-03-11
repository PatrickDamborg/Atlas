"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  SpinButton,
  ProgressBar,
  Badge,
  makeStyles,
  tokens,
  Tooltip,
} from "@fluentui/react-components";
import {
  PeopleTeam24Regular,
  Edit24Regular,
  Info16Regular,
} from "@fluentui/react-icons";
import type { SeatSummary } from "@/types/invite";

const useStyles = makeStyles({
  card: {
    width: "100%",
    maxWidth: "480px",
  },
  metricsRow: {
    display: "flex",
    gap: tokens.spacingHorizontalXL,
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  metric: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px",
  },
  metricValue: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeightHero800,
  },
  metricLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalS,
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalXS,
  },
  headerAction: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
});

interface SeatSummaryCardProps {
  summary: SeatSummary;
  onUpdateLimit: (newLimit: number) => Promise<void>;
  isUpdating?: boolean;
}

export function SeatSummaryCard({
  summary,
  onUpdateLimit,
  isUpdating = false,
}: SeatSummaryCardProps) {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(summary.seat_limit);
  const [error, setError] = useState<string | null>(null);

  const usagePercent =
    summary.seat_limit > 0
      ? summary.seats_used / summary.seat_limit
      : 0;

  const usageColor: "brand" | "success" | "warning" | "danger" =
    usagePercent >= 0.9
      ? "danger"
      : usagePercent >= 0.7
        ? "warning"
        : "success";

  const handleSave = useCallback(async () => {
    setError(null);
    try {
      await onUpdateLimit(newLimit);
      setDialogOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update seat limit");
    }
  }, [newLimit, onUpdateLimit]);

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<PeopleTeam24Regular />}
        header={
          <Text weight="semibold" size={500}>
            Seat Allocation
          </Text>
        }
        action={
          <div className={styles.headerAction}>
            <Tooltip
              content="Seats control how many end users can access this project's training materials"
              relationship="description"
            >
              <Info16Regular />
            </Tooltip>
            <Dialog open={dialogOpen} onOpenChange={(_, d) => setDialogOpen(d.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  icon={<Edit24Regular />}
                  size="small"
                >
                  Edit Limit
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Update Seat Limit</DialogTitle>
                  <DialogContent>
                    <Text as="p" style={{ marginBottom: 16 }}>
                      Set the maximum number of end users who can access this
                      project. Cannot be set below current usage (
                      {summary.seats_used} seats in use).
                    </Text>
                    <SpinButton
                      value={newLimit}
                      min={Math.max(1, summary.seats_used)}
                      max={10000}
                      step={1}
                      onChange={(_, data) => {
                        if (data.value !== undefined && data.value !== null) {
                          setNewLimit(data.value);
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                    {error && (
                      <Text
                        style={{ color: tokens.colorPaletteRedForeground1, marginTop: 8 }}
                        size={200}
                      >
                        {error}
                      </Text>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Cancel</Button>
                    </DialogTrigger>
                    <Button
                      appearance="primary"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </div>
        }
      />

      <div className={styles.metricsRow}>
        <div className={styles.metric}>
          <Text className={styles.metricValue}>{summary.seats_used}</Text>
          <Text className={styles.metricLabel}>Used</Text>
        </div>
        <div className={styles.metric}>
          <Text className={styles.metricValue}>{summary.seats_available}</Text>
          <Text className={styles.metricLabel}>Available</Text>
        </div>
        <div className={styles.metric}>
          <Text className={styles.metricValue}>{summary.seat_limit}</Text>
          <Text className={styles.metricLabel}>Limit</Text>
        </div>
        <div className={styles.metric}>
          <Badge
            appearance="filled"
            color={usageColor === "success" ? "success" : usageColor === "warning" ? "warning" : "danger"}
            size="medium"
          >
            {summary.active_invites} active
          </Badge>
          <Text className={styles.metricLabel}>Invites</Text>
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressLabel}>
          <Text size={200}>Seat Usage</Text>
          <Text size={200}>
            {summary.seats_used} / {summary.seat_limit} ({Math.round(usagePercent * 100)}%)
          </Text>
        </div>
        <ProgressBar
          value={usagePercent}
          color={usageColor === "danger" ? "error" : usageColor === "warning" ? "warning" : "brand"}
          thickness="large"
        />
      </div>
    </Card>
  );
}
