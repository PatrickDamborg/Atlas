"use client";

/**
 * StepCardList — Draggable step card list for the walkthrough editor.
 *
 * Renders each training annotation as a compact card with a drag handle.
 * Consultants can drag-and-drop to reorder steps or use keyboard-accessible
 * up/down buttons. Order changes are persisted via the reorder API endpoint.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Button,
  Text,
  Badge,
  Tooltip,
  Spinner,
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
  ShieldTask24Regular,
} from "@fluentui/react-icons";
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
    cursor: "default",
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
});

// ── Types ────────────────────────────────────────────────────────────

export interface StepCardItem extends TrainingAnnotation {
  /** Whether this step is enabled/visible in the walkthrough. */
  enabled: boolean;
}

export interface StepCardListProps {
  /** The annotations to display as step cards. */
  annotations: TrainingAnnotation[];
  /** Step IDs that are currently disabled (from backend). */
  disabledStepIds?: string[];
  /** Called when the consultant reorders steps. Receives the full new list of step_ids. */
  onReorder: (stepIds: string[]) => Promise<void> | void;
  /** Called when a step's visibility is toggled. Receives step_id and new enabled state. */
  onToggleStep?: (stepId: string, enabled: boolean) => Promise<void> | void;
  /** Called when a step card is clicked/selected. */
  onSelectStep?: (stepIndex: number) => void;
  /** Index of the currently selected step. */
  selectedStepIndex?: number;
  /** Whether a save is in progress. */
  saving?: boolean;
  /** Error message from the last save attempt. */
  saveError?: string | null;
  /** Whether reordering succeeded (for brief success indicator). */
  saveSuccess?: boolean;
  /** Whether the list is read-only (disables drag & reorder). */
  readOnly?: boolean;
}

// ── Component ────────────────────────────────────────────────────────

export function StepCardList({
  annotations,
  disabledStepIds = [],
  onReorder,
  onToggleStep,
  onSelectStep,
  selectedStepIndex,
  saving = false,
  saveError = null,
  saveSuccess = false,
  readOnly = false,
}: StepCardListProps) {
  const styles = useStyles();

  // ── Internal step items state ────────────────────────────────────
  const [items, setItems] = useState<StepCardItem[]>(() => {
    const disabledSet = new Set(disabledStepIds);
    return annotations.map((a) => ({
      ...a,
      enabled: !disabledSet.has(a.step_id),
    }));
  });

  // Sync with external annotations or disabledStepIds when they change
  useEffect(() => {
    const disabledSet = new Set(disabledStepIds);
    setItems(annotations.map((a) => ({
      ...a,
      enabled: !disabledSet.has(a.step_id),
    })));
  }, [annotations, disabledStepIds]);

  // ── Drag state ───────────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // ── Drag-and-drop handlers ───────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      if (readOnly) return;
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    [readOnly]
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
        // Persist the new order
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

  // ── Button-based reorder (keyboard-accessible) ───────────────────

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

  // ── Step toggle (enable/disable step in walkthrough) ─────────────

  const toggleStep = useCallback(
    (index: number) => {
      setItems((prev) => {
        const updated = prev.map((item, i) =>
          i === index ? { ...item, enabled: !item.enabled } : item
        );
        // Notify parent for backend persistence
        const toggledItem = updated[index];
        if (toggledItem && onToggleStep) {
          onToggleStep(toggledItem.step_id, toggledItem.enabled);
        }
        return updated;
      });
    },
    [onToggleStep]
  );

  // ── Render ───────────────────────────────────────────────────────

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
            {!readOnly && " · Drag to reorder or use arrow buttons"}
          </Text>
        </div>
        <div className={styles.toolbarRight}>
          {/* Save status indicator */}
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

      {/* Error bar */}
      {saveError && (
        <MessageBar intent="error">
          <MessageBarBody>{saveError}</MessageBarBody>
        </MessageBar>
      )}

      {/* Card list */}
      <div
        className={styles.cardList}
        role="list"
        aria-label="Walkthrough steps"
      >
        {items.map((item, index) => {
          const isDragging = dragIndex === index;
          const isDragOver = dragOverIndex === index && dragIndex !== index;
          const isSelected = selectedStepIndex === index;

          return (
            <div
              key={item.step_id}
              role="listitem"
              className={mergeClasses(
                styles.card,
                isSelected && styles.cardSelected,
                isDragging && styles.cardDragging,
                isDragOver && styles.cardDragOver,
                !item.enabled && styles.cardDisabled
              )}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectStep?.(index)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStep?.(index);
                }
              }}
              aria-selected={isSelected}
              aria-label={`Step ${index + 1}: ${item.title || "Untitled"}`}
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
                      {item.tips.length} tip{item.tips.length !== 1 ? "s" : ""}
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
                      aria-label={
                        item.enabled ? "Hide step" : "Show step"
                      }
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
