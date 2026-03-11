"use client";

/**
 * InlineStepCardEditor — Step cards with inline Markdown annotation editing.
 *
 * Combines the draggable StepCardList with MarkdownAnnotationEditor so that
 * clicking a step card expands it inline to show the rich text editor with
 * Edit/Preview tabs. The editor saves via the annotation update API endpoint.
 *
 * Key features:
 * - Click a card to expand inline editor (Edit / Preview tabs)
 * - Markdown rendering for instruction and detail_text fields
 * - Tips add/remove within the inline editor
 * - Unsaved-change guard (confirm discard on navigate-away)
 * - Escape to cancel, auto-focus title on expand
 * - Drag-reorder and visibility toggles remain functional on non-editing cards
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Button,
  Text,
  Textarea,
  Input,
  Badge,
  Tooltip,
  Spinner,
  Tab,
  TabList,
  MessageBar,
  MessageBarBody,
  makeStyles,
  mergeClasses,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  ReOrder24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Edit24Regular,
  Code24Regular,
  Add24Regular,
  Delete24Regular,
  Lightbulb24Regular,
  ShieldTask24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import type { TrainingAnnotation } from "@/types/trainingTrack";

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalS,
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  // ── Collapsed card styles ──────────────────────────────────────────
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    transitionProperty: "box-shadow, border-color, background-color, opacity",
    transitionDuration: "150ms",
    cursor: "pointer",
    "&:hover": {
      boxShadow: tokens.shadow4,
      ...shorthands.borderColor(tokens.colorNeutralStroke1Hover),
    },
  },
  cardSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },
  cardDragging: {
    opacity: "0.4",
    boxShadow: tokens.shadow16,
  },
  cardDragOver: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    ...shorthands.borderStyle("dashed"),
    backgroundColor: tokens.colorBrandBackground2,
  },
  cardDisabled: {
    opacity: "0.5",
    backgroundColor: tokens.colorNeutralBackground4,
  },
  dragHandle: {
    cursor: "grab",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: tokens.spacingVerticalXXS,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    "&:hover": {
      color: tokens.colorNeutralForeground1,
    },
    "&:active": {
      cursor: "grabbing",
    },
  },
  orderBadge: {
    minWidth: "28px",
    textAlign: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  contentCell: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
    overflow: "hidden",
  },
  titleText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  titleDisabled: {
    textDecorationLine: "line-through",
    color: tokens.colorNeutralForeground4,
  },
  instructionPreview: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
    marginTop: tokens.spacingVerticalXXS,
  },
  actionsCell: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXXS,
    flexShrink: 0,
  },
  reorderButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  saveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
  // ── Expanded (inline editor) card styles ───────────────────────────
  expandedCard: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("2px", "solid", tokens.colorBrandStroke1),
    boxShadow: tokens.shadow8,
  },
  expandedHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  expandedHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  editorToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  fieldLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  markdownPreview: {
    minHeight: "60px",
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    lineHeight: "1.6",
    fontSize: tokens.fontSizeBase300,
    "& p": {
      marginTop: 0,
      marginBottom: tokens.spacingVerticalS,
    },
    "& p:last-child": {
      marginBottom: 0,
    },
    "& strong": {
      fontWeight: tokens.fontWeightBold,
    },
    "& ul, & ol": {
      paddingLeft: tokens.spacingHorizontalXL,
      marginTop: tokens.spacingVerticalXS,
      marginBottom: tokens.spacingVerticalXS,
    },
    "& li": {
      marginBottom: tokens.spacingVerticalXXS,
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground5,
      padding: "1px 4px",
      borderRadius: tokens.borderRadiusSmall,
      fontSize: tokens.fontSizeBase200,
    },
    "& blockquote": {
      borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
      paddingLeft: tokens.spacingHorizontalM,
      marginLeft: 0,
      marginRight: 0,
      color: tokens.colorNeutralForeground3,
    },
  },
  tipsEditor: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  tipRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  tipInput: {
    flex: 1,
  },
  tipIcon: {
    color: tokens.colorPaletteYellowForeground1,
    marginTop: "6px",
    flexShrink: 0,
  },
  addTipButton: {
    alignSelf: "flex-start",
  },
  editActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    justifyContent: "flex-end",
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalS,
  },
  savingOverlay: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
  },
  emptyPreview: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  previewFieldSelector: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  tipPreviewRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalXS,
  },
});

// ── Types ────────────────────────────────────────────────────────────

export interface StepCardItem extends TrainingAnnotation {
  /** Whether this step is enabled/visible in the walkthrough. */
  enabled: boolean;
}

