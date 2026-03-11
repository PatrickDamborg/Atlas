"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Checkbox,
  Text,
  Input,
  Textarea,
  Badge,
  Tooltip,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Divider,
  makeStyles,
  mergeClasses,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  ArrowRight24Regular,
  ReOrder24Regular,
  Edit24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Warning24Regular,
  Sparkle24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  SelectAllOn24Regular,
} from "@fluentui/react-icons";
import type {
  ProposedWorkflow,
  WorkflowItem,
  WorkflowOverride,
} from "@/types/workflow";

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  workflowRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    transitionProperty: "box-shadow, border-color, background-color",
    transitionDuration: "150ms",
    "&:hover": {
      boxShadow: tokens.shadow4,
      ...shorthands.borderColor(tokens.colorNeutralStroke1Hover),
    },
  },
  workflowRowSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },
  workflowRowDragging: {
    opacity: "0.5",
    boxShadow: tokens.shadow16,
  },
  workflowRowDragOver: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    ...shorthands.borderStyle("dashed"),
  },
  dragHandle: {
    cursor: "grab",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
    "&:hover": {
      color: tokens.colorNeutralForeground1,
    },
    "&:active": {
      cursor: "grabbing",
    },
  },
  checkboxCell: {
    display: "flex",
    alignItems: "center",
    paddingTop: tokens.spacingVerticalXXS,
  },
  contentCell: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  nameText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nameEdited: {
    fontStyle: "italic",
  },
  descriptionText: {
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
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    marginTop: tokens.spacingVerticalXXS,
  },
  actionsCell: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXXS,
    flexShrink: 0,
  },
  reorderButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    flex: "1",
    minWidth: 0,
  },
  editActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
  gapWarning: {
    marginTop: tokens.spacingVerticalXS,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  selectionSummary: {
    color: tokens.colorNeutralForeground2,
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
  orderBadge: {
    minWidth: "24px",
    textAlign: "center",
    flexShrink: 0,
  },
});

// ── Props ────────────────────────────────────────────────────────────

export interface WorkflowListEditorProps {
  /** Proposed workflows from Agent 1 analysis. */
  workflows: ProposedWorkflow[];
  /** Called when the consultant confirms their selection. */
  onConfirm: (
    selectedIds: string[],
    overrides: WorkflowOverride[]
  ) => void;
  /** Whether the confirm action is in progress. */
  submitting?: boolean;
  /** External error message to display. */
  error?: string | null;
}

// ── Component ────────────────────────────────────────────────────────

