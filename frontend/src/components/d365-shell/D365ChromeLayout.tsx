"use client";

/**
 * D365ChromeLayout — Integrated Dynamics 365 chrome shell + content renderer.
 *
 * This is the top-level layout component that wraps the D365 chrome shell
 * (dark nav bar, collapsible left sitemap, command bar) around the inner
 * content renderers (form, view grid, quick create). It manages the
 * active-entity state driven by sitemap clicks and current walkthrough
 * step, routing the correct screen layout to the appropriate renderer.
 *
 * Usage:
 *   <D365ChromeLayout
 *     appName="Sales Hub"
 *     trainingContent={content}
 *     currentScreen={screen}
 *     highlightedElementId={elementId}
 *     onElementClick={handleClick}
 *   />
 *
 * Screen type routing:
 *  - "form_view" | "main_form" → D365FormRenderer (with tabs, sections, fields)
 *  - "view" | "grid" | "list"  → D365ViewGrid (entity list view)
 *  - "quick_create"            → QuickCreateForm (slide-in overlay)
 *  - fallback                  → D365FormRenderer for any form-like screen
 */

import { useState, useMemo, useCallback, type ReactNode } from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { D365Shell } from "./D365Shell";
import { D365FormRenderer } from "@/components/d365-form/D365FormRenderer";
import { D365ViewGrid } from "@/components/d365-renderer/D365ViewGrid";
import { QuickCreateForm } from "@/components/d365-form/QuickCreateForm";
import type {
  ScreenLayout,
  StepLayout,
  BrandConfig,
  AppTrainingContent,
} from "@/types/trainingTrack";
import type { SitemapStructure, CommandBarActions } from "./types";

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  contentWrapper: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  emptyContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
  },
});

// ── Helpers ────────────────────────────────────────────────────────────

/** Determine whether a screen type should render as a form. */
function isFormScreen(screenType: string): boolean {
  return [
    "form_view",
    "main_form",
    "form",
    "quick_create",
  ].includes(screenType);
}

/** Determine whether a screen type should render as a view/grid. */
function isViewScreen(screenType: string): boolean {
  return ["view", "grid", "list", "entity_view"].includes(screenType);
}

/**
 * Build a SitemapStructure from training content if not explicitly provided.
 * Falls back to creating a simple sitemap from the available screens.
 */
function buildSitemapFromContent(content: AppTrainingContent): SitemapStructure {
  const raw = content.sitemap_structure;
  if (raw && typeof raw === "object" && "areas" in raw) {
    return raw as unknown as SitemapStructure;
  }

  // Fallback: derive from screens
  const entitySet = new Map<string, string>();
  for (const screen of content.screens) {
    if (screen.entity_logical_name && !entitySet.has(screen.entity_logical_name)) {
      entitySet.set(
        screen.entity_logical_name,
        screen.entity_display_name || screen.entity_logical_name
      );
    }
  }

  const items = Array.from(entitySet.entries()).map(
    ([logicalName, displayName], idx) => ({
      entity_logical_name: logicalName,
      display_name: displayName,
      position: idx + 1,
      has_main_form: content.screens.some(
        (s) =>
          s.entity_logical_name === logicalName && isFormScreen(s.screen_type)
      ),
      has_views: content.screens.some(
        (s) =>
          s.entity_logical_name === logicalName && isViewScreen(s.screen_type)
      ),
    })
  );

  return {
    areas: [
      {
        id: "area_default",
        title: content.app_display_name || "App",
        groups: [
          {
            id: "group_default",
            title: "Entities",
            items,
          },
        ],
      },
    ],
  };
}

/**
 * Build CommandBarActions from training content if not explicitly provided.
 */
