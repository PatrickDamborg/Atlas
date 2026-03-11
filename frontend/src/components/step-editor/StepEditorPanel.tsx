"use client";

/**
 * StepEditorPanel — Integrated step card editor with drag-reorder,
 * per-step enable/disable toggle, and inline Markdown annotation editing.
 *
 * Wires together StepCardList + MarkdownAnnotationEditor + useStepReorder
 * + useStepVisibility into a single panel that can be embedded in the
 * training walkthrough viewer.
 */

import { useState, useCallback, useMemo } from "react";
import {
  Text,
  Button,
  Divider,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Edit24Regular,
  Dismiss24Regular,
  PanelLeft24Regular,
  TextBulletListSquare24Regular,
} from "@fluentui/react-icons";
import { StepCardList } from "./StepCardList";
import { InlineStepCardEditor } from "./InlineStepCardEditor";
import { MarkdownAnnotationEditor } from "@/components/training-viewer/MarkdownAnnotationEditor";
import { useStepReorder } from "@/hooks/useStepReorder";
import { useStepVisibility } from "@/hooks/useStepVisibility";
import { updateStepAnnotation } from "@/lib/api";
import type { TrainingAnnotation, WalkthroughTrack } from "@/types/trainingTrack";

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  listPane: {
    width: "380px",
    minWidth: "320px",
    maxWidth: "480px",
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowY: "auto",
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  detailPane: {
    flex: 1,
    overflowY: "auto",
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  detailEmpty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    color: tokens.colorNeutralForeground4,
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },
});

// ── Props ────────────────────────────────────────────────────────────

export type EditorLayout = "split" | "inline";

export interface StepEditorPanelProps {
  /** The walkthrough track to edit. */
  track: WalkthroughTrack;
  /** Project ID for API calls. */
  projectId: string;
  /** App unique name for API calls. */
  appUniqueName: string;
  /** Called when annotations are modified (for parent cache invalidation). */
  onAnnotationsChanged?: (trackId: string, annotations: TrainingAnnotation[]) => void;
  /** Called when the editor should close. */
  onClose?: () => void;
  /** Initial editor layout mode. Defaults to "inline". */
  defaultLayout?: EditorLayout;
}

// ── Component ────────────────────────────────────────────────────────

