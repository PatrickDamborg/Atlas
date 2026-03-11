"use client";

/**
 * D365CommandBar — Mimics the Dynamics 365 command bar at the top of a form.
 *
 * Renders action buttons (Save, Save & Close, New, Delete, etc.) styled to
 * resemble the real D365 ribbon/command bar. Each button carries a
 * `data-element-id` attribute for CoachMark targeting.
 */

import {
  Button,
  Text,
  Divider,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Save24Regular,
  Add24Regular,
  Delete24Regular,
  ArrowSync24Regular,
  ArrowDownload24Regular,
  Dismiss24Regular,
  PersonSwap24Regular,
  MoreHorizontal24Regular,
  SaveArrowRight24Regular,
  AddSquare24Regular,
} from "@fluentui/react-icons";
import type { ScreenElement } from "@/types/trainingTrack";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "4px 12px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "40px",
    flexShrink: 0,
    overflowX: "auto",
    overflowY: "hidden",
  },
  actionButton: {
    minWidth: "auto",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    padding: "4px 8px",
    height: "32px",
    whiteSpace: "nowrap",
    borderRadius: tokens.borderRadiusSmall,
    color: tokens.colorNeutralForeground1,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  primaryAction: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  highlighted: {
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  separator: {
    height: "20px",
    marginLeft: "4px",
    marginRight: "4px",
  },
  overflow: {
    marginLeft: "auto",
  },
});

// ── Icon mapping ──────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  "Save": <Save24Regular />,
  "Save & Close": <SaveArrowRight24Regular />,
  "Save and Close": <SaveArrowRight24Regular />,
  "Save and New": <Save24Regular />,
  "+ New": <Add24Regular />,
  "New": <Add24Regular />,
  "Delete": <Delete24Regular />,
  "Refresh": <ArrowSync24Regular />,
  "Export to Excel": <ArrowDownload24Regular />,
  "Deactivate": <Dismiss24Regular />,
  "Assign": <PersonSwap24Regular />,
  "Quick Create": <AddSquare24Regular />,
};

const PRIMARY_ACTIONS = new Set([
  "Save",
  "Save & Close",
  "Save and Close",
  "+ New",
  "New",
]);

// ── Component ─────────────────────────────────────────────────────────

export interface D365CommandBarProps {
  /** List of command action labels */
  actions: string[];
  /** Command button elements from the screen (for data-element-id) */
  commandElements?: ScreenElement[];
  /** Currently highlighted element ID */
  highlightedElementId?: string | null;
  /** Callback when an element is clicked */
  onElementClick?: (elementId: string) => void;
  /** Whether this is a quick create form (compact command bar) */
  isQuickCreate?: boolean;
}

export function D365CommandBar({
  actions,
  commandElements = [],
  highlightedElementId,
  onElementClick,
  isQuickCreate = false,
}: D365CommandBarProps) {
  const styles = useStyles();

  // Map action labels to their element IDs for data-element-id
  const actionToElementId = new Map<string, string>();
  for (const el of commandElements) {
    actionToElementId.set(el.label, el.element_id);
  }

  // Show max actions, rest overflow
  const visibleActions = isQuickCreate ? actions : actions.slice(0, 7);
  const hasOverflow = !isQuickCreate && actions.length > 7;

  return (
    <div className={styles.root}>
      {visibleActions.map((action, idx) => {
        const elementId = actionToElementId.get(action) ?? `cmd_${action.toLowerCase().replace(/\s+/g, "_")}`;
        const isPrimary = PRIMARY_ACTIONS.has(action);
        const isHighlighted = highlightedElementId === elementId;
        const icon = ACTION_ICONS[action] ?? null;

        return (
          <span key={`${action}-${idx}`} style={{ display: "contents" }}>
            {/* Separator before Delete and Deactivate */}
            {(action === "Delete" || action === "Deactivate") && idx > 0 && (
              <Divider vertical className={styles.separator} />
            )}
            <Button
              data-element-id={elementId}
              appearance="subtle"
              size="small"
              icon={icon}
              className={mergeClasses(
                styles.actionButton,
                isPrimary && styles.primaryAction,
                isHighlighted && styles.highlighted
              )}
              onClick={() => onElementClick?.(elementId)}
            >
              {action}
            </Button>
          </span>
        );
      })}

      {hasOverflow && (
        <Button
          appearance="subtle"
          size="small"
          icon={<MoreHorizontal24Regular />}
          className={mergeClasses(styles.actionButton, styles.overflow)}
          aria-label="More actions"
        />
      )}
    </div>
  );
}
