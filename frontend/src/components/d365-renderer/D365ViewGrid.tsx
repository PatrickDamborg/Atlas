"use client";

import { useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Text,
  Badge,
  Checkbox,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Delete24Regular,
  Edit24Regular,
  ArrowClockwise24Regular,
  Filter24Regular,
  Search24Regular,
  MoreHorizontal24Regular,
  ChevronDown16Regular,
  TextSortAscending24Regular,
  Info24Regular,
  Lightbulb24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import type {
  ScreenLayout,
  ScreenElement,
  StepLayout,
  TrainingAnnotation,
} from "@/types/trainingTrack";

// ── Constants ────────────────────────────────────────────────────────────

/** Number of empty placeholder rows to render in the grid */
const PLACEHOLDER_ROW_COUNT = 8;

/** D365-style column widths based on element type/metadata */
const DEFAULT_COLUMN_WIDTH = "180px";
const NARROW_COLUMN_WIDTH = "120px";
const WIDE_COLUMN_WIDTH = "260px";

// ── Styles ───────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  /** Outer container mimicking D365 view page structure */
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: "hidden",
  },

  /** D365-style command bar above the grid */
  commandBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "44px",
  },
  commandBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  commandBarRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },

  /** View title header row (entity display name + view name) */
  viewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  viewTitleSection: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  viewSwitcher: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    cursor: "default",
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },

  /** Search/filter bar below the command bar */
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: "220px",
    height: "28px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    flex: 1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  /** Grid / table container */
  gridContainer: {
    flex: 1,
    overflowX: "auto",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    minWidth: "100%",
    borderCollapse: "collapse",
  },

  /** D365-like header cell styling */
  headerCell: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    whiteSpace: "nowrap",
    userSelect: "none",
    cursor: "default",
    position: "relative",
  },
  headerCellContent: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
  },

  /** D365-like data row styling */
  dataRow: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dataCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    verticalAlign: "middle",
    height: "36px",
  },
  /** Placeholder content in empty cells (dash or empty) */
  placeholderCell: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  /** First column typically is a link in D365 (primary name field) */
  primaryLinkCell: {
    color: tokens.colorBrandForeground1,
    cursor: "default",
  },

  /** Selection checkbox column */
  checkboxCell: {
    width: "32px",
    minWidth: "32px",
    maxWidth: "32px",
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    verticalAlign: "middle",
  },

  /** Record count footer */
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "32px",
  },

  /** Highlight wrapper for elements targeted by coach marks */
  highlightTarget: {
    position: "relative",
  },

  /** When a specific element is the active target in a walkthrough step */
  activeTarget: {
    outline: `2px solid ${tokens.colorBrandBackground}`,
    outlineOffset: "2px",
    borderRadius: tokens.borderRadiusSmall,
  },

  /** Column type badge shown in header cells */
  columnTypeBadge: {
    marginLeft: tokens.spacingHorizontalXXS,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightRegular,
    opacity: 0.8,
  },

  // ── Inline Annotation Panel ───────────────────────────────────────

  /** Annotation banner shown below the command bar for the active step */
  annotationBanner: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorBrandBackground2,
    borderBottom: `2px solid ${tokens.colorBrandBackground}`,
    borderLeft: `4px solid ${tokens.colorBrandBackground}`,
  },

  annotationHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },

  annotationBody: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },

  /** Markdown content within the annotation panel */
  annotationMarkdown: {
    lineHeight: "1.5",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    "& p": {
      marginTop: 0,
      marginBottom: tokens.spacingVerticalXS,
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
      backgroundColor: tokens.colorNeutralBackground3,
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

  /** Detail text section within annotation */
  annotationDetail: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },

  annotationDetailHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },

  /** Tips list within annotation */
  annotationTips: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    marginTop: tokens.spacingVerticalXS,
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
    marginTop: "2px",
    flexShrink: 0,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Derive column definitions from screen elements.
 * In D365, view columns are the fields configured for display.
 * We look for elements with element_type "column", "field", or "view_column".
 */