export function StepEditorPanel({
  track,
  projectId,
  appUniqueName,
  onAnnotationsChanged,
  onClose,
  defaultLayout = "inline",
}: StepEditorPanelProps) {
  const styles = useStyles();
  const [layout, setLayout] = useState<EditorLayout>(defaultLayout);

  // ── Annotations state (local copy for optimistic updates) ──────────
  const [annotations, setAnnotations] = useState<TrainingAnnotation[]>(
    () => track.annotations
  );

  // ── Step reorder hook ──────────────────────────────────────────────
  const {
    saving: reorderSaving,
    saveError: reorderError,
    saveSuccess: reorderSuccess,
    handleReorder,
  } = useStepReorder({
    projectId,
    appUniqueName,
    trackId: track.track_id,
  });

  // ── Step visibility hook ───────────────────────────────────────────
  const {
    disabledStepIds,
    toggleStep: handleToggleStep,
    saving: visibilitySaving,
    saveError: visibilityError,
    saveSuccess: visibilitySuccess,
  } = useStepVisibility({
    projectId,
    appUniqueName,
    trackId: track.track_id,
    initialDisabledStepIds: track.disabled_step_ids ?? [],
  });

  // ── Selection / edit state ─────────────────────────────────────────
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | undefined>(
    undefined
  );
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [annotationSaving, setAnnotationSaving] = useState(false);

  const selectedAnnotation = useMemo(() => {
    if (selectedStepIndex === undefined || selectedStepIndex >= annotations.length)
      return null;
    return annotations[selectedStepIndex];
  }, [selectedStepIndex, annotations]);

  // ── Reorder handler (also update local annotations order) ──────────
  const handleReorderLocal = useCallback(
    (stepIds: string[]) => {
      // Reorder local annotations to match
      const idToAnnotation = new Map(annotations.map((a) => [a.step_id, a]));
      const reordered = stepIds
        .map((id) => idToAnnotation.get(id))
        .filter((a): a is TrainingAnnotation => a !== undefined);
      setAnnotations(reordered);
      onAnnotationsChanged?.(track.track_id, reordered);
      handleReorder(stepIds);
    },
    [annotations, handleReorder, onAnnotationsChanged, track.track_id]
  );

  // ── Annotation save handler ────────────────────────────────────────
  const handleSaveAnnotation = useCallback(
    async (updated: TrainingAnnotation) => {
      setAnnotationSaving(true);
      try {
        await updateStepAnnotation(
          projectId,
          appUniqueName,
          track.track_id,
          updated.step_id,
          {
            title: updated.title,
            instruction: updated.instruction,
            tooltip_text: updated.tooltip_text,
            detail_text: updated.detail_text,
            tips: updated.tips,
          }
        );

        // Update local state
        setAnnotations((prev) =>
          prev.map((a) => (a.step_id === updated.step_id ? updated : a))
        );
        onAnnotationsChanged?.(
          track.track_id,
          annotations.map((a) => (a.step_id === updated.step_id ? updated : a))
        );
        setEditingStepId(null);
      } finally {
        setAnnotationSaving(false);
      }
    },
    [projectId, appUniqueName, track.track_id, annotations, onAnnotationsChanged]
  );

  // ── Combined save status ───────────────────────────────────────────
  const combinedSaving = reorderSaving || visibilitySaving;
  const combinedError = reorderError || visibilityError || null;
  const combinedSuccess =
    (reorderSuccess || visibilitySuccess) && !combinedSaving;

  // ── Inline save handler (for InlineStepCardEditor) ─────────────────
  const handleInlineSaveAnnotation = useCallback(
    async (updated: TrainingAnnotation) => {
      await updateStepAnnotation(
        projectId,
        appUniqueName,
        track.track_id,
        updated.step_id,
        {
          title: updated.title,
          instruction: updated.instruction,
          tooltip_text: updated.tooltip_text,
          detail_text: updated.detail_text,
          tips: updated.tips,
        }
      );

      // Update local state
      setAnnotations((prev) =>
        prev.map((a) => (a.step_id === updated.step_id ? updated : a))
      );
      onAnnotationsChanged?.(
        track.track_id,
        annotations.map((a) => (a.step_id === updated.step_id ? updated : a))
      );
    },
    [projectId, appUniqueName, track.track_id, annotations, onAnnotationsChanged]
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Edit24Regular />
          <Text size={400} weight="semibold">
            Step Editor
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {track.title}
          </Text>
        </div>
        <div className={styles.headerLeft}>
          {/* Layout toggle */}
          <Tooltip
            content={
              layout === "inline"
                ? "Switch to split-pane layout"
                : "Switch to inline editing layout"
            }
            relationship="label"
          >
            <Button
              appearance="subtle"
              size="small"
              icon={
                layout === "inline" ? (
                  <PanelLeft24Regular />
                ) : (
                  <TextBulletListSquare24Regular />
                )
              }
              onClick={() =>
                setLayout((l) => (l === "inline" ? "split" : "inline"))
              }
              aria-label="Toggle editor layout"
            >
              {layout === "inline" ? "Split View" : "Inline Edit"}
            </Button>
          </Tooltip>
          {onClose && (
            <Button
              appearance="subtle"
              size="small"
              icon={<Dismiss24Regular />}
              onClick={onClose}
              aria-label="Close editor"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {layout === "inline" ? (
        /* ── Inline editing mode ─────────────────────────────────── */
        <div className={styles.detailPane}>
          <InlineStepCardEditor
            annotations={annotations}
            disabledStepIds={disabledStepIds}
            onReorder={handleReorderLocal}
            onToggleStep={handleToggleStep}
            onSaveAnnotation={handleInlineSaveAnnotation}
            saving={combinedSaving}
            saveError={combinedError}
            saveSuccess={combinedSuccess}
          />
        </div>
      ) : (
        /* ── Split-pane mode (original) ─────────────────────────── */
        <div className={styles.body}>
          {/* Left pane: step card list */}
          <div className={styles.listPane}>
            <StepCardList
              annotations={annotations}
              disabledStepIds={disabledStepIds}
              onReorder={handleReorderLocal}
              onToggleStep={handleToggleStep}
              onSelectStep={setSelectedStepIndex}
              selectedStepIndex={selectedStepIndex}
              saving={combinedSaving}
              saveError={combinedError}
              saveSuccess={combinedSuccess}
            />
          </div>

          {/* Right pane: annotation detail / editor */}
          <div className={styles.detailPane}>
            {selectedAnnotation ? (
              <>
                <div className={styles.detailHeader}>
                  <Text size={500} weight="semibold">
                    Step {(selectedStepIndex ?? 0) + 1}:{" "}
                    {selectedAnnotation.title || "Untitled"}
                  </Text>
                  {editingStepId !== selectedAnnotation.step_id && (
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Edit24Regular />}
                      onClick={() =>
                        setEditingStepId(selectedAnnotation.step_id)
                      }
                    >
                      Edit
                    </Button>
                  )}
                </div>
                <Divider style={{ marginBottom: tokens.spacingVerticalM }} />
                <MarkdownAnnotationEditor
                  annotation={selectedAnnotation}
                  stepIndex={selectedStepIndex ?? 0}
                  isEditing={editingStepId === selectedAnnotation.step_id}
                  onStartEdit={() =>
                    setEditingStepId(selectedAnnotation.step_id)
                  }
                  onSave={handleSaveAnnotation}
                  onCancel={() => setEditingStepId(null)}
                  isSaving={annotationSaving}
                  editable={true}
                />
                {/* Show read-only view when not editing */}
                {editingStepId !== selectedAnnotation.step_id && (
                  <StepAnnotationReadView annotation={selectedAnnotation} />
                )}
              </>
            ) : (
              <div className={styles.detailEmpty}>
                <Text size={300}>
                  Select a step from the list to view or edit its annotation.
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Read-only annotation view ────────────────────────────────────────

const useReadViewStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  fieldLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  fieldValue: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: "1.5",
    whiteSpace: "pre-wrap" as const,
  },
  emptyValue: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
});

function StepAnnotationReadView({
  annotation,
}: {
  annotation: TrainingAnnotation;
}) {
  const styles = useReadViewStyles();

  return (
    <div className={styles.root}>
      {/* Instruction */}
      <div className={styles.fieldGroup}>
        <Text className={styles.fieldLabel}>Instruction</Text>
        <Text className={annotation.instruction ? styles.fieldValue : styles.emptyValue}>
          {annotation.instruction || "No instruction text"}
        </Text>
      </div>

      {/* Tooltip */}
      <div className={styles.fieldGroup}>
        <Text className={styles.fieldLabel}>Tooltip / Hint</Text>
        <Text className={annotation.tooltip_text ? styles.fieldValue : styles.emptyValue}>
          {annotation.tooltip_text || "No tooltip text"}
        </Text>
      </div>

      {/* Detail */}
      <div className={styles.fieldGroup}>
        <Text className={styles.fieldLabel}>Detail</Text>
        <Text className={annotation.detail_text ? styles.fieldValue : styles.emptyValue}>
          {annotation.detail_text || "No detail text"}
        </Text>
      </div>

      {/* Tips */}
      <div className={styles.fieldGroup}>
        <Text className={styles.fieldLabel}>
          Tips ({annotation.tips?.length ?? 0})
        </Text>
        {annotation.tips && annotation.tips.length > 0 ? (
          annotation.tips.map((tip, i) => (
            <div key={i} className={styles.tipItem}>
              <Text size={200}>{tip}</Text>
            </div>
          ))
        ) : (
          <Text className={styles.emptyValue}>No tips</Text>
        )}
      </div>
    </div>
  );
}
