"use client";

import {
  Tooltip,
  makeStyles,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import {
  Save20Regular,
  SaveArrowRight20Regular,
  Add20Regular,
  Delete20Regular,
  Edit20Regular,
  ArrowSync20Regular,
  ArrowDownload20Regular,
  PersonSwap20Regular,
  ToggleLeft20Regular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import type { ReactElement } from "react";

// ── Constants ──────────────────────────────────────────────────────────

const COMMAND_BAR_HEIGHT = 40;

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  bar: {
    display: "flex",
    alignItems: "center",
    height: `${COMMAND_BAR_HEIGHT}px`,
    minHeight: `${COMMAND_BAR_HEIGHT}px`,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #edebe9",
    ...shorthands.padding("0", "8px"),
    gap: "2px",
    overflowX: "auto",
    overflowY: "hidden",
    flexShrink: 0,
  },
  commandBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "32px",
    ...shorthands.padding("0", "10px"),
    borderRadius: "2px",
    border: "none",
    backgroundColor: "transparent",
    color: "#323130",
    fontSize: "13px",
    cursor: "default",
    whiteSpace: "nowrap",
    flexShrink: 0,
    ":hover": {
      backgroundColor: "#f3f2f1",
    },
  },
  commandBtnPrimary: {
    color: "#0078d4",
    fontWeight: 600,
  },
  commandIcon: {
    flexShrink: 0,
    fontSize: "16px",
    width: "16px",
    height: "16px",
  },
  separator: {
    width: "1px",
    height: "20px",
    backgroundColor: "#e1dfdd",
    marginLeft: "4px",
    marginRight: "4px",
    flexShrink: 0,
  },
  spacer: {
    flex: 1,
  },
  overflow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "2px",
    border: "none",
    backgroundColor: "transparent",
    color: "#605e5c",
    cursor: "default",
    flexShrink: 0,
    ":hover": {
      backgroundColor: "#f3f2f1",
    },
  },
});

// ── Action to Icon mapping ─────────────────────────────────────────────

const ACTION_ICON_MAP: Record<string, ReactElement> = {
  Save: <Save20Regular />,
  "Save & Close": <SaveArrowRight20Regular />,
  "Save and Close": <SaveArrowRight20Regular />,
  "Save and New": <Save20Regular />,
  New: <Add20Regular />,
  Delete: <Delete20Regular />,
  Edit: <Edit20Regular />,
  Refresh: <ArrowSync20Regular />,
  "Export to Excel": <ArrowDownload20Regular />,
  Assign: <PersonSwap20Regular />,
  Deactivate: <ToggleLeft20Regular />,
  "Quick Create": <Add20Regular />,
};

/** Actions that appear with primary (brand) styling. */
const PRIMARY_ACTIONS = new Set(["Save", "New"]);

// ── Component ──────────────────────────────────────────────────────────

interface D365CommandBarProps {
  /** List of action label strings for the current entity/screen context. */
  actions: string[];
  /** Called when a command button is clicked. */
  onAction?: (action: string) => void;
}

/**
 * D365 command bar with placeholder action buttons.
 *
 * Renders the familiar Dynamics 365 ribbon/command bar at the top of
 * the content area. Actions are driven by the `command_bar_actions` data
 * from the pipeline, with fallback icons and styling. All buttons are
 * placeholder — they emit an onAction callback but perform no real work.
 */
export function D365CommandBar({ actions, onAction }: D365CommandBarProps) {
  const styles = useStyles();

  if (actions.length === 0) {
    return null;
  }

  // Split primary actions (first 3-4) from overflow
  const visibleActions = actions.slice(0, 6);
  const overflowCount = actions.length - visibleActions.length;

  return (
    <div
      className={styles.bar}
      data-element-id="d365-command-bar"
      role="toolbar"
      aria-label="Command bar"
    >
      {visibleActions.map((action, idx) => {
        const icon = ACTION_ICON_MAP[action];
        const isPrimary = PRIMARY_ACTIONS.has(action);
        return (
          <Tooltip key={action} content={action} relationship="label">
            <button
              className={mergeClasses(
                styles.commandBtn,
                isPrimary && styles.commandBtnPrimary
              )}
              onClick={() => onAction?.(action)}
              data-element-id={`d365-cmd-${action.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {icon && <span className={styles.commandIcon}>{icon}</span>}
              {action}
            </button>
          </Tooltip>
        );
      })}

      {overflowCount > 0 && (
        <>
          <div className={styles.separator} />
          <Tooltip
            content={`${overflowCount} more actions`}
            relationship="label"
          >
            <button className={styles.overflow} aria-label="More commands">
              <MoreHorizontal20Regular />
            </button>
          </Tooltip>
        </>
      )}

      <div className={styles.spacer} />
    </div>
  );
}

export { COMMAND_BAR_HEIGHT };