function deriveColumns(elements: ScreenElement[]): ScreenElement[] {
  // Filter for column/field type elements that represent grid columns
  const columnTypes = new Set([
    "column",
    "view_column",
    "field",
    "grid_column",
    "attribute",
  ]);

  const columns = elements.filter(
    (el) =>
      columnTypes.has(el.element_type) ||
      // Fallback: include all non-structural elements as columns
      (!["section", "tab", "button", "command", "nav", "header", "footer", "form"].includes(
        el.element_type
      ) &&
        el.label)
  );

  // If we still have no columns, use all labeled elements
  if (columns.length === 0) {
    return elements.filter((el) => el.label);
  }

  return columns;
}

/**
 * Determine column width based on element metadata or type.
 */
function getColumnWidth(element: ScreenElement): string {
  // Check metadata for explicit width
  if (element.metadata?.width) {
    return `${element.metadata.width}px`;
  }

  // Field-type heuristics for D365-like widths
  const fieldType = (element.metadata?.field_type as string) ?? "";
  const logicalName = element.field_logical_name ?? "";

  if (
    fieldType === "datetime" ||
    fieldType === "date" ||
    logicalName.includes("date")
  ) {
    return NARROW_COLUMN_WIDTH;
  }
  if (
    fieldType === "memo" ||
    fieldType === "text" ||
    logicalName.includes("description") ||
    logicalName.includes("name")
  ) {
    return WIDE_COLUMN_WIDTH;
  }
  if (
    fieldType === "status" ||
    fieldType === "optionset" ||
    fieldType === "boolean"
  ) {
    return NARROW_COLUMN_WIDTH;
  }

  return DEFAULT_COLUMN_WIDTH;
}

/**
 * Produce placeholder cell content appropriate for the column type.
 * Per constraints: no sample data, only empty fields.
 */
function getPlaceholderContent(): string {
  // Return empty dash for all rows — no sample data per constraints
  return "\u2014"; // em-dash
}

/**
 * Map element metadata field_type to a short display label for the column
 * type badge shown in the header. Returns null if no recognisable type.
 */
function getColumnTypeLabel(element: ScreenElement): string | null {
  const fieldType = (element.metadata?.field_type as string) ?? "";
  const typeMap: Record<string, string> = {
    text: "Text",
    nvarchar: "Text",
    string: "Text",
    memo: "Multiline",
    int: "Number",
    integer: "Number",
    decimal: "Decimal",
    float: "Float",
    money: "Currency",
    currency: "Currency",
    datetime: "Date/Time",
    date: "Date",
    boolean: "Yes/No",
    bit: "Yes/No",
    optionset: "Choice",
    picklist: "Choice",
    status: "Status",
    state: "State",
    lookup: "Lookup",
    customer: "Customer",
    owner: "Owner",
    uniqueidentifier: "ID",
    image: "Image",
    file: "File",
  };
  return typeMap[fieldType.toLowerCase()] ?? null;
}

// ── Types ────────────────────────────────────────────────────────────────

