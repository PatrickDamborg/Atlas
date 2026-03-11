"use client";

/**
 * D365FormTabs — Mimics the Dynamics 365 form tab strip.
 *
 * Renders a horizontal tab bar matching the D365 model-driven app
 * form tab styling. Each tab carries a `data-element-id` for
 * CoachMark targeting.
 */

import {
  Text,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "stretch",
    gap: 0,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
    overflowX: "auto",
    overflowY: "hidden",
    paddingLeft: "24px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    color: tokens.colorNeutralForeground2,
    whiteSpace: "nowrap",
    userSelect: "none",
    transitionProperty: "color, border-color, background-color",
    transitionDuration: "150ms",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  tabActive: {
    borderBottomColor: tokens.colorBrandStroke1,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  tabHighlighted: {
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
    borderRadius: `${tokens.borderRadiusSmall} ${tokens.borderRadiusSmall} 0 0`,
    backgroundColor: tokens.colorBrandBackground2,
  },
});

// ── Types ─────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  elementId: string;
}

export interface D365FormTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabLabel: string) => void;
  highlightedElementId?: string | null;
  onElementClick?: (elementId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

export function D365FormTabs({
  tabs,
  activeTab,
  onTabChange,
  highlightedElementId,
  onElementClick,
}: D365FormTabsProps) {
  const styles = useStyles();

  return (
    <div className={styles.root} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.label === activeTab;
        const isHighlighted = highlightedElementId === tab.elementId;

        return (
          <div
            key={tab.id}
            role="tab"
            data-element-id={tab.elementId}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={mergeClasses(
              styles.tab,
              isActive && styles.tabActive,
              isHighlighted && styles.tabHighlighted
            )}
            onClick={() => {
              onTabChange(tab.label);
              onElementClick?.(tab.elementId);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTabChange(tab.label);
                onElementClick?.(tab.elementId);
              }
            }}
          >
            <Text size={300}>{tab.label}</Text>
          </div>
        );
      })}
    </div>
  );
}
