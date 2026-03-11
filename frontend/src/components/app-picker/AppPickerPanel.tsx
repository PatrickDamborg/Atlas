"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  SearchBox,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRight24Regular,
  Warning24Regular,
  AppsListDetail24Regular,
} from "@fluentui/react-icons";
import type { InputOnChangeData } from "@fluentui/react-components";
import { AppPickerCard } from "./AppPickerCard";
import { getTrainingTracks, ApiError } from "@/lib/api";
import type { TrainingTrack } from "@/types/trainingTrack";

const useStyles = makeStyles({
  panel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalXXL,
    paddingBottom: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  headerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "32px",
    width: "32px",
    height: "32px",
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
  },
  searchBox: {
    maxWidth: "320px",
  },
  trackCount: {
    color: tokens.colorNeutralForeground3,
  },
  content: {
    flex: 1,
    padding: tokens.spacingHorizontalXXL,
    paddingTop: tokens.spacingVerticalL,
    overflowY: "auto",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacingVerticalXXXL,
    flex: 1,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXXL,
    textAlign: "center",
  },
  emptyIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: "48px",
    width: "48px",
    height: "48px",
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalXXL,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  selectedInfo: {
    flex: 1,
    color: tokens.colorNeutralForeground2,
  },
  noResults: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
  },
});

interface AppPickerPanelProps {
  /** Project to load training tracks for */
  projectId: string;
  /** Currently active app unique name (if any) */
  activeAppName?: string | null;
  /** Called when the user selects a training track to open */
  onTrackSelect: (track: TrainingTrack) => void;
  /** Optional: show a compact version without the header */
  compact?: boolean;
}

export function AppPickerPanel({
  projectId,
  activeAppName,
  onTrackSelect,
  compact = false,
}: AppPickerPanelProps) {
  const styles = useStyles();

  // Data state
  const [tracks, setTracks] = useState<TrainingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppName, setSelectedAppName] = useState<string | null>(
    activeAppName ?? null
  );

  // ── Load training tracks ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTrainingTracks(projectId)
      .then((data) => {
        if (cancelled) return;
        setTracks(data.tracks);

        // Auto-select the first ready track if none is currently active
        if (!activeAppName && data.tracks.length > 0) {
          const firstReady = data.tracks.find((t) => t.status === "ready");
          if (firstReady) {
            setSelectedAppName(firstReady.app_unique_name);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to load training tracks";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, activeAppName]);

  // ── Filter tracks by search ────────────────────────────────────────
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.display_name.toLowerCase().includes(q) ||
        t.app_unique_name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  // ── Derived ────────────────────────────────────────────────────────
  const readyCount = useMemo(
    () => tracks.filter((t) => t.status === "ready").length,
    [tracks]
  );

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.app_unique_name === selectedAppName) ?? null,
    [tracks, selectedAppName]
  );

  // ── Handlers ───────────────────────────────────────────────────────
  const handleCardSelect = useCallback((appUniqueName: string) => {
    setSelectedAppName((prev) =>
      prev === appUniqueName ? prev : appUniqueName
    );
  }, []);

  const handleOpen = useCallback(() => {
    if (selectedTrack) {
      onTrackSelect(selectedTrack);
    }
  }, [selectedTrack, onTrackSelect]);

  const handleSearchChange = useCallback(
    (_ev: unknown, data: InputOnChangeData) => {
      setSearchQuery(data.value);
    },
    []
  );

  // ── Render: loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.spinnerContainer}>
          <Spinner label="Loading training tracks..." size="large" />
        </div>
      </div>
    );
  }

  // ── Render: main ───────────────────────────────────────────────────
  return (
    <div className={styles.panel}>
      {/* Header */}
      {!compact && (
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <AppsListDetail24Regular className={styles.headerIcon} />
            <div className={styles.headerText}>
              <Text size={700} weight="bold">
                Training Tracks
              </Text>
              <Text size={300} className={styles.subtitle}>
                Select a model-driven app to view its training walkthrough and
                reference documentation.
              </Text>
            </div>
          </div>

          {/* Search & count toolbar */}
          {tracks.length > 1 && (
            <div className={styles.toolbar}>
              <SearchBox
                className={styles.searchBox}
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="medium"
              />
              <Text size={200} className={styles.trackCount}>
                {readyCount} of {tracks.length} track
                {tracks.length !== 1 ? "s" : ""} ready
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Error bar */}
      {error && (
        <div style={{ padding: tokens.spacingHorizontalXXL, paddingBottom: 0 }}>
          <MessageBar intent="error" className={styles.errorBar}>
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {tracks.length === 0 ? (
          /* Empty state: no tracks at all */
          <div className={styles.emptyState}>
            <Warning24Regular className={styles.emptyIcon} />
            <Text size={500} weight="semibold">
              No Training Tracks Available
            </Text>
            <Text size={300} className={styles.subtitle}>
              No model-driven apps have been selected and processed yet. Upload a
              Dataverse solution and run the AI pipeline to generate training
              tracks.
            </Text>
          </div>
        ) : filteredTracks.length === 0 ? (
          /* Empty state: search returned no results */
          <div className={styles.noResults}>
            <Text size={400} weight="semibold">
              No matching tracks
            </Text>
            <Text size={300}>
              No training tracks match &ldquo;{searchQuery}&rdquo;. Try a
              different search term.
            </Text>
          </div>
        ) : (
          /* Track grid */
          <div
            className={styles.cardGrid}
            role="listbox"
            aria-label="Available training tracks"
          >
            {filteredTracks.map((track) => (
              <AppPickerCard
                key={track.app_unique_name}
                track={track}
                isSelected={selectedAppName === track.app_unique_name}
                onSelect={handleCardSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with open action */}
      {tracks.length > 0 && (
        <div className={styles.footer}>
          <Text size={300} className={styles.selectedInfo}>
            {selectedTrack
              ? `Selected: ${selectedTrack.display_name || selectedTrack.app_unique_name}`
              : "Select a training track to continue"}
          </Text>
          <Button
            appearance="primary"
            size="large"
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            disabled={!selectedTrack || selectedTrack.status !== "ready"}
            onClick={handleOpen}
          >
            {selectedTrack?.status === "generating"
              ? "Generating..."
              : selectedTrack?.status === "error"
                ? "Track Unavailable"
                : "Open Training"}
          </Button>
        </div>
      )}
    </div>
  );
}