export interface D365ViewGridProps {
  /** The screen layout describing this view */
  screen: ScreenLayout;
  /** Currently active step layout (for highlighting the target element) */
  activeStepLayout?: StepLayout | null;
  /** Current annotation to show context */
  activeAnnotation?: TrainingAnnotation | null;
  /** The element ID currently being highlighted by coach mark */
  highlightedElementId?: string | null;
  /** Optional class name */
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * D365ViewGrid renders a Dynamics 365-style entity view/grid.
 *
 * It renders:
 * - A command bar with New, Edit, Delete, Refresh actions (D365-like)
 * - A search/filter bar
 * - A Table with column headers derived from entity metadata (ScreenElements)
 * - Empty placeholder rows mimicking a D365 records list
 * - A record count footer
 *
 * Each column header and the grid itself carry `data-element-id` attributes
 * so the CoachMarkOverlay can target them for walkthrough annotations.
 */
export function D365ViewGrid({
  screen,
  activeStepLayout,
  activeAnnotation,
  highlightedElementId,
  className,
}: D365ViewGridProps) {
  const styles = useStyles();

  // Derive columns from screen elements
  const columns = useMemo(
    () => deriveColumns(screen.elements),
    [screen.elements]
  );

  // Build stable row keys
  const placeholderRows = useMemo(
    () =>
      Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, i) => ({
        id: `placeholder-row-${i}`,
        index: i,
      })),
    []
  );

  // Check if a specific element is the active coach mark target
  const isHighlighted = useCallback(
    (elementId: string) => {
      return (
        highlightedElementId === elementId ||
        activeStepLayout?.target_element_id === elementId
      );
    },
    [highlightedElementId, activeStepLayout]
  );

  const entityDisplayName = screen.entity_display_name || screen.title || "Records";
  const viewName = screen.view_name || "All Records";

  return (
    <div
      className={mergeClasses(styles.root, className)}
      data-element-id={`view-grid-${screen.screen_id}`}
    >
      {/* ── View Header (Entity name + View selector) ──────────── */}
      <div className={styles.viewHeader} data-element-id={`view-header-${screen.screen_id}`}>
        <div className={styles.viewTitleSection}>
          <Text size={500} weight="semibold">
            {entityDisplayName}
          </Text>
          <div
            className={styles.viewSwitcher}
            data-element-id={`view-switcher-${screen.screen_id}`}
          >
            <Text size={300} weight="regular" style={{ color: tokens.colorNeutralForeground2 }}>
              {viewName}
            </Text>
            <ChevronDown16Regular
              style={{
                fontSize: "12px",
                color: tokens.colorNeutralForeground3,
              }}
            />
          </div>
        </div>
        <Badge
          appearance="tint"
          color="informative"
          size="small"
        >
          {screen.entity_logical_name}
        </Badge>
      </div>

      {/* ── Command Bar ────────────────────────────────────────── */}
      <div className={styles.commandBar} data-element-id={`command-bar-${screen.screen_id}`}>
        <div className={styles.commandBarLeft}>
          <Toolbar size="small">
            <ToolbarButton
              icon={<Add24Regular />}
              data-element-id={`cmd-new-${screen.entity_logical_name}`}
            >
              New
            </ToolbarButton>
            <ToolbarButton
              icon={<Edit24Regular />}
              data-element-id={`cmd-edit-${screen.entity_logical_name}`}
              disabled
            >
              Edit
            </ToolbarButton>
            <ToolbarButton
              icon={<Delete24Regular />}
              data-element-id={`cmd-delete-${screen.entity_logical_name}`}
              disabled
            >
              Delete
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              icon={<ArrowClockwise24Regular />}
              data-element-id={`cmd-refresh-${screen.entity_logical_name}`}
            >
              Refresh
            </ToolbarButton>
          </Toolbar>
        </div>
        <div className={styles.commandBarRight}>
          <ToolbarButton
            icon={<Filter24Regular />}
            data-element-id={`cmd-filter-${screen.entity_logical_name}`}
          >
            Edit filters
          </ToolbarButton>
          <ToolbarButton
            icon={<MoreHorizontal24Regular />}
            data-element-id={`cmd-more-${screen.entity_logical_name}`}
            aria-label="More commands"
          />
        </div>
      </div>

      {/* ── Search / Filter Bar ────────────────────────────────── */}
      <div className={styles.filterBar} data-element-id={`filter-bar-${screen.screen_id}`}>
        <div className={styles.searchBox}>
          <Search24Regular
            style={{
              fontSize: "14px",
              color: tokens.colorNeutralForeground3,
              flexShrink: 0,
            }}
          />
          <input
            className={styles.searchInput}
            placeholder={`Search ${entityDisplayName}...`}
            readOnly
            tabIndex={-1}
          />
        </div>
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
          <TextSortAscending24Regular
            style={{
              fontSize: "14px",
              verticalAlign: "middle",
              marginRight: "4px",
            }}
          />
          Sort by: {columns[0]?.label ?? "Name"}
        </Text>
      </div>

      {/* ── Inline Annotation Panel (one per view step) ─────────── */}
      {activeAnnotation && (
        <div
          className={styles.annotationBanner}
          data-element-id={`annotation-banner-${screen.screen_id}`}
          role="complementary"
          aria-label={`Walkthrough step: ${activeAnnotation.title}`}
        >
          <div className={styles.annotationHeader}>
            <Badge appearance="filled" color="brand" size="medium">
              Step
            </Badge>
            <Text size={400} weight="semibold">
              {activeAnnotation.title}
            </Text>
            {activeAnnotation.tooltip_text && (
              <Badge appearance="tint" color="informative" size="small">
                {activeAnnotation.tooltip_text}
              </Badge>
            )}
          </div>

          <div className={styles.annotationBody}>
            {/* Instruction rendered as Markdown */}
            {activeAnnotation.instruction && (
              <div className={styles.annotationMarkdown}>
                <ReactMarkdown>{activeAnnotation.instruction}</ReactMarkdown>
              </div>
            )}

            {/* Detail section */}
            {activeAnnotation.detail_text && (
              <div className={styles.annotationDetail}>
                <div className={styles.annotationDetailHeader}>
                  <Info24Regular style={{ fontSize: "14px" }} />
                  <Text size={200} weight="semibold">
                    More Detail
                  </Text>
                </div>
                <div className={styles.annotationMarkdown}>
                  <ReactMarkdown>{activeAnnotation.detail_text}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Tips */}
            {activeAnnotation.tips && activeAnnotation.tips.length > 0 && (
              <div className={styles.annotationTips}>
                {activeAnnotation.tips.map((tip, idx) => (
                  <div key={idx} className={styles.annotationTipItem}>
                    <Lightbulb24Regular
                      className={styles.annotationTipIcon}
                      style={{ fontSize: "14px", width: "14px", height: "14px" }}
                    />
                    <Text size={200}>{tip}</Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Data Grid (Fluent UI Table) ────────────────────────── */}
      <div className={styles.gridContainer}>
        <Table
          className={styles.table}
          size="small"
          aria-label={`${entityDisplayName} — ${viewName}`}
          data-element-id={`grid-table-${screen.screen_id}`}
        >
          {/* Column Headers */}
          <TableHeader>
            <TableRow>
              {/* Selection checkbox column */}
              <TableHeaderCell className={styles.checkboxCell}>
                <Checkbox size="medium" disabled aria-label="Select all" />
              </TableHeaderCell>

              {/* Data columns derived from entity metadata */}
              {columns.map((col, colIndex) => {
                const typeLabel = getColumnTypeLabel(col);
                return (
                  <TableHeaderCell
                    key={col.element_id}
                    className={mergeClasses(
                      styles.headerCell,
                      isHighlighted(col.element_id) ? styles.activeTarget : undefined
                    )}
                    style={{ minWidth: getColumnWidth(col) }}
                    data-element-id={col.element_id}
                    aria-label={`Column: ${col.label}${typeLabel ? ` (${typeLabel})` : ""}`}
                  >
                    <div className={styles.headerCellContent}>
                      <Text size={200} weight="semibold">
                        {col.label}
                      </Text>
                      {/* Column type indicator from metadata */}
                      {typeLabel && (
                        <Badge
                          className={styles.columnTypeBadge}
                          appearance="tint"
                          color="subtle"
                          size="small"
                        >
                          {typeLabel}
                        </Badge>
                      )}
                      {/* Sort indicator on first column */}
                      {colIndex === 0 && (
                        <ChevronDown16Regular
                          style={{
                            fontSize: "10px",
                            color: tokens.colorNeutralForeground4,
                          }}
                        />
                      )}
                    </div>
                  </TableHeaderCell>
                );
              })}
            </TableRow>
          </TableHeader>

          {/* Data Rows (empty placeholders per constraints) */}
          <TableBody>
            {placeholderRows.map((row) => (
              <TableRow
                key={row.id}
                className={styles.dataRow}
                data-element-id={`row-${screen.entity_logical_name}-${row.index}`}
              >
                {/* Selection checkbox */}
                <TableCell className={styles.checkboxCell}>
                  <Checkbox size="medium" disabled aria-label={`Select row ${row.index + 1}`} />
                </TableCell>

                {/* Data cells */}
                {columns.map((col, colIndex) => (
                  <TableCell
                    key={col.element_id}
                    className={mergeClasses(
                      styles.dataCell,
                      isHighlighted(col.element_id) ? styles.activeTarget : undefined
                    )}
                    data-element-id={`cell-${col.element_id}-${row.index}`}
                  >
                    <TableCellLayout>
                      <Text
                        size={200}
                        className={mergeClasses(
                          styles.placeholderCell,
                          colIndex === 0 ? styles.primaryLinkCell : undefined
                        )}
                      >
                        {getPlaceholderContent()}
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer (Record count) ──────────────────────────────── */}
      <div className={styles.footer} data-element-id={`grid-footer-${screen.screen_id}`}>
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
          0 records
        </Text>
        <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
          {entityDisplayName} &middot; {viewName}
        </Text>
      </div>
    </div>
  );
}
