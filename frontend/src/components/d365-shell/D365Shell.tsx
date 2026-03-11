"use client";

import { useMemo, type ReactNode } from "react";
import { makeStyles } from "@fluentui/react-components";
import { D365NavBar } from "./D365NavBar";
import { D365SitemapNav } from "./D365SitemapNav";
import { D365CommandBar } from "./D365CommandBar";
import type { SitemapStructure, CommandBarActions } from "./types";

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#faf9f8",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  contentColumn: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  contentArea: {
    flex: 1,
    overflow: "auto",
    backgroundColor: "#ffffff",
    position: "relative",
  },
});

// ── Component ──────────────────────────────────────────────────────────

export interface D365ShellProps {
  /** The app display name shown in the nav bar. */
  appName: string;
  /** Sitemap navigation structure from the UX Expert agent. */
  sitemapStructure: SitemapStructure;
  /** Per-entity command bar actions from the UX Expert agent. */
  commandBarActions: CommandBarActions;
  /** Currently active entity logical name (drives nav + command bar). */
  activeEntity?: string | null;
  /** Called when a sitemap nav item is clicked. */
  onEntitySelect?: (entityLogicalName: string, displayName: string) => void;
  /** Called when a command bar action is clicked. */
  onCommandAction?: (action: string) => void;
  /** Whether the sitemap nav should start collapsed. */
  defaultNavCollapsed?: boolean;
  /** Brand primary color for the nav bar background. */
  primaryColor?: string;
  /** Brand text/icon color in the nav bar. */
  headerTextColor?: string;
  /** Brand logo URL displayed in the nav bar. */
  logoUrl?: string | null;
  /** Content to render inside the main content area. */
  children?: ReactNode;
}

/**
 * D365 chrome shell layout.
 *
 * Composes the three core D365 UI chrome elements into a complete shell:
 * 1. **Dark nav bar header** — "Dynamics 365 | {App Name}" with icons
 * 2. **Collapsible left sitemap navigation** — area/group/item hierarchy
 * 3. **Command bar** — context-aware action buttons for the active entity
 *
 * The `children` prop renders inside the main content area beneath the
 * command bar and to the right of the sitemap nav. This is where the
 * form/view renderer and coach mark overlay will be placed.
 *
 * All data-element-id attributes are set for coach mark targeting.
 */
export function D365Shell({
  appName,
  sitemapStructure,
  commandBarActions,
  activeEntity,
  onEntitySelect,
  onCommandAction,
  defaultNavCollapsed = false,
  primaryColor,
  headerTextColor,
  logoUrl,
  children,
}: D365ShellProps) {
  const styles = useStyles();

  // Resolve command bar actions for the currently active entity
  const currentActions = useMemo(() => {
    if (!activeEntity) return [];
    return commandBarActions[activeEntity] ?? [];
  }, [activeEntity, commandBarActions]);

  return (
    <div className={styles.root} data-element-id="d365-shell">
      {/* 1. Dark nav bar header */}
      <D365NavBar
        appName={appName}
        primaryColor={primaryColor}
        headerTextColor={headerTextColor}
        logoUrl={logoUrl}
      />

      {/* 2. Body: sitemap nav + content column */}
      <div className={styles.body}>
        {/* Left: collapsible sitemap navigation */}
        <D365SitemapNav
          sitemapStructure={sitemapStructure}
          activeEntity={activeEntity}
          onEntitySelect={onEntitySelect}
          defaultCollapsed={defaultNavCollapsed}
        />

        {/* Right: command bar + content area */}
        <div className={styles.contentColumn}>
          {/* 3. Command bar */}
          <D365CommandBar
            actions={currentActions}
            onAction={onCommandAction}
          />

          {/* Main content area */}
          <div className={styles.contentArea} data-element-id="d365-content-area">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