export interface InlineStepCardEditorProps {
  /** The annotations to display as step cards. */
  annotations: TrainingAnnotation[];
  /** Step IDs that are currently disabled (from backend). */
  disabledStepIds?: string[];
  /** Called when the consultant reorders steps. Receives the full new list of step_ids. */
  onReorder: (stepIds: string[]) => Promise<void> | void;
  /** Called when a step's visibility is toggled. */
  onToggleStep?: (stepId: string, enabled: boolean) => Promise<void> | void;
  /** Called when a step annotation is saved. Returns the updated annotation. */
  onSaveAnnotation: (updated: TrainingAnnotation) => Promise<void>;
  /** Whether reordering is saving. */
  saving?: boolean;
  /** Error message from the last save attempt. */
  saveError?: string | null;
  /** Whether reordering succeeded (for brief success indicator). */
  saveSuccess?: boolean;
  /** Whether the list is read-only (disables drag, reorder, and editing). */
  readOnly?: boolean;
}

type EditorTab = "edit" | "preview";

// ── Component ────────────────────────────────────────────────────────

export function InlineStepCardEditor({
  annotations,
  disabledStepIds = [],
  onReorder,
  onToggleStep,
  onSaveAnnotation,
  saving = false,
  saveError = null,
  saveSuccess = false,
  readOnly = false,
}: InlineStepCardEditorProps) {
  const styles = useStyles();

  // ── Internal step items state ──────────────────────────────────────
  const [items, setItems] = useState<StepCardItem[]>(() => {
    const disabledSet = new Set(disabledStepIds);
    return annotations.map((a) => ({
      ...a,
      enabled: !disabledSet.has(a.step_id),
    }));
  });

  useEffect(() => {
    const disabledSet = new Set(disabledStepIds);
    setItems(
      annotations.map((a) => ({
        ...a,
        enabled: !disabledSet.has(a.step_id),
      }))
    );
  }, [annotations, disabledStepIds]);

  // ── Editing state ──────────────────────────────────────────────────
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [annotationSaveError, setAnnotationSaveError] = useState<string | null>(
    null
  );

  // Draft fields (active during editing)
  const [draftTitle, setDraftTitle] = useState("");
  const [draftInstruction, setDraftInstruction] = useState("");
  const [draftTooltip, setDraftTooltip] = useState("");
  const [draftDetail, setDraftDetail] = useState("");
  const [draftTips, setDraftTips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>("edit");
  const [previewField, setPreviewField] = useState<"instruction" | "detail">(
    "instruction"
  );

  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Open inline editor ─────────────────────────────────────────────
  const startEditing = useCallback(
    (index: number) => {
      if (readOnly) return;
      const item = items[index];
      if (!item) return;

      // Guard: unsaved changes on another card
      if (editingIndex !== null && editingIndex !== index) {
        const hasChanges = checkDraftChanges(items[editingIndex]);
        if (hasChanges) {
          const discard = window.confirm(
            "You have unsaved changes. Discard and switch to another step?"
          );
          if (!discard) return;
        }
      }

      setEditingIndex(index);
      setDraftTitle(item.title ?? "");
      setDraftInstruction(item.instruction ?? "");
      setDraftTooltip(item.tooltip_text ?? "");
      setDraftDetail(item.detail_text ?? "");
      setDraftTips([...(item.tips ?? [])]);
      setActiveTab("edit");
      setPreviewField("instruction");
      setAnnotationSaveError(null);

      // Focus title after expand
      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    },
    [readOnly, items, editingIndex]
  );

  // Helper: check if draft differs from the annotation
  const checkDraftChanges = useCallback(
    (item: StepCardItem | undefined) => {
      if (!item) return false;
      return (
        draftTitle !== (item.title ?? "") ||
        draftInstruction !== (item.instruction ?? "") ||
        draftTooltip !== (item.tooltip_text ?? "") ||
        draftDetail !== (item.detail_text ?? "") ||
        JSON.stringify(draftTips.filter((t) => t.trim() !== "")) !==
          JSON.stringify(item.tips ?? [])
      );
    },
    [draftTitle, draftInstruction, draftTooltip, draftDetail, draftTips]
  );

  const hasChanges =
    editingIndex !== null && checkDraftChanges(items[editingIndex]);

  // ── Save annotation ────────────────────────────────────────────────
  const handleSaveAnnotation = useCallback(async () => {
    if (editingIndex === null) return;
    const item = items[editingIndex];
    if (!item) return;

    const updated: TrainingAnnotation = {
      step_id: item.step_id,
      title: draftTitle.trim(),
      step_type: item.step_type ?? "interactive",
      instruction: draftInstruction,
      tooltip_text: draftTooltip.trim(),
      detail_text: draftDetail,
      tips: draftTips.filter((t) => t.trim() !== ""),
      business_rule_name: item.business_rule_name,
    };

    setIsSavingAnnotation(true);
    setAnnotationSaveError(null);
    try {
      await onSaveAnnotation(updated);
      // Update local state with saved values
      setItems((prev) =>
        prev.map((it, i) =>
          i === editingIndex ? { ...it, ...updated } : it
        )
      );
      setEditingIndex(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save annotation";
      setAnnotationSaveError(message);
    } finally {
      setIsSavingAnnotation(false);
    }
  }, [
    editingIndex,
    items,
    draftTitle,
    draftInstruction,
    draftTooltip,
    draftDetail,
    draftTips,
    onSaveAnnotation,
  ]);

  // ── Cancel editing ─────────────────────────────────────────────────
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setAnnotationSaveError(null);
    setActiveTab("edit");
  }, []);

  // ── Tips management ────────────────────────────────────────────────
  const handleAddTip = useCallback(() => {
    setDraftTips((prev) => [...prev, ""]);
  }, []);

  const handleRemoveTip = useCallback((tipIndex: number) => {
    setDraftTips((prev) => prev.filter((_, i) => i !== tipIndex));
  }, []);

  const handleUpdateTip = useCallback((tipIndex: number, value: string) => {
    setDraftTips((prev) => prev.map((t, i) => (i === tipIndex ? value : t)));
  }, []);

  // ── Keyboard: Escape to cancel ─────────────────────────────────────
  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancelEdit();
      }
    },
    [handleCancelEdit]
  );

  // ── Drag state ─────────────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      if (readOnly || editingIndex !== null) return;
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    [readOnly, editingIndex]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      dragCounter.current++;
      setDragOverIndex(index);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setDragOverIndex(null);
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOverIndex(null);

      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        return;
      }

      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(dropIndex, 0, moved);
        const newStepIds = next.map((item) => item.step_id);
        onReorder(newStepIds);
        return next;
      });
      setDragIndex(null);
    },
    [dragIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  }, []);

  // ── Button-based reorder ───────────────────────────────────────────
  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0 || readOnly) return;
      setItems((prev) => {
        const next = [...prev];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        const newStepIds = next.map((item) => item.step_id);
        onReorder(newStepIds);
        return next;
      });
    },
    [onReorder, readOnly]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (readOnly) return;
      setItems((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        const newStepIds = next.map((item) => item.step_id);
        onReorder(newStepIds);
        return next;
      });
    },
    [onReorder, readOnly]
  );

  // ── Step toggle ────────────────────────────────────────────────────
  const toggleStep = useCallback(
    (index: number) => {
      setItems((prev) => {
        const updated = prev.map((item, i) =>
          i === index ? { ...item, enabled: !item.enabled } : item
        );
        const toggledItem = updated[index];
        if (toggledItem && onToggleStep) {
          onToggleStep(toggledItem.step_id, toggledItem.enabled);
        }
        return updated;
      });
    },
    [onToggleStep]
  );

  // ── Render ─────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={400} weight="semibold">
          No Steps
        </Text>
        <Text size={200}>
          This track does not have any walkthrough steps yet.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {items.length} step{items.length !== 1 ? "s" : ""}
            {!readOnly && " \u00B7 Click to edit \u00B7 Drag to reorder"}
          </Text>
        </div>
        <div className={styles.toolbarRight}>
          {saving && (
            <div className={styles.saveIndicator}>
              <Spinner size="tiny" />
              <Text size={100}>Saving...</Text>
            </div>
          )}
          {saveSuccess && !saving && (
            <div className={styles.saveIndicator}>
              <Checkmark24Regular
                style={{
                  color: tokens.colorPaletteGreenForeground1,
                  fontSize: "14px",
                  width: "14px",
                  height: "14px",
                }}
              />
              <Text
                size={100}
                style={{ color: tokens.colorPaletteGreenForeground1 }}
              >
                Saved
              </Text>
            </div>
          )}
          <Badge appearance="outline" color="informative" size="medium">
            {items.filter((i) => i.enabled).length} active
          </Badge>
          {items.some((i) => !i.enabled) && (
            <Badge appearance="outline" color="danger" size="medium">
              {items.filter((i) => !i.enabled).length} hidden
            </Badge>
          )}
        </div>
      </div>

      {/* Error bars */}
      {saveError && (
        <MessageBar intent="error">
          <MessageBarBody>{saveError}</MessageBarBody>
        </MessageBar>
      )}
      {annotationSaveError && (
        <MessageBar intent="error">
          <MessageBarBody>{annotationSaveError}</MessageBarBody>
        </MessageBar>
      )}

      {/* Card list */}
      <div
        className={styles.cardList}
        role="list"
        aria-label="Walkthrough steps"
      >
        {items.map((item, index) => {
          const isEditing = editingIndex === index;
          const isDragging = dragIndex === index;
          const isDragOver = dragOverIndex === index && dragIndex !== index;

          if (isEditing && !readOnly) {
            // ── Expanded inline editor ──────────────────────────────
            return (
              <div
                key={item.step_id}
                role="listitem"
                className={styles.expandedCard}
                onKeyDown={handleEditorKeyDown}
              >
                {/* Header row */}
                <div className={styles.expandedHeader}>
                  <div className={styles.expandedHeaderLeft}>
                    <Badge
                      appearance="filled"
                      color="brand"
                      size="small"
                      className={styles.orderBadge}
                    >
                      {index + 1}
                    </Badge>
                    <Text size={400} weight="semibold">
                      Editing Step {index + 1}
                    </Text>
                    {item.step_type === "text" && (
                      <Badge
                        appearance="outline"
                        color="warning"
                        size="small"
                        icon={
                          <ShieldTask24Regular
                            style={{ fontSize: "10px", width: "10px", height: "10px" }}
                          />
                        }
                      >
                        Business Rule
                      </Badge>
                    )}
                    {!item.enabled && (
                      <Badge appearance="tint" color="danger" size="small">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  {isSavingAnnotation && (
                    <div className={styles.savingOverlay}>
                      <Spinner size="tiny" />
                      <Text size={200}>Saving...</Text>
                    </div>
                  )}
                </div>

                {/* Tab bar: Edit / Preview */}
                <div className={styles.editorToolbar}>
                  <TabList
                    selectedValue={activeTab}
                    onTabSelect={(_, data) =>
                      setActiveTab(data.value as EditorTab)
                    }
                    size="small"
                  >
                    <Tab value="edit" icon={<Code24Regular />}>
                      Edit
                    </Tab>
                    <Tab value="preview" icon={<Eye24Regular />}>
                      Preview
                    </Tab>
                  </TabList>
                </div>

                <div className={styles.tabContent}>
                  {activeTab === "edit" ? (
                    /* ── Edit tab ─────────────────────────────────── */
                    <>
                      {/* Title */}
                      <div className={styles.fieldGroup}>
                        <Text className={styles.fieldLabel}>Title</Text>
                        <Input
                          ref={titleInputRef}
                          value={draftTitle}
                          onChange={(_, data) => setDraftTitle(data.value)}
                          placeholder=""
                          aria-label="Step title"
                        />
                      </div>

                      {/* Instruction (Markdown) */}
                      <div className={styles.fieldGroup}>
                        <Text className={styles.fieldLabel}>
                          Instruction{" "}
                          <Badge
                            appearance="outline"
                            color="informative"
                            size="tiny"
                          >
                            Markdown
                          </Badge>
                        </Text>
                        <Textarea
                          value={draftInstruction}
                          onChange={(_, data) =>
                            setDraftInstruction(data.value)
                          }
                          placeholder=""
                          aria-label="Instruction text (Markdown supported)"
                          resize="vertical"
                          rows={4}
                        />
                      </div>

                      {/* Tooltip text */}
                      <div className={styles.fieldGroup}>
                        <Text className={styles.fieldLabel}>
                          Tooltip / Hint
                        </Text>
                        <Input
                          value={draftTooltip}
                          onChange={(_, data) => setDraftTooltip(data.value)}
                          placeholder=""
                          aria-label="Tooltip hint text"
                        />
                      </div>

                      {/* Detail text (Markdown) */}
                      <div className={styles.fieldGroup}>
                        <Text className={styles.fieldLabel}>
                          Detail Text{" "}
                          <Badge
                            appearance="outline"
                            color="informative"
                            size="tiny"
                          >
                            Markdown
                          </Badge>
                        </Text>
                        <Textarea
                          value={draftDetail}
                          onChange={(_, data) => setDraftDetail(data.value)}
                          placeholder=""
                          aria-label="Detail text (Markdown supported)"
                          resize="vertical"
                          rows={3}
                        />
                      </div>

                      {/* Tips editor */}
                      <div className={styles.fieldGroup}>
                        <Text className={styles.fieldLabel}>
                          Tips{" "}
                          <Badge
                            appearance="outline"
                            color="subtle"
                            size="tiny"
                          >
                            {draftTips.length}
                          </Badge>
                        </Text>
                        <div className={styles.tipsEditor}>
                          {draftTips.map((tip, idx) => (
                            <div key={idx} className={styles.tipRow}>
                              <Lightbulb24Regular
                                className={styles.tipIcon}
                                style={{
                                  fontSize: "16px",
                                  width: "16px",
                                  height: "16px",
                                }}
                              />
                              <Input
                                className={styles.tipInput}
                                value={tip}
                                onChange={(_, data) =>
                                  handleUpdateTip(idx, data.value)
                                }
                                placeholder=""
                                aria-label={`Tip ${idx + 1}`}
                              />
                              <Tooltip
                                content="Remove tip"
                                relationship="label"
                              >
                                <Button
                                  appearance="subtle"
                                  size="small"
                                  icon={<Delete24Regular />}
                                  onClick={() => handleRemoveTip(idx)}
                                  aria-label={`Remove tip ${idx + 1}`}
                                />
                              </Tooltip>
                            </div>
                          ))}
                          <Button
                            className={styles.addTipButton}
                            appearance="subtle"
                            size="small"
                            icon={<Add24Regular />}
                            onClick={handleAddTip}
                          >
                            Add Tip
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ── Preview tab ──────────────────────────────── */
                    <>
                      {/* Preview field selector */}
                      <div className={styles.previewFieldSelector}>
                        <Badge
                          appearance={
                            previewField === "instruction"
                              ? "filled"
                              : "outline"
                          }
                          color="brand"
                          size="small"
                          style={{ cursor: "pointer" }}
                          onClick={() => setPreviewField("instruction")}
                        >
                          Instruction
                        </Badge>
                        <Badge
                          appearance={
                            previewField === "detail" ? "filled" : "outline"
                          }
                          color="brand"
                          size="small"
                          style={{ cursor: "pointer" }}
                          onClick={() => setPreviewField("detail")}
                        >
                          Detail
                        </Badge>
                      </div>

                      {/* Title preview */}
                      {draftTitle && (
                        <Text size={500} weight="semibold" block>
                          {draftTitle}
                        </Text>
                      )}

                      {/* Markdown preview */}
                      <div className={styles.markdownPreview}>
                        {previewField === "instruction" ? (
                          draftInstruction ? (
                            <ReactMarkdown>{draftInstruction}</ReactMarkdown>
                          ) : (
                            <Text className={styles.emptyPreview} size={200}>
                              No instruction text
                            </Text>
                          )
                        ) : draftDetail ? (
                          <ReactMarkdown>{draftDetail}</ReactMarkdown>
                        ) : (
                          <Text className={styles.emptyPreview} size={200}>
                            No detail text
                          </Text>
                        )}
                      </div>

                      {/* Tooltip preview */}
                      {draftTooltip && (
                        <div
                          style={{ marginTop: tokens.spacingVerticalS }}
                        >
                          <Badge
                            appearance="tint"
                            color="informative"
                            size="small"
                          >
                            Hint
                          </Badge>
                          <Text
                            size={200}
                            style={{
                              marginLeft: tokens.spacingHorizontalS,
                              color: tokens.colorNeutralForeground3,
                            }}
                          >
                            {draftTooltip}
                          </Text>
                        </div>
                      )}

                      {/* Tips preview */}
                      {draftTips.filter((t) => t.trim()).length > 0 && (
                        <div
                          style={{ marginTop: tokens.spacingVerticalS }}
                        >
                          <Text size={200} weight="semibold">
                            Tips
                          </Text>
                          {draftTips
                            .filter((t) => t.trim())
                            .map((tip, idx) => (
                              <div
                                key={idx}
                                className={styles.tipPreviewRow}
                              >
                                <Lightbulb24Regular
                                  className={styles.tipIcon}
                                  style={{
                                    fontSize: "16px",
                                    width: "16px",
                                    height: "16px",
                                  }}
                                />
                                <Text size={200}>{tip}</Text>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Save / Cancel actions */}
                <div className={styles.editActions}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<Dismiss24Regular />}
                    onClick={handleCancelEdit}
                    disabled={isSavingAnnotation}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    size="small"
                    icon={<Checkmark24Regular />}
                    onClick={handleSaveAnnotation}
                    disabled={isSavingAnnotation || !hasChanges}
                  >
                    {isSavingAnnotation ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            );
          }

          // ── Collapsed card ────────────────────────────────────────
          return (
            <div
              key={item.step_id}
              role="listitem"
              className={mergeClasses(
                styles.card,
                isDragging && styles.cardDragging,
                isDragOver && styles.cardDragOver,
                !item.enabled && styles.cardDisabled
              )}
              draggable={!readOnly && editingIndex === null}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => startEditing(index)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  startEditing(index);
                }
              }}
              aria-label={`Step ${index + 1}: ${item.title || "Untitled"} \u2014 click to edit`}
            >
              {/* Drag handle */}
              {!readOnly && (
                <div
                  className={styles.dragHandle}
                  aria-label="Drag to reorder"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <ReOrder24Regular />
                </div>
              )}

              {/* Order badge */}
              <Badge
                appearance="filled"
                color={item.enabled ? "brand" : "subtle"}
                size="small"
                className={styles.orderBadge}
              >
                {index + 1}
              </Badge>

              {/* Content */}
              <div className={styles.contentCell}>
                <Text
                  className={mergeClasses(
                    styles.titleText,
                    !item.enabled && styles.titleDisabled
                  )}
                >
                  {item.title || `Step ${index + 1}`}
                </Text>
                {item.instruction && (
                  <Text className={styles.instructionPreview}>
                    {item.instruction}
                  </Text>
                )}
                <div className={styles.metaRow}>
                  {item.step_type === "text" && (
                    <Badge
                      appearance="outline"
                      color="warning"
                      size="small"
                      icon={
                        <ShieldTask24Regular
                          style={{ fontSize: "10px", width: "10px", height: "10px" }}
                        />
                      }
                    >
                      Business Rule
                    </Badge>
                  )}
                  {!item.enabled && (
                    <Badge appearance="tint" color="danger" size="small">
                      Hidden
                    </Badge>
                  )}
                  {item.tips.length > 0 && (
                    <Badge appearance="tint" color="warning" size="small">
                      {item.tips.length} tip
                      {item.tips.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {item.tooltip_text && (
                    <Badge appearance="tint" color="informative" size="small">
                      Hint
                    </Badge>
                  )}
                  {item.detail_text && (
                    <Badge appearance="tint" color="subtle" size="small">
                      Detail
                    </Badge>
                  )}
                  {!readOnly && (
                    <Badge appearance="outline" color="subtle" size="tiny">
                      <Edit24Regular
                        style={{
                          fontSize: "10px",
                          width: "10px",
                          height: "10px",
                          marginRight: "2px",
                        }}
                      />
                      Click to edit
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actionsCell}>
                {/* Toggle visibility */}
                {!readOnly && (
                  <Tooltip
                    content={
                      item.enabled
                        ? "Hide step from walkthrough"
                        : "Show step in walkthrough"
                    }
                    relationship="label"
                  >
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={
                        item.enabled ? (
                          <Eye24Regular />
                        ) : (
                          <EyeOff24Regular />
                        )
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(index);
                      }}
                      aria-label={item.enabled ? "Hide step" : "Show step"}
                    />
                  </Tooltip>
                )}

                {/* Keyboard reorder buttons */}
                {!readOnly && (
                  <div className={styles.reorderButtons}>
                    <Tooltip content="Move up" relationship="label">
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<ChevronUp24Regular />}
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveUp(index);
                        }}
                        aria-label="Move up"
                      />
                    </Tooltip>
                    <Tooltip content="Move down" relationship="label">
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<ChevronDown24Regular />}
                        disabled={index === items.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDown(index);
                        }}
                        aria-label="Move down"
                      />
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