export function WorkflowListEditor({
  workflows: initialWorkflows,
  onConfirm,
  submitting = false,
  error = null,
}: WorkflowListEditorProps) {
  const styles = useStyles();

  // ── Initialise workflow items with selection state ────────────────
  const [items, setItems] = useState<WorkflowItem[]>(() =>
    initialWorkflows
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((w) => ({
        ...w,
        selected: w.ai_recommended,
      }))
  );

  // ── Editing state ────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // ── Drag state ───────────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // ── Selection handlers ────────────────────────────────────────────

  const handleToggle = useCallback((workflowId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === workflowId ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setItems((prev) => {
      const allSelected = prev.every((item) => item.selected);
      return prev.map((item) => ({ ...item, selected: !allSelected }));
    });
  }, []);

  // ── Inline editing ────────────────────────────────────────────────

  const startEditing = useCallback(
    (item: WorkflowItem) => {
      setEditingId(item.id);
      setEditName(item.editedName ?? item.name);
      setEditDescription(item.editedDescription ?? item.description);
    },
    []
  );

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }, []);

  const saveEditing = useCallback(() => {
    if (!editingId) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== editingId) return item;
        return {
          ...item,
          editedName: editName.trim() !== item.name ? editName.trim() : undefined,
          editedDescription:
            editDescription.trim() !== item.description
              ? editDescription.trim()
              : undefined,
        };
      })
    );
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }, [editingId, editName, editDescription]);

  // ── Drag-and-drop reordering ──────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    []
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

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
        return next;
      });
      setDragIndex(null);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  }, []);

  // ── Button-based reorder (keyboard-accessible alternative) ────────

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  // ── Confirm handler ──────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    const selectedIds = items
      .filter((item) => item.selected)
      .map((item) => item.id);

    const overrides: WorkflowOverride[] = items
      .filter((item) => item.selected && (item.editedName || item.editedDescription))
      .map((item) => ({
        workflow_id: item.id,
        ...(item.editedName ? { name: item.editedName } : {}),
        ...(item.editedDescription ? { description: item.editedDescription } : {}),
      }));

    onConfirm(selectedIds, overrides);
  }, [items, onConfirm]);

  // ── Derived state ────────────────────────────────────────────────

  const selectedCount = useMemo(
    () => items.filter((i) => i.selected).length,
    [items]
  );

  const allSelected = items.length > 0 && selectedCount === items.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const totalEstimatedSteps = useMemo(
    () =>
      items
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.estimated_steps, 0),
    [items]
  );

  // ── Render ───────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Warning24Regular className={styles.emptyIcon} />
        <Text size={500} weight="semibold">
          No Workflows Proposed
        </Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          The AI analysis did not propose any training workflows for this
          solution. This may indicate missing or insufficient model-driven app
          components.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Error bar */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Checkbox
            checked={allSelected ? true : someSelected ? "mixed" : false}
            onChange={handleSelectAll}
            label={allSelected ? "Deselect all" : "Select all"}
          />
          <Divider vertical style={{ height: "24px" }} />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {items.length} workflow{items.length !== 1 ? "s" : ""} proposed
            {" · "}
            Drag to reorder or use arrow buttons
          </Text>
        </div>
        <div className={styles.toolbarRight}>
          <Badge appearance="outline" color="informative" size="medium">
            {selectedCount} selected
          </Badge>
          <Badge appearance="outline" color="subtle" size="medium">
            ~{totalEstimatedSteps} steps
          </Badge>
        </div>
      </div>

      {/* Workflow list */}
      <div className={styles.list} role="list" aria-label="Proposed workflows">
        {items.map((item, index) => {
          const isEditing = editingId === item.id;
          const isDragging = dragIndex === index;
          const isDragOver = dragOverIndex === index && dragIndex !== index;
          const displayName = item.editedName ?? item.name;
          const displayDescription = item.editedDescription ?? item.description;
          const hasEdits = !!(item.editedName || item.editedDescription);

          return (
            <div
              key={item.id}
              role="listitem"
              className={mergeClasses(
                styles.workflowRow,
                item.selected && styles.workflowRowSelected,
                isDragging && styles.workflowRowDragging,
                isDragOver && styles.workflowRowDragOver
              )}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <div className={styles.dragHandle} aria-label="Drag to reorder">
                <ReOrder24Regular />
              </div>

              {/* Order badge */}
              <Badge
                appearance="filled"
                color={item.selected ? "brand" : "subtle"}
                size="small"
                className={styles.orderBadge}
              >
                {index + 1}
              </Badge>

              {/* Checkbox */}
              <div className={styles.checkboxCell}>
                <Checkbox
                  checked={item.selected}
                  onChange={() => handleToggle(item.id)}
                  aria-label={`Select workflow: ${displayName}`}
                />
              </div>

              {/* Content */}
              {isEditing ? (
                <div className={styles.editForm}>
                  <Input
                    value={editName}
                    onChange={(_, data) => setEditName(data.value)}
                    placeholder="Workflow name"
                    aria-label="Workflow name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditing();
                      if (e.key === "Escape") cancelEditing();
                    }}
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(_, data) => setEditDescription(data.value)}
                    placeholder="Workflow description"
                    aria-label="Workflow description"
                    resize="vertical"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEditing();
                    }}
                  />
                  <div className={styles.editActions}>
                    <Button
                      appearance="primary"
                      size="small"
                      icon={<Checkmark24Regular />}
                      onClick={saveEditing}
                    >
                      Save
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Dismiss24Regular />}
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.contentCell}>
                  <div className={styles.nameRow}>
                    <Text
                      className={mergeClasses(
                        styles.nameText,
                        hasEdits && styles.nameEdited
                      )}
                    >
                      {displayName}
                    </Text>
                    {item.ai_recommended && (
                      <Tooltip content="AI recommended" relationship="label">
                        <Sparkle24Regular
                          style={{
                            color: tokens.colorPaletteGoldForeground2,
                            fontSize: "16px",
                            width: "16px",
                            height: "16px",
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>
                    )}
                    {hasEdits && (
                      <Badge appearance="tint" color="warning" size="small">
                        Edited
                      </Badge>
                    )}
                  </div>
                  <Text className={styles.descriptionText}>
                    {displayDescription}
                  </Text>
                  <div className={styles.metaRow}>
                    <Badge appearance="outline" color="subtle" size="small">
                      {item.primary_entity_display_name}
                    </Badge>
                    {item.related_entities.length > 0 && (
                      <Tooltip
                        content={`Related: ${item.related_entities.join(", ")}`}
                        relationship="description"
                      >
                        <Badge appearance="tint" color="subtle" size="small">
                          +{item.related_entities.length} related
                        </Badge>
                      </Tooltip>
                    )}
                    <Badge appearance="outline" color="informative" size="small">
                      ~{item.estimated_steps} steps
                    </Badge>
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        appearance="tint"
                        color="subtle"
                        size="small"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {item.confidence < 0.6 && (
                      <Tooltip
                        content={`AI confidence: ${Math.round(item.confidence * 100)}%`}
                        relationship="description"
                      >
                        <Badge appearance="tint" color="warning" size="small">
                          Low confidence
                        </Badge>
                      </Tooltip>
                    )}
                  </div>
                  {item.gap_warning && (
                    <MessageBar
                      intent="warning"
                      className={styles.gapWarning}
                    >
                      <MessageBarBody>{item.gap_warning}</MessageBarBody>
                    </MessageBar>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className={styles.actionsCell}>
                {!isEditing && (
                  <Tooltip content="Edit name & description" relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Edit24Regular />}
                      onClick={() => startEditing(item)}
                      aria-label={`Edit ${displayName}`}
                    />
                  </Tooltip>
                )}
                <div className={styles.reorderButtons}>
                  <Tooltip content="Move up" relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ChevronUp24Regular />}
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                      aria-label="Move up"
                    />
                  </Tooltip>
                  <Tooltip content="Move down" relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ChevronDown24Regular />}
                      disabled={index === items.length - 1}
                      onClick={() => moveDown(index)}
                      aria-label="Move down"
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Text size={300} className={styles.selectionSummary}>
          {selectedCount === 0
            ? "No workflows selected — select at least one to continue"
            : `${selectedCount} workflow${selectedCount !== 1 ? "s" : ""} selected · ~${totalEstimatedSteps} estimated walkthrough steps`}
        </Text>
        <Button
          appearance="primary"
          size="large"
          icon={<ArrowRight24Regular />}
          iconPosition="after"
          disabled={selectedCount === 0 || submitting}
          onClick={handleConfirm}
        >
          {submitting
            ? "Confirming..."
            : `Confirm Selection (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}
