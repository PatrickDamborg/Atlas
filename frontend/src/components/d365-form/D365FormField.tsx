"use client";

/**
 * D365FormField — Mimics a Dynamics 365 form field.
 *
 * Renders a field label and an empty input control matching the field type.
 * No sample data is shown — only the label and a type annotation.
 * Each field carries a `data-element-id` attribute for CoachMark targeting.
 *
 * Supported field types (from metadata.field_type):
 *  - text (default): Single-line text input
 *  - lookup: Lookup field with search icon
 *  - optionset / picklist: Dropdown select
 *  - datetime / date: Date picker
 *  - currency / money: Currency input with symbol
 *  - number / integer / decimal / float: Number input
 *  - boolean / two_option: Toggle switch
 *  - multiline / memo: Multi-line textarea
 *  - email: Email input
 *  - phone / telephone: Phone input
 *  - url: URL input
 */

import {
  Text,
  Input,
  Textarea,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Search24Regular,
  CalendarLtr24Regular,
  ChevronDown24Regular,
  CurrencyDollarEuro24Regular,
  ToggleLeft24Regular,
  Link24Regular,
  Mail24Regular,
  Phone24Regular,
  NumberSymbol24Regular,
  LockClosed24Regular,
} from "@fluentui/react-icons";
import type { ScreenElement } from "@/types/trainingTrack";
import { MarkdownFieldAnnotation } from "./MarkdownFieldAnnotation";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  label: {
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.3",
  },
  required: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  fieldContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    minHeight: "30px",
  },
  textarea: {
    width: "100%",
    minHeight: "60px",
  },
  lookupField: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    minHeight: "30px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground1,
    gap: "4px",
    cursor: "default",
  },
  lookupPlaceholder: {
    flex: 1,
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  lookupIcon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    width: "16px",
    height: "16px",
  },
  selectField: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: "30px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: "default",
  },
  selectPlaceholder: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  selectChevron: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    width: "14px",
    height: "14px",
  },
  toggleField: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "30px",
  },
  toggleTrack: {
    width: "40px",
    height: "20px",
    borderRadius: "10px",
    backgroundColor: tokens.colorNeutralBackground5,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    position: "relative",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: "2px",
    left: "2px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: tokens.colorNeutralForeground3,
  },
  typeAnnotation: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  highlighted: {
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    padding: "6px 8px",
    marginLeft: "-8px",
    marginRight: "-8px",
  },
  lockedIcon: {
    color: tokens.colorNeutralForeground4,
    width: "12px",
    height: "12px",
  },
});

// ── Field type detection ──────────────────────────────────────────────

type FieldRenderType =
  | "text"
  | "lookup"
  | "optionset"
  | "datetime"
  | "currency"
  | "number"
  | "boolean"
  | "multiline"
  | "email"
  | "phone"
  | "url";

function resolveFieldType(element: ScreenElement): FieldRenderType {
  const meta = element.metadata;
  const raw = ((meta?.field_type as string) ?? "").toLowerCase();

  if (raw === "lookup" || raw === "customer" || raw === "owner") return "lookup";
  if (raw === "optionset" || raw === "picklist" || raw === "status" || raw === "statuscode" || raw === "state") return "optionset";
  if (raw === "datetime" || raw === "date") return "datetime";
  if (raw === "currency" || raw === "money") return "currency";
  if (raw === "number" || raw === "integer" || raw === "decimal" || raw === "float" || raw === "bigint") return "number";
  if (raw === "boolean" || raw === "two_option") return "boolean";
  if (raw === "multiline" || raw === "memo") return "multiline";
  if (raw === "email") return "email";
  if (raw === "phone" || raw === "telephone") return "phone";
  if (raw === "url") return "url";

  return "text";
}

function fieldTypeLabel(type: FieldRenderType): string {
  switch (type) {
    case "lookup": return "Lookup";
    case "optionset": return "Option Set";
    case "datetime": return "Date & Time";
    case "currency": return "Currency";
    case "number": return "Number";
    case "boolean": return "Yes/No";
    case "multiline": return "Multi-line Text";
    case "email": return "Email";
    case "phone": return "Phone";
    case "url": return "URL";
    default: return "Text";
  }
}

// ── Component ─────────────────────────────────────────────────────────

