"use client";

import { useState, useCallback } from "react";
import {
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import {
  ChevronLeft20Regular,
  ChevronRight20Regular,
  ChevronDown12Regular,
  ChevronRight12Regular,
  Home20Regular,
  Clock20Regular,
  Table20Regular,
} from "@fluentui/react-icons";
import type { SitemapStructure, SitemapItem, SitemapGroup } from "./types";

// ── Constants ──────────────────────────────────────────────────────────

const NAV_EXPANDED_WIDTH = 220;
const NAV_COLLAPSED_WIDTH = 48;

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  nav: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f3f2f1",
    borderRight: "1px solid #e1dfdd",
    overflowY: "auto",
    overflowX: "hidden",
    transitionProperty: "width",
    transitionDuration: "200ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    flexShrink: 0,
    userSelect: "none",
  },
  navExpanded: {
    width: `${NAV_EXPANDED_WIDTH}px`,
  },
  navCollapsed: {
    width: `${NAV_COLLAPSED_WIDTH}px`,
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "44px",
    minHeight: "44px",
    cursor: "pointer",
    color: "#323130",
    backgroundColor: "transparent",
    border: "none",
    ...shorthands.padding("0"),
    width: "100%",
    ":hover": {
      backgroundColor: "#e1dfdd",
    },
  },
  toggleBtnExpanded: {
    justifyContent: "flex-end",
    paddingRight: "12px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    ...shorthands.padding("6px", "12px"),
    cursor: "pointer",
    gap: "6px",
    ":hover": {
      backgroundColor: "#e1dfdd",
    },
  },
  sectionHeaderCollapsed: {
    justifyContent: "center",
    ...shorthands.padding("6px", "0"),
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#605e5c",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    height: "36px",
    ...shorthands.padding("0", "12px"),
    gap: "10px",
    cursor: "pointer",
    color: "#323130",
    textDecorationLine: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ":hover": {
      backgroundColor: "#e1dfdd",
    },
  },
  navItemCollapsed: {
    justifyContent: "center",
    ...shorthands.padding("0"),
  },
  navItemActive: {
    backgroundColor: "#deecf9",
    borderLeft: "3px solid #0078d4",
    paddingLeft: "9px",
    fontWeight: 600,
    ":hover": {
      backgroundColor: "#c7e0f4",
    },
  },
  navItemActiveCollapsed: {
    borderLeft: "3px solid #0078d4",
    paddingLeft: "0",
  },
  navItemIcon: {
    flexShrink: 0,
    color: "#605e5c",
    fontSize: "16px",
    width: "16px",
    height: "16px",
  },
  navItemLabel: {
    fontSize: "13px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pinnedSection: {
    borderBottom: "1px solid #e1dfdd",
    marginBottom: "4px",
    paddingBottom: "4px",
  },
  groupDivider: {
    height: "1px",
    backgroundColor: "#e1dfdd",
    marginTop: "4px",
    marginBottom: "4px",
    marginLeft: "12px",
    marginRight: "12px",
  },
});

// ── Component ──────────────────────────────────────────────────────────

interface D365SitemapNavProps {
  /** Sitemap structure from the UX Expert agent pipeline output. */
  sitemapStructure: SitemapStructure;
  /** Currently selected entity logical name. */
  activeEntity?: string | null;
  /** Called when a sitemap item is clicked. */
  onEntitySelect?: (entityLogicalName: string, displayName: string) => void;
  /** Initial collapsed state. */
  defaultCollapsed?: boolean;
}

/**
 * D365 collapsible left sitemap navigation panel.
 *
 * Renders the model-driven app navigation in the familiar D365 style
 * with area/group/item hierarchy. The panel can be collapsed to icon-only
 * width using the chevron toggle, matching D365 behaviour.
 */
export function D365SitemapNav({
  sitemapStructure,
  activeEntity,
  onEntitySelect,
  defaultCollapsed = false,
}: D365SitemapNavProps) {
  const styles = useStyles();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(
      sitemapStructure.areas.flatMap((a) => a.groups.map((g) => g.id))
    )
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleItemClick = useCallback(
    (item: SitemapItem) => {
      onEntitySelect?.(item.entity_logical_name, item.display_name);
    },
    [onEntitySelect]
  );

  const areas = sitemapStructure.areas ?? [];

  return (
    <nav
      className={mergeClasses(
        styles.nav,
        collapsed ? styles.navCollapsed : styles.navExpanded
      )}
      data-element-id="d365-sitemap-nav"
      aria-label="Site map navigation"
    >
      {/* Collapse / expand toggle */}
      <button
        className={mergeClasses(
          styles.toggleBtn,
          !collapsed && styles.toggleBtnExpanded
        )}
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
      >
        {collapsed ? <ChevronRight20Regular /> : <ChevronLeft20Regular />}
      </button>

      {/* Pinned section: Home + Recent */}
      <div className={styles.pinnedSection}>
        <Tooltip
          content="Home"
          relationship="label"
          positioning="after"
          visible={collapsed ? undefined : false}
        >
          <div
            className={mergeClasses(
              styles.navItem,
              collapsed && styles.navItemCollapsed
            )}
            data-element-id="d365-nav-home"
          >
            <Home20Regular className={styles.navItemIcon} />
            {!collapsed && (
              <span className={styles.navItemLabel}>Home</span>
            )}
          </div>
        </Tooltip>
        <Tooltip
          content="Recent"
          relationship="label"
          positioning="after"
          visible={collapsed ? undefined : false}
        >
          <div
            className={mergeClasses(
              styles.navItem,
              collapsed && styles.navItemCollapsed
            )}
            data-element-id="d365-nav-recent"
          >
            <Clock20Regular className={styles.navItemIcon} />
            {!collapsed && (
              <span className={styles.navItemLabel}>Recent</span>
            )}
          </div>
        </Tooltip>
      </div>

      {/* Sitemap areas and groups */}
      {areas.map((area) => (
        <div key={area.id}>
          {area.groups.map((group) => (
            <div key={group.id}>
              {/* Group header */}
              {!collapsed && (
                <div
                  className={styles.sectionHeader}
                  onClick={() => toggleGroup(group.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedGroups.has(group.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleGroup(group.id);
                    }
                  }}
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown12Regular />
                  ) : (
                    <ChevronRight12Regular />
                  )}
                  <span className={styles.sectionTitle}>{group.title}</span>
                </div>
              )}

              {/* Group items */}
              {(collapsed || expandedGroups.has(group.id)) &&
                group.items.map((item) => {
                  const isActive =
                    activeEntity === item.entity_logical_name;
                  return (
                    <Tooltip
                      key={item.entity_logical_name}
                      content={item.display_name}
                      relationship="label"
                      positioning="after"
                      visible={collapsed ? undefined : false}
                    >
                      <div
                        className={mergeClasses(
                          styles.navItem,
                          collapsed && styles.navItemCollapsed,
                          isActive && styles.navItemActive,
                          isActive && collapsed && styles.navItemActiveCollapsed
                        )}
                        onClick={() => handleItemClick(item)}
                        role="button"
                        tabIndex={0}
                        aria-current={isActive ? "page" : undefined}
                        data-element-id={`d365-nav-${item.entity_logical_name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleItemClick(item);
                          }
                        }}
                      >
                        <Table20Regular className={styles.navItemIcon} />
                        {!collapsed && (
                          <span className={styles.navItemLabel}>
                            {item.display_name}
                          </span>
                        )}
                      </div>
                    </Tooltip>
                  );
                })}

              {!collapsed && <div className={styles.groupDivider} />}
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

export { NAV_EXPANDED_WIDTH, NAV_COLLAPSED_WIDTH };
