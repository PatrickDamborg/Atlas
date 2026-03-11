"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Spinner,
  Text,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Dropdown,
  Option,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  AppsListDetail24Regular,
  BookOpenGlobe24Regular,
  Edit24Regular,
  SlideText24Regular,
} from "@fluentui/react-icons";
import { TrackListSidebar } from "./TrackListSidebar";
import { StepViewer } from "./StepViewer";
import { D365ViewWithOverlay } from "@/components/d365-renderer/D365ViewWithOverlay";
import { StepEditorPanel } from "@/components/step-editor";
import { useTrackNavigation } from "@/hooks/useTrackNavigation";
import { listTrainingApps, getAppTrainingContent, ApiError } from "@/lib/api";
import type {
  TrainingAppEntry,
  TrainingAnnotation,
  AppTrainingContent,
} from "@/types/trainingTrack";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "48px",
  },
  appPickerSection: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  appPickerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "20px",
    width: "20px",
    height: "20px",
  },
  appDropdown: {
    minWidth: "260px",
  },
  appTitle: {
    flex: 1,
    textAlign: "center",
  },
  contentArea: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  errorContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    padding: tokens.spacingVerticalXXL,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    flex: 1,
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
  },
  emptyIcon: {
    fontSize: "64px",
    width: "64px",
    height: "64px",
    color: tokens.colorNeutralForeground4,
  },
  overviewBanner: {
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

interface TrainingWalkthroughViewerProps {
  projectId: string;
  /** Pre-select a specific app on mount */
  initialAppName?: string;
}

export function TrainingWalkthroughViewer({
  projectId,
  initialAppName,
}: TrainingWalkthroughViewerProps) {
  const styles = useStyles();

  // ── State ────────────────────────────────────────────────────────
  const [apps, setApps] = useState<TrainingAppEntry[]>([]);
  const [selectedAppName, setSelectedAppName] = useState<string | null>(
    initialAppName ?? null
  );
  const [content, setContent] = useState<AppTrainingContent | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [editorMode, setEditorMode] = useState(false);

  // Cache of loaded content per app to avoid refetching
  const [contentCache, setContentCache] = useState<
    Record<string, AppTrainingContent>
  >({});
  // Cache of selected track per app
  const [selectedTrackPerApp, setSelectedTrackPerApp] = useState<
    Record<string, string>
  >({});

  const {
    navMap,
    initializeTracks,
    getTrackState,
    nextStep,
    prevStep,
    goToStep,
    resetTrack,
    isFirstStep,
    isLastStep,
  } = useTrackNavigation();

  // ── Load available apps ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingApps(true);
    setError(null);

    listTrainingApps(projectId)
      .then((data) => {
        if (cancelled) return;
        setApps(data.apps);

        // Auto-select first app if none specified
        if (!selectedAppName && data.apps.length > 0) {
          const defaultApp = initialAppName
            ? data.apps.find((a) => a.app_unique_name === initialAppName)
            : data.apps[0];
          if (defaultApp) {
            setSelectedAppName(defaultApp.app_unique_name);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load training apps"
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingApps(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ── Load content when app changes ────────────────────────────────
  useEffect(() => {
    if (!selectedAppName) {
      setContent(null);
      setSelectedTrackId(null);
      return;
    }

    // Check cache first
    const cached = contentCache[selectedAppName];
    if (cached) {
      setContent(cached);
      initializeTracks(cached.tracks);
      // Restore previously selected track for this app
      const prevTrack = selectedTrackPerApp[selectedAppName];
      setSelectedTrackId(
        prevTrack ?? (cached.tracks.length > 0 ? cached.tracks[0].track_id : null)
      );
      return;
    }

    let cancelled = false;
    setLoadingContent(true);
    setError(null);

    getAppTrainingContent(projectId, selectedAppName)
      .then((data) => {
        if (cancelled) return;
        setContent(data);
        setContentCache((prev) => ({
          ...prev,
          [selectedAppName]: data,
        }));
        initializeTracks(data.tracks);
        // Select first track
        const firstTrackId =
          data.tracks.length > 0 ? data.tracks[0].track_id : null;
        setSelectedTrackId(firstTrackId);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load training content"
        );
        setContent(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingContent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAppName, projectId]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleAppChange = useCallback(
    (_: unknown, data: { optionValue?: string }) => {
      const newApp = data.optionValue;
      if (!newApp || newApp === selectedAppName) return;

      // Save current track selection for the current app
      if (selectedAppName && selectedTrackId) {
        setSelectedTrackPerApp((prev) => ({
          ...prev,
          [selectedAppName]: selectedTrackId,
        }));
      }

      setSelectedAppName(newApp);
    },
    [selectedAppName, selectedTrackId]
  );

  const handleSelectTrack = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      if (selectedAppName) {
        setSelectedTrackPerApp((prev) => ({
          ...prev,
          [selectedAppName]: trackId,
        }));
      }
    },
    [selectedAppName]
  );

  // ── Editor mode handlers ────────────────────────────────────────
  const handleAnnotationsChanged = useCallback(
    (trackId: string, updatedAnnotations: TrainingAnnotation[]) => {
      // Update the content cache so the viewer reflects edits
      if (!selectedAppName || !content) return;
      const updatedContent = {
        ...content,
        tracks: content.tracks.map((t) =>
          t.track_id === trackId
            ? { ...t, annotations: updatedAnnotations }
            : t
        ),
      };
      setContent(updatedContent);
      setContentCache((prev) => ({
        ...prev,
        [selectedAppName]: updatedContent,
      }));
    },
    [selectedAppName, content]
  );

  // ── Derived data ─────────────────────────────────────────────────
  const currentTrack = useMemo(() => {
    if (!content || !selectedTrackId) return null;
    return content.tracks.find((t) => t.track_id === selectedTrackId) ?? null;
  }, [content, selectedTrackId]);

  const currentNavState = selectedTrackId
    ? getTrackState(selectedTrackId)
    : undefined;

  const selectedApp = useMemo(
    () => apps.find((a) => a.app_unique_name === selectedAppName),
    [apps, selectedAppName]
  );

  // ── Render ───────────────────────────────────────────────────────
  if (loadingApps) {
    return (
      <div className={styles.root}>
        <div className={styles.spinnerContainer}>
          <Spinner label="Loading training apps..." size="large" />
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <BookOpenGlobe24Regular className={styles.emptyIcon} />
          <Text size={600} weight="semibold">
            No Training Content Available
          </Text>
          <Text size={300}>
            No apps with completed training tracks were found for this project.
            Please run the AI pipeline for at least one selected app first.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Top bar with app picker dropdown */}
      <div className={styles.topBar}>
        <div className={styles.appPickerSection}>
          <AppsListDetail24Regular className={styles.appPickerIcon} />
          <Dropdown
            className={styles.appDropdown}
            placeholder="Select an app..."
            value={selectedApp?.display_name ?? selectedAppName ?? ""}
            selectedOptions={selectedAppName ? [selectedAppName] : []}
            onOptionSelect={handleAppChange}
            size="medium"
          >
            {apps.map((app) => (
              <Option key={app.app_unique_name} value={app.app_unique_name}>
                {app.display_name || app.app_unique_name}
                {app.track_count > 0 && ` (${app.track_count} tracks)`}
              </Option>
            ))}
          </Dropdown>
        </div>

        {content && (
          <div className={styles.appTitle}>
            <Text size={400} weight="semibold">
              {content.app_display_name}
            </Text>
          </div>
        )}

        {/* Editor mode toggle */}
        {content && currentTrack && (
          <Tooltip
            content={editorMode ? "Switch to viewer" : "Edit walkthrough steps"}
            relationship="label"
          >
            <Button
              appearance={editorMode ? "primary" : "subtle"}
              size="small"
              icon={editorMode ? <SlideText24Regular /> : <Edit24Regular />}
              onClick={() => setEditorMode((prev) => !prev)}
            >
              {editorMode ? "View Mode" : "Edit Steps"}
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorContainer}>
          <MessageBar intent="error" style={{ maxWidth: "600px" }}>
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Loading content */}
      {loadingContent && (
        <div className={styles.spinnerContainer}>
          <Spinner label="Loading training content..." size="medium" />
        </div>
      )}

      {/* Content area: sidebar + step viewer */}
      {!loadingContent && !error && content && (
        <>
          {/* Solution overview banner */}
          {content.solution_overview && (
            <div className={styles.overviewBanner}>
              <Text size={200}>{content.solution_overview}</Text>
            </div>
          )}

          <div className={styles.contentArea}>
            {editorMode && currentTrack && selectedAppName ? (
              /* ── Editor mode: full step editor panel ─────────── */
              <StepEditorPanel
                track={currentTrack}
                projectId={projectId}
                appUniqueName={selectedAppName}
                onAnnotationsChanged={handleAnnotationsChanged}
                onClose={() => setEditorMode(false)}
              />
            ) : (
              <>
                {/* Track list sidebar */}
                <TrackListSidebar
                  tracks={content.tracks}
                  selectedTrackId={selectedTrackId}
                  navigationStates={navMap}
                  onSelectTrack={handleSelectTrack}
                />

                {/* Main content: D365 view grid with overlay OR step viewer fallback */}
                {currentTrack && currentNavState ? (
                  content.screens && content.screens.length > 0 ? (
                    <D365ViewWithOverlay
                      track={currentTrack}
                      navState={currentNavState}
                      screens={content.screens}
                      stepLayouts={content.step_layouts}
                      onNext={() => nextStep(currentTrack.track_id)}
                      onPrev={() => prevStep(currentTrack.track_id)}
                      onGoToStep={(idx) => goToStep(currentTrack.track_id, idx)}
                      onReset={() => resetTrack(currentTrack.track_id)}
                      isFirst={isFirstStep(currentTrack.track_id)}
                      isLast={isLastStep(currentTrack.track_id)}
                    />
                  ) : (
                    <StepViewer
                      track={currentTrack}
                      navState={currentNavState}
                      onNext={() => nextStep(currentTrack.track_id)}
                      onPrev={() => prevStep(currentTrack.track_id)}
                      onGoToStep={(idx) => goToStep(currentTrack.track_id, idx)}
                      onReset={() => resetTrack(currentTrack.track_id)}
                      isFirst={isFirstStep(currentTrack.track_id)}
                      isLast={isLastStep(currentTrack.track_id)}
                    />
                  )
                ) : (
                  <div className={styles.emptyState}>
                    <Text size={300}>
                      Select a training track from the sidebar to begin.
                    </Text>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