function buildCommandBarActions(
  content: AppTrainingContent
): CommandBarActions {
  const raw = content.command_bar_actions;
  if (raw && typeof raw === "object") {
    // Validate it looks like Record<string, string[]>
    const entries = Object.entries(raw);
    if (entries.length > 0 && Array.isArray(entries[0][1])) {
      return raw as unknown as CommandBarActions;
    }
  }

  // Fallback: derive typical D365 actions per entity
  const actions: CommandBarActions = {};
  const entitySet = new Set(
    content.screens.map((s) => s.entity_logical_name).filter(Boolean)
  );
  for (const entity of entitySet) {
    actions[entity] = ["Save", "Save & Close", "+ New", "Delete", "Refresh"];
  }
  return actions;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface D365ChromeLayoutProps {
  /** Training content containing screens, sitemap, brand, etc. */
  trainingContent: AppTrainingContent;
  /** The screen layout currently being displayed. */
  currentScreen?: ScreenLayout | null;
  /** Currently highlighted element ID (for walkthrough coach mark). */
  highlightedElementId?: string | null;
  /** Callback when an element is clicked inside the rendered screen. */
  onElementClick?: (elementId: string) => void;
  /** Called when a sitemap entity is selected. */
  onEntitySelect?: (entityLogicalName: string, displayName: string) => void;
  /** Called when a command bar action is clicked (shell-level). */
  onCommandAction?: (action: string) => void;
  /** Override brand config (falls back to training content brand). */
  brandConfig?: BrandConfig | null;
  /** Active step layout for view grid highlighting. */
  activeStepLayout?: StepLayout | null;
  /** Whether the quick create overlay is currently open. */
  quickCreateOpen?: boolean;
  /** The quick create screen layout when overlay is open. */
  quickCreateScreen?: ScreenLayout | null;
  /** Callback to close the quick create overlay. */
  onQuickCreateClose?: () => void;
  /** Whether to start with the sitemap collapsed. */
  defaultNavCollapsed?: boolean;
  /** Additional content to render below the form/view (e.g. walkthrough controls). */
  overlay?: ReactNode;
  /** Children rendered after the main screen content. */
  children?: ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────

/**
 * D365ChromeLayout wraps the full D365 chrome experience around
 * form/view renderers. It provides:
 *
 * 1. **Dark nav bar** — "Dynamics 365 | {App Name}" with brand colors
 * 2. **Collapsible left sitemap** — entity navigation hierarchy
 * 3. **Command bar** — context-aware actions for the active entity
 * 4. **Content area** — renders the appropriate screen:
 *    - D365FormRenderer for form screens (tabbed sections, fields)
 *    - D365ViewGrid for list/view screens
 *    - QuickCreateForm as a slide-in overlay
 *
 * All `data-element-id` attributes are preserved for coach mark targeting.
 */
export function D365ChromeLayout({
  trainingContent,
  currentScreen,
  highlightedElementId,
  onElementClick,
  onEntitySelect,
  onCommandAction,
  brandConfig,
  activeStepLayout,
  quickCreateOpen = false,
  quickCreateScreen,
  onQuickCreateClose,
  defaultNavCollapsed = false,
  overlay,
  children,
}: D365ChromeLayoutProps) {
  const styles = useStyles();

  // Track active entity — driven by current screen or user selection
  const [activeEntityOverride, setActiveEntityOverride] = useState<
    string | null
  >(null);

  const activeEntity = useMemo(() => {
    if (activeEntityOverride) return activeEntityOverride;
    return currentScreen?.entity_logical_name ?? null;
  }, [activeEntityOverride, currentScreen]);

  // Build sitemap and command bar actions from training content
  const sitemapStructure = useMemo(
    () => buildSitemapFromContent(trainingContent),
    [trainingContent]
  );

  const commandBarActions = useMemo(
    () => buildCommandBarActions(trainingContent),
    [trainingContent]
  );

  // Resolve brand config
  const brand = brandConfig ?? trainingContent.brand ?? null;

  // Entity selection handler
  const handleEntitySelect = useCallback(
    (entityLogicalName: string, displayName: string) => {
      setActiveEntityOverride(entityLogicalName);
      onEntitySelect?.(entityLogicalName, displayName);
    },
    [onEntitySelect]
  );

  // Determine screen type for rendering
  const screenType = currentScreen?.screen_type ?? "";
  const isForm = isFormScreen(screenType) && screenType !== "quick_create";
  const isView = isViewScreen(screenType);

  // Resolve command bar actions for the form renderer
  const formCommandActions = useMemo(() => {
    if (!activeEntity) return [];
    return commandBarActions[activeEntity] ?? [];
  }, [activeEntity, commandBarActions]);

  return (
    <div className={styles.root} data-element-id="d365-chrome-layout">
      <D365Shell
        appName={trainingContent.app_display_name || "App"}
        sitemapStructure={sitemapStructure}
        commandBarActions={commandBarActions}
        activeEntity={activeEntity}
        onEntitySelect={handleEntitySelect}
        onCommandAction={onCommandAction}
        defaultNavCollapsed={defaultNavCollapsed}
        primaryColor={brand?.primary_color}
        headerTextColor={brand?.header_text_color}
        logoUrl={brand?.logo_url}
      >
        <div className={styles.contentWrapper}>
          {/* Overlay layer (walkthrough controls, coach marks) */}
          {overlay}

          {/* Main content screen */}
          {currentScreen ? (
            <>
              {isForm && (
                <D365FormRenderer
                  screen={currentScreen}
                  commandBarActions={formCommandActions}
                  highlightedElementId={highlightedElementId}
                  onElementClick={onElementClick}
                />
              )}

              {isView && (
                <D365ViewGrid
                  screen={currentScreen}
                  activeStepLayout={activeStepLayout}
                  highlightedElementId={highlightedElementId}
                />
              )}

              {/* Fallback: if screen type is unrecognized, try form */}
              {!isForm && !isView && (
                <D365FormRenderer
                  screen={currentScreen}
                  commandBarActions={formCommandActions}
                  highlightedElementId={highlightedElementId}
                  onElementClick={onElementClick}
                />
              )}
            </>
          ) : (
            <div className={styles.emptyContent}>
              <Text size={400} weight="semibold">
                Select an entity from the navigation
              </Text>
              <Text size={200}>
                Click an item in the left sitemap to view its form or grid.
              </Text>
            </div>
          )}

          {/* Quick Create overlay */}
          {quickCreateScreen && (
            <QuickCreateForm
              screen={quickCreateScreen}
              open={quickCreateOpen}
              onClose={onQuickCreateClose ?? (() => {})}
              highlightedElementIds={
                highlightedElementId ? [highlightedElementId] : []
              }
            />
          )}

          {/* Additional children */}
          {children}
        </div>
      </D365Shell>
    </div>
  );
}
