"use client";

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
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  Edit24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Eye24Regular,
  Code24Regular,
  Add24Regular,
  Delete24Regular,
  Lightbulb24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import type { TrainingAnnotation } from "@/types/trainingTrack";

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  editorWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
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
  editButton: {
    position: "absolute" as const,
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
  },
  cardRelative: {
    position: "relative" as const,
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
});

// ── Props ────────────────────────────────────────────────────────────

export interface MarkdownAnnotationEditorProps {
  /** The annotation to edit */
  annotation: TrainingAnnotation;
  /** Step index for display purposes */
  stepIndex: number;
  /** Whether this card is in edit mode */
  isEditing: boolean;
  /** Called when the user clicks the edit button */
  onStartEdit: () => void;
  /** Called when the user saves edits */
  onSave: (updated: TrainingAnnotation) => Promise<void>;
  /** Called when the user cancels edits */
  onCancel: () => void;
  /** Whether the card is currently saving */
  isSaving?: boolean;
  /** Whether editing is allowed (consultant mode) */
  editable?: boolean;
}

// ── Component ────────────────────────────────────────────────────────

type EditorTab = "edit" | "preview";

export function MarkdownAnnotationEditor({
  annotation,
  stepIndex,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isSaving = false,
  editable = false,
}: MarkdownAnnotationEditorProps) {
  const styles = useStyles();

  // ── Draft state (only active during editing) ───────────────────────
  const [draftTitle, setDraftTitle] = useState("");
  const [draftInstruction, setDraftInstruction] = useState("");
  const [draftTooltip, setDraftTooltip] = useState("");
  const [draftDetail, setDraftDetail] = useState("");
  const [draftTips, setDraftTips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>("edit");

  // Track which field's preview to show
  const [previewField, setPreviewField] = useState<
    "instruction" | "detail"
  >("instruction");

  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Sync draft from annotation when entering edit mode ─────────────
  useEffect(() => {
    if (isEditing) {
      setDraftTitle(annotation.title ?? "");
      setDraftInstruction(annotation.instruction ?? "");
      setDraftTooltip(annotation.tooltip_text ?? "");
      setDraftDetail(annotation.detail_text ?? "");
      setDraftTips([...(annotation.tips ?? [])]);
      setActiveTab("edit");
      // Focus the title input after a tick
      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    }
  }, [isEditing, annotation]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const updated: TrainingAnnotation = {
      step_id: annotation.step_id,
      title: draftTitle.trim(),
      step_type: annotation.step_type ?? "interactive",
      instruction: draftInstruction,
      tooltip_text: draftTooltip.trim(),
      detail_text: draftDetail,
      tips: draftTips.filter((t) => t.trim() !== ""),
      business_rule_name: annotation.business_rule_name,
    };
    await onSave(updated);
  }, [
    annotation.step_id,
    draftTitle,
    draftInstruction,
    draftTooltip,
    draftDetail,
    draftTips,
    onSave,
  ]);

  const handleCancel = useCallback(() => {
    setActiveTab("edit");
    onCancel();
  }, [onCancel]);

  const handleAddTip = useCallback(() => {
    setDraftTips((prev) => [...prev, ""]);
  }, []);

  const handleRemoveTip = useCallback((index: number) => {
    setDraftTips((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateTip = useCallback((index: number, value: string) => {
    setDraftTips((prev) =>
      prev.map((t, i) => (i === index ? value : t))
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleCancel]
  );

  // ── Determine if there are unsaved changes ─────────────────────────
  const hasChanges =
    isEditing &&
    (draftTitle !== (annotation.title ?? "") ||
      draftInstruction !== (annotation.instruction ?? "") ||
      draftTooltip !== (annotation.tooltip_text ?? "") ||
      draftDetail !== (annotation.detail_text ?? "") ||
      JSON.stringify(draftTips.filter((t) => t.trim() !== "")) !==
        JSON.stringify(annotation.tips ?? []));

  // ── Edit mode ──────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className={styles.editorWrapper}
        onKeyDown={handleKeyDown}
      >
        {/* Editor toolbar with edit/preview tabs */}
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
          {isSaving && (
            <div className={styles.savingOverlay}>
              <Spinner size="tiny" />
              <Text size={200}>Saving...</Text>
            </div>
          )}
        </div>

        <div className={styles.tabContent}>
          {activeTab === "edit" ? (
            /* ── Edit tab ─────────────────────────────────────── */
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
                  onChange={(_, data) => setDraftInstruction(data.value)}
                  placeholder=""
                  aria-label="Instruction text (Markdown)"
                  resize="vertical"
                  rows={4}
                />
              </div>

              {/* Tooltip text */}
              <div className={styles.fieldGroup}>
                <Text className={styles.fieldLabel}>Tooltip / Hint</Text>
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
                  aria-label="Detail text (Markdown)"
                  resize="vertical"
                  rows={3}
                />
              </div>

              {/* Tips editor */}
              <div className={styles.fieldGroup}>
                <Text className={styles.fieldLabel}>
                  Tips{" "}
                  <Badge appearance="outline" color="subtle" size="tiny">
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
                      <Tooltip content="Remove tip" relationship="label">
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
            /* ── Preview tab ──────────────────────────────────── */
            <>
              {/* Preview field selector */}
              <div
                style={{
                  display: "flex",
                  gap: tokens.spacingHorizontalS,
                  marginBottom: tokens.spacingVerticalS,
                }}
              >
                <Badge
                  appearance={
                    previewField === "instruction" ? "filled" : "outline"
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

              {/* Rendered preview title */}
              {draftTitle && (
                <Text size={500} weight="semibold" block>
                  {draftTitle}
                </Text>
              )}

              {/* Rendered preview of selected Markdown field */}
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
                <div style={{ marginTop: tokens.spacingVerticalS }}>
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
                <div style={{ marginTop: tokens.spacingVerticalS }}>
                  <Text size={200} weight="semibold">
                    Tips
                  </Text>
                  {draftTips
                    .filter((t) => t.trim())
                    .map((tip, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: tokens.spacingHorizontalS,
                          padding: tokens.spacingVerticalXS,
                          paddingLeft: tokens.spacingHorizontalM,
                          backgroundColor:
                            tokens.colorPaletteYellowBackground1,
                          borderRadius: tokens.borderRadiusMedium,
                          marginTop: tokens.spacingVerticalXS,
                        }}
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
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            size="small"
            icon={<Checkmark24Regular />}
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  // ── View mode (read-only with edit button) ─────────────────────────
  return null; // View mode rendering is handled by StepViewer; this component only handles the edit overlay
}
