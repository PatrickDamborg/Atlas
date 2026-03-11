"use client";

import { useMemo } from "react";
import {
  Text,
  Badge,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Checkmark24Regular,
  Clock24Regular,
  BookOpenGlobe24Regular,
} from "@fluentui/react-icons";
import type { WalkthroughTrack, TrackNavigationState } from "@/types/trainingTrack";

const useStyles = makeStyles({
  sidebar: {
    width: "280px",
    minWidth: "280px",
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
  },
  header: {
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  trackList: {
    display: "flex",
    flexDirection: "column",
    padding: tokens.spacingVerticalS,
    gap: tokens.spacingVerticalXXS,
  },
  trackItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    ...shorthands.border("1px", "solid", "transparent"),
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    "&:focus-visible": {
      outlineColor: tokens.colorBrandStroke1,
      outlineWidth: "2px",
      outlineStyle: "solid",
    },
  },
  trackItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.border("1px", "solid", tokens.colorBrandStroke1),
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  trackTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  trackMeta: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
  },
  progressText: {
    color: tokens.colorNeutralForeground3,
  },
  completedText: {
    color: tokens.colorPaletteGreenForeground1,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "32px",
    width: "32px",
    height: "32px",
  },
});

interface TrackListSidebarProps {
  tracks: WalkthroughTrack[];
  selectedTrackId: string | null;
  navigationStates: Record<string, TrackNavigationState>;
  onSelectTrack: (trackId: string) => void;
}

export function TrackListSidebar({
  tracks,
  selectedTrackId,
  navigationStates,
  onSelectTrack,
}: TrackListSidebarProps) {
  const styles = useStyles();

  if (tracks.length === 0) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <Text size={400} weight="semibold">
            Training Tracks
          </Text>
        </div>
        <div className={styles.emptyState}>
          <BookOpenGlobe24Regular className={styles.emptyIcon} />
          <Text size={200}>
            No training tracks available for this app.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <Text size={400} weight="semibold">
          Training Tracks ({tracks.length})
        </Text>
      </div>
      <div className={styles.trackList} role="listbox" aria-label="Training tracks">
        {tracks.map((track) => {
          const navState = navigationStates[track.track_id];
          const isSelected = selectedTrackId === track.track_id;
          const isCompleted = navState?.completed ?? false;
          const currentStep = (navState?.currentStepIndex ?? 0) + 1;
          const totalSteps = track.annotations.length;

          return (
            <div
              key={track.track_id}
              className={mergeClasses(
                styles.trackItem,
                isSelected && styles.trackItemSelected
              )}
              onClick={() => onSelectTrack(track.track_id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTrack(track.track_id);
                }
              }}
              role="option"
              aria-selected={isSelected}
              tabIndex={0}
            >
              <div className={styles.trackTitle}>
                {isCompleted ? (
                  <Checkmark24Regular
                    style={{ color: tokens.colorPaletteGreenForeground1 }}
                  />
                ) : (
                  <Play24Regular />
                )}
                <Text size={300} weight={isSelected ? "semibold" : "regular"}>
                  {track.title || `Track ${track.track_id}`}
                </Text>
              </div>
              <div className={styles.trackMeta}>
                <Tooltip content="Estimated duration" relationship="label">
                  <Badge appearance="outline" color="informative" size="small">
                    <Clock24Regular style={{ fontSize: "12px", marginRight: "2px" }} />
                    {track.estimated_duration_minutes}m
                  </Badge>
                </Tooltip>
                {totalSteps > 0 && (
                  <Text
                    size={100}
                    className={
                      isCompleted ? styles.completedText : styles.progressText
                    }
                  >
                    {isCompleted
                      ? "Completed"
                      : `Step ${currentStep}/${totalSteps}`}
                  </Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
