"use client";

/**
 * QuickCreateForm — D365-style Quick Create slide-in panel with Markdown annotations.
 *
 * Renders a simplified field layout based on `ScreenLayout.elements` from the
 * UX Expert agent. Each field row receives a `data-element-id` attribute
 * matching the element's `element_id`, enabling the CoachMark overlay to
 * locate and highlight individual fields during walkthrough step annotation.
 *
 * Fields are **display-only** (no actual data binding). Text inputs, dropdowns,
 * checkboxes, lookup fields, and date pickers are all rendered as empty with
 * Markdown annotation callouts — matching the project constraint of
 * "no sample data in forms — empty fields with annotations only".
 *
 * When a `TrainingAnnotation` is provided (via the `annotation` prop), the
 * component renders a Markdown callout beneath the highlighted field showing
 * the annotation instruction, tooltip, detail text, and tips.
 */

import { useCallback, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Text,
  Input,
  Textarea,
  Dropdown,
  Option,
  Checkbox,
  Label,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  Save24Regular,
  CalendarLtr24Regular,
  Search20Regular,
  Info24Regular,
  Lightbulb24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import type {
  ScreenElement,
  ScreenLayout,
  TrainingAnnotation,
} from "@/types/trainingTrack";

// ── Constants ────────────────────────────────────────────────────────────

const DIALOG_WIDTH = 600;
const DIALOG_MAX_HEIGHT = "80vh";

// ── Styles ───────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  /** Full-screen backdrop overlay */
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 8000,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },

  /** Quick Create dialog panel — slides in from right, D365-style */
  dialog: {
    width: `${DIALOG_WIDTH}px`,
    maxHeight: DIALOG_MAX_HEIGHT,
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    display: "flex",
    flexDirection: "column",
    overflowY: "hidden",
    animationName: {
      from: { transform: "translateX(100%)" },
      to: { transform: "translateX(0)" },
    },
    animationDuration: "250ms",
    animationTimingFunction: "ease-out",
  },

  /** D365-style header bar with entity name and close button */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },

  headerEntityBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: 600,
    fontSize: "13px",
    flexShrink: 0,
    userSelect: "none",
  },

  /** Scrollable body with form fields */
  body: {
    flex: 1,
    overflowY: "auto",
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
  },

  /** A form section group */
  section: {
    marginBottom: tokens.spacingVerticalL,
  },

  sectionLabel: {
    marginBottom: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  /** Individual field row */
  fieldRow: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalM,
    position: "relative",
  },

  fieldLabel: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
  },

  requiredStar: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: 600,
    fontSize: "14px",
  },

  /** Highlighted field when targeted by a walkthrough step */
  fieldHighlighted: {
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
    padding: tokens.spacingVerticalXS,
    marginLeft: `-${tokens.spacingHorizontalXS}`,
    marginRight: `-${tokens.spacingHorizontalXS}`,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
  },

  /** Lookup field wrapper — D365 style with search icon */
  lookupField: {
    position: "relative",
  },

  lookupSearchIcon: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    color: tokens.colorNeutralForeground3,
    pointerEvents: "none",
  },

  /** Date picker wrapper — D365 style with calendar icon */
  dateField: {
    position: "relative",
  },

  dateCalendarIcon: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    color: tokens.colorNeutralForeground3,
    pointerEvents: "none",
  },

  /** Footer with Save / Save and Close / Cancel buttons */
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0,
  },

  /** Read-only annotation marker for empty fields — rendered as Markdown */
  annotationText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
    marginTop: tokens.spacingVerticalXXS,
  },

  /** Markdown annotation callout — shown beneath highlighted fields */
  annotationCallout: {
    marginTop: tokens.spacingVerticalS,
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: `0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },

  annotationCalloutHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },

  /** Markdown content inside the annotation callout */
  markdownContent: {
    lineHeight: "1.5",
    fontSize: tokens.fontSizeBase200,
    "& p": {
      marginTop: 0,
      marginBottom: tokens.spacingVerticalXS,
    },
    "& p:last-child": {
      marginBottom: 0,
    },
    "& ul, & ol": {
      paddingLeft: tokens.spacingHorizontalL,
      marginTop: 0,
      marginBottom: tokens.spacingVerticalXS,
    },
    "& li": {
      marginBottom: tokens.spacingVerticalXXS,
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground5,
      paddingLeft: tokens.spacingHorizontalXXS,
      paddingRight: tokens.spacingHorizontalXXS,
      borderRadius: tokens.borderRadiusSmall,
      fontFamily: tokens.fontFamilyMonospace,
      fontSize: tokens.fontSizeBase200,
    },
    "& strong": {
      fontWeight: tokens.fontWeightSemibold,
    },
  },

  /** Detail section inside the annotation callout */
  annotationDetail: {
    marginTop: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
  },

  annotationDetailHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },

  /** Tips list inside the annotation callout */
  annotationTipsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    marginTop: tokens.spacingVerticalS,
  },

  annotationTipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXS,
    padding: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusSmall,
  },

  annotationTipIcon: {
    color: tokens.colorPaletteYellowForeground1,
    marginTop: "1px",
    flexShrink: 0,
    width: "14px",
    height: "14px",
  },

  /** Tooltip hint badge row */
  tooltipHintRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
});

// ── Field type inference ─────────────────────────────────────────────────

type RenderedFieldType =
  | "text"
  | "textarea"
  | "lookup"
  | "picklist"
  | "boolean"
  | "date"
  | "number"
  | "currency";

function inferFieldType(element: ScreenElement): RenderedFieldType {
  const meta = element.metadata ?? {};
  const typeHint = (
    (meta.field_type as string) ??
    (meta.attribute_type as string) ??
    ""
  ).toLowerCase();
  const label = element.label.toLowerCase();

  if (
    typeHint === "lookup" ||
    typeHint === "customer" ||
    typeHint === "owner" ||
    label.includes("lookup")
  )
    return "lookup";
  if (
    typeHint === "picklist" ||
    typeHint === "multiselectpicklist" ||
    typeHint === "state" ||
    typeHint === "status"
  )
    return "picklist";
  if (typeHint === "boolean") return "boolean";
  if (typeHint === "datetime" || label.includes("date")) return "date";
  if (typeHint === "memo" || typeHint === "multiline") return "textarea";
  if (
    typeHint === "integer" ||
    typeHint === "decimal" ||
    typeHint === "float" ||
    typeHint === "bigint"
  )
    return "number";
  if (typeHint === "money") return "currency";
  return "text";
}

function isRequiredField(element: ScreenElement): boolean {
  const meta = element.metadata ?? {};
  return (
    meta.is_required === true ||
    meta.required === true ||
    (element.label ?? "").includes("*")
  );
}

// ── Props ────────────────────────────────────────────────────────────────

export interface QuickCreateFormProps {
  /** The screen layout from the UX Expert describing this Quick Create form */
  screen: ScreenLayout;
  /** The entity display name shown in the header */
  entityDisplayName?: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog is closed (backdrop click, close button, Cancel) */
  onClose: () => void;
  /**
   * Element IDs that should be visually highlighted as the current walkthrough
   * target. The component adds `data-element-id` attributes on every field
   * row so the CoachMark overlay can find and target them.
   */
  highlightedElementIds?: string[];
  /**
   * Training annotation for the current walkthrough step. When provided,
   * a Markdown annotation callout is rendered beneath the highlighted field
   * showing instruction, tooltip, detail text, and tips.
   */
  annotation?: TrainingAnnotation | null;
  /**
   * Current step index (0-based) — displayed in the annotation callout badge.
   */
  stepIndex?: number;
  /**
   * Total number of steps — displayed in the annotation callout.
   */
  totalSteps?: number;
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * Quick Create form renderer — a D365-style slide-in panel.
 *
 * Renders a simplified field layout based on `ScreenLayout.elements`
 * from the UX Expert agent. Each field row receives a `data-element-id`
 * attribute matching the element's `element_id`, enabling the CoachMark
 * overlay to locate and highlight individual fields during walkthrough
 * step annotation.
 *
 * Fields are **display-only** (no actual data binding). Text inputs,
 * dropdowns, checkboxes, lookup fields, and date pickers are all rendered
 * as empty with annotation text explaining the field's purpose — matching
 * the project constraint of "no sample data in forms".
 */
export function QuickCreateForm({
  screen,
  entityDisplayName,
  open,
  onClose,
  highlightedElementIds = [],
  annotation = null,
  stepIndex,
  totalSteps,
}: QuickCreateFormProps) {
  const styles = useStyles();

  // ── Derive entity initial for the header badge ──────────────────────
  const displayName =
    entityDisplayName || screen.entity_display_name || screen.title || "Record";
  const entityInitial = displayName.charAt(0).toUpperCase();

  // ── Group elements by section ───────────────────────────────────────
  const { sections, unsectionedFields } = useMemo(() => {
    const sectionElements: ScreenElement[] = [];
    const fieldElements: ScreenElement[] = [];

    for (const el of screen.elements) {
      if (el.element_type === "section") {
        sectionElements.push(el);
      } else if (
        el.element_type === "form_field" ||
        el.element_type === "subgrid" ||
        el.element_type === "header"
      ) {
        fieldElements.push(el);
      }
    }

    // If sections exist, group fields under them via position metadata
    if (sectionElements.length > 0) {
      const grouped: { section: ScreenElement; fields: ScreenElement[] }[] =
        sectionElements
          .sort(
            (a, b) =>
              ((a.position?.order as number) ?? 0) -
              ((b.position?.order as number) ?? 0)
          )
          .map((sec) => ({
            section: sec,
            fields: fieldElements.filter((f) => {
              const sectionId =
                (f.position?.section_id as string) ??
                (f.metadata?.section_id as string) ??
                "";
              return sectionId === sec.element_id;
            }),
          }));

      // Fields not assigned to any section
      const assignedIds = new Set(
        grouped.flatMap((g) => g.fields.map((f) => f.element_id))
      );
      const unassigned = fieldElements.filter(
        (f) => !assignedIds.has(f.element_id)
      );

      return { sections: grouped, unsectionedFields: unassigned };
    }

    return { sections: [], unsectionedFields: fieldElements };
  }, [screen.elements]);

  // ── Check if a field is highlighted ─────────────────────────────────
  const isHighlighted = useCallback(
    (elementId: string) => highlightedElementIds.includes(elementId),
    [highlightedElementIds]
  );

  // ── Render the Markdown annotation callout beneath a highlighted field ──
  const renderAnnotationCallout = useCallback(() => {
    if (!annotation) return null;

    return (
      <Card className={styles.annotationCallout}>
        {/* Callout header with step badge */}
        <div className={styles.annotationCalloutHeader}>
          {stepIndex != null && (
            <Badge appearance="filled" color="brand" size="small">
              {stepIndex + 1}
            </Badge>
          )}
          <Text size={300} weight="semibold">
            {annotation.title || "Quick Create"}
          </Text>
          {stepIndex != null && totalSteps != null && (
            <Text
              size={100}
              style={{ marginLeft: "auto", color: tokens.colorNeutralForeground3 }}
            >
              {stepIndex + 1} / {totalSteps}
            </Text>
          )}
        </div>

        {/* Instruction rendered as Markdown */}
        {annotation.instruction && (
          <div className={styles.markdownContent}>
            <ReactMarkdown>{annotation.instruction}</ReactMarkdown>
          </div>
        )}

        {/* Tooltip hint */}
        {annotation.tooltip_text && (
          <div className={styles.tooltipHintRow}>
            <Badge appearance="tint" color="informative" size="tiny">
              Hint
            </Badge>
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              {annotation.tooltip_text}
            </Text>
          </div>
        )}

        {/* Detail section rendered as Markdown */}
        {annotation.detail_text && (
          <div className={styles.annotationDetail}>
            <div className={styles.annotationDetailHeader}>
              <Info24Regular style={{ fontSize: "14px", width: "14px", height: "14px" }} />
              <Text size={100} weight="semibold">
                More Detail
              </Text>
            </div>
            <div className={styles.markdownContent}>
              <ReactMarkdown>{annotation.detail_text}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Tips */}
        {annotation.tips && annotation.tips.length > 0 && (
          <div className={styles.annotationTipsList}>
            {annotation.tips.map((tip, idx) => (
              <div key={idx} className={styles.annotationTipItem}>
                <Lightbulb24Regular className={styles.annotationTipIcon} />
                <Text size={100}>{tip}</Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }, [annotation, stepIndex, totalSteps, styles]);

  // ── Render a single form field ──────────────────────────────────────
  const renderField = useCallback(
    (element: ScreenElement) => {
      const fieldType = inferFieldType(element);
      const required = isRequiredField(element);
      const highlighted = isHighlighted(element.element_id);
      const metaAnnotation =
        (element.metadata?.guidance as string) ??
        (element.metadata?.purpose as string) ??
        "";

      return (
        <div
          key={element.element_id}
          className={mergeClasses(
            styles.fieldRow,
            highlighted ? styles.fieldHighlighted : undefined
          )}
          data-element-id={element.element_id}
          id={element.element_id}
        >
          {/* Field label */}
          {element.label && fieldType !== "boolean" && (
            <div className={styles.fieldLabel}>
              {required && <span className={styles.requiredStar}>*</span>}
              <Label size="small" htmlFor={`qc-field-${element.element_id}`}>
                {element.label}
              </Label>
            </div>
          )}

          {/* Field control — empty, no sample data */}
          {renderFieldControl(element, fieldType, required)}

          {/* Metadata annotation text (plain text from UX Expert) */}
          {metaAnnotation && (
            <span className={styles.annotationText}>{metaAnnotation}</span>
          )}

          {/* Walkthrough Markdown annotation callout — shown on highlighted field */}
          {highlighted && renderAnnotationCallout()}
        </div>
      );
    },
    [isHighlighted, styles, renderAnnotationCallout]
  );

  // ── Render the correct field control ────────────────────────────────
  const renderFieldControl = useCallback(
    (
      element: ScreenElement,
      fieldType: RenderedFieldType,
      required: boolean
    ) => {
      const fieldId = `qc-field-${element.element_id}`;

      switch (fieldType) {
        case "textarea":
          return (
            <Textarea
              id={fieldId}
              placeholder=""
              resize="vertical"
              rows={3}
              readOnly
              aria-label={element.label}
            />
          );

        case "lookup":
          return (
            <div className={styles.lookupField}>
              <Input
                id={fieldId}
                placeholder=""
                readOnly
                aria-label={element.label}
                style={{ paddingRight: "32px" }}
              />
              <Search20Regular className={styles.lookupSearchIcon} />
            </div>
          );

        case "picklist":
          return (
            <Dropdown
              id={fieldId}
              placeholder="---"
              aria-label={element.label}
              disabled
            >
              <Option value="">---</Option>
              {((element.metadata?.options as { label: string; value: string }[]) ?? []).map(
                (opt, idx) => (
                  <Option key={idx} value={String(opt.value ?? idx)}>
                    {opt.label ?? `Option ${idx + 1}`}
                  </Option>
                )
              )}
            </Dropdown>
          );

        case "boolean":
          return (
            <Checkbox
              id={fieldId}
              label={element.label}
              disabled
              aria-label={element.label}
            />
          );

        case "date":
          return (
            <div className={styles.dateField}>
              <Input
                id={fieldId}
                placeholder=""
                readOnly
                aria-label={element.label}
                style={{ paddingRight: "32px" }}
              />
              <CalendarLtr24Regular className={styles.dateCalendarIcon} />
            </div>
          );

        case "number":
        case "currency":
          return (
            <Input
              id={fieldId}
              placeholder=""
              readOnly
              type="text"
              aria-label={element.label}
              contentBefore={fieldType === "currency" ? <Text size={200}>$</Text> : undefined}
            />
          );

        case "text":
        default:
          return (
            <Input
              id={fieldId}
              placeholder=""
              readOnly
              aria-label={element.label}
            />
          );
      }
    },
    [styles]
  );

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      data-element-id="quick-create-backdrop"
      onClick={(e) => {
        // Close on backdrop click (not on dialog body click)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick Create: ${displayName}`}
        data-element-id="quick-create-dialog"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={styles.header} data-element-id="quick-create-header">
          <div className={styles.headerTitle}>
            <div className={styles.headerEntityBadge}>{entityInitial}</div>
            <div>
              <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                Quick Create
              </Text>
              <Text size={400} weight="semibold" block>
                {displayName}
              </Text>
            </div>
          </div>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={onClose}
            aria-label="Close Quick Create form"
            data-element-id="quick-create-close-btn"
          />
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className={styles.body} data-element-id="quick-create-body">
          {/* Sections with grouped fields */}
          {sections.map(({ section, fields }) => (
            <div
              key={section.element_id}
              className={styles.section}
              data-element-id={section.element_id}
            >
              {section.label && (
                <div className={styles.sectionLabel}>
                  <Text size={300} weight="semibold">
                    {section.label}
                  </Text>
                </div>
              )}
              {fields.map(renderField)}
            </div>
          ))}

          {/* Unsectioned fields */}
          {unsectionedFields.length > 0 && (
            <div className={styles.section}>
              {sections.length > 0 && (
                <div className={styles.sectionLabel}>
                  <Text size={300} weight="semibold">
                    General
                  </Text>
                </div>
              )}
              {unsectionedFields.map(renderField)}
            </div>
          )}

          {/* Empty state when no fields found */}
          {sections.length === 0 && unsectionedFields.length === 0 && (
            <div style={{ textAlign: "center", padding: tokens.spacingVerticalXXL }}>
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                No fields defined for this Quick Create form.
              </Text>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className={styles.footer} data-element-id="quick-create-footer">
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            data-element-id="quick-create-save-close-btn"
            disabled
          >
            Save and Close
          </Button>
          <Button
            appearance="outline"
            data-element-id="quick-create-save-new-btn"
            disabled
          >
            Save &amp; Create New
          </Button>
          <Button
            appearance="subtle"
            onClick={onClose}
            data-element-id="quick-create-cancel-btn"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