export interface D365FormFieldProps {
  element: ScreenElement;
  isHighlighted?: boolean;
  onElementClick?: (elementId: string) => void;
  /** Markdown annotation text to display below the field (from walkthrough step) */
  annotationMarkdown?: string | null;
}

export function D365FormField({
  element,
  isHighlighted = false,
  onElementClick,
  annotationMarkdown,
}: D365FormFieldProps) {
  const styles = useStyles();
  const fieldType = resolveFieldType(element);
  const isRequired = !!element.metadata?.is_required;
  const isReadOnly = !!element.metadata?.is_read_only;
  const label = element.label || element.field_logical_name || "Field";

  return (
    <div
      data-element-id={element.element_id}
      className={mergeClasses(
        styles.root,
        isHighlighted && styles.highlighted
      )}
      onClick={(e) => {
        e.stopPropagation();
        onElementClick?.(element.element_id);
      }}
      style={{ cursor: onElementClick ? "pointer" : "default" }}
    >
      {/* Label row */}
      <div className={styles.labelRow}>
        <Text size={200} className={styles.label}>
          {label}
        </Text>
        {isRequired && (
          <Text size={100} className={styles.required}>
            *
          </Text>
        )}
        {isReadOnly && (
          <LockClosed24Regular className={styles.lockedIcon} />
        )}
      </div>

      {/* Field input — empty, no sample data */}
      <div className={styles.fieldContainer}>
        {fieldType === "text" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            aria-label={label}
          />
        )}

        {fieldType === "email" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            contentAfter={<Mail24Regular style={{ width: "14px", height: "14px", color: tokens.colorNeutralForeground3 }} />}
            aria-label={label}
          />
        )}

        {fieldType === "phone" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            contentAfter={<Phone24Regular style={{ width: "14px", height: "14px", color: tokens.colorNeutralForeground3 }} />}
            aria-label={label}
          />
        )}

        {fieldType === "url" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            contentAfter={<Link24Regular style={{ width: "14px", height: "14px", color: tokens.colorNeutralForeground3 }} />}
            aria-label={label}
          />
        )}

        {fieldType === "number" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            contentAfter={<NumberSymbol24Regular style={{ width: "14px", height: "14px", color: tokens.colorNeutralForeground3 }} />}
            aria-label={label}
          />
        )}

        {fieldType === "currency" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            contentBefore={
              <CurrencyDollarEuro24Regular style={{ width: "14px", height: "14px", color: tokens.colorNeutralForeground3 }} />
            }
            aria-label={label}
          />
        )}

        {fieldType === "datetime" && (
          <Input
            className={styles.input}
            size="small"
            readOnly
            tabIndex={-1}
            contentAfter={<CalendarLtr24Regular style={{ width: "14px", height: "14px", color: tokens.colorNeutralForeground3 }} />}
            aria-label={label}
          />
        )}

        {fieldType === "lookup" && (
          <div className={styles.lookupField}>
            <Text size={200} className={styles.lookupPlaceholder}>
              &mdash;
            </Text>
            <Search24Regular className={styles.lookupIcon} />
          </div>
        )}

        {fieldType === "optionset" && (
          <div className={styles.selectField}>
            <Text size={200} className={styles.selectPlaceholder}>
              &mdash;
            </Text>
            <ChevronDown24Regular className={styles.selectChevron} />
          </div>
        )}

        {fieldType === "boolean" && (
          <div className={styles.toggleField}>
            <div className={styles.toggleTrack}>
              <div className={styles.toggleThumb} />
            </div>
            <Text size={200} className={styles.typeAnnotation}>
              No
            </Text>
          </div>
        )}

        {fieldType === "multiline" && (
          <Textarea
            className={styles.textarea}
            size="small"
            readOnly
            tabIndex={-1}
            resize="vertical"
            aria-label={label}
          />
        )}
      </div>

      {/* Field type annotation */}
      <Text size={100} className={styles.typeAnnotation}>
        {fieldTypeLabel(fieldType)}
        {isRequired ? " — Required" : ""}
      </Text>

      {/* Markdown annotation from walkthrough step */}
      {annotationMarkdown && (
        <MarkdownFieldAnnotation content={annotationMarkdown} />
      )}
    </div>
  );
}
