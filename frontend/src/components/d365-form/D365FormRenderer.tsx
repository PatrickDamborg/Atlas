"use client";

/**
 * D365FormRenderer — High-fidelity Dynamics 365 model-driven app form renderer.
 *
 * Renders a ScreenLayout (form_view or quick_create) as an interactive D365-like
 * form with:
 *  - Entity header bar with record title placeholder
 *  - Command bar with action buttons (Save, New, Delete, etc.)
 *  - Tabbed form navigation
 *  - Sections with labeled empty input fields
 *  - data-element-id attributes on every element for CoachMark targeting
 *
 * All fields are rendered as empty inputs with field-type annotations.
 * No sample/placeholder data is shown — only labels and type indicators.
 */

import { useState, useMemo, useCallback } from "react";
import {
  Text,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import type { ScreenLayout, ScreenElement } from "@/types/trainingTrack";
import { D365CommandBar } from "./D365CommandBar";
import { D365FormHeader } from "./D365FormHeader";
import { D365FormTabs } from "./D365FormTabs";
import { D365FormSection } from "./D365FormSection";
import { D365FormField } from "./D365FormField";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: "hidden",
    fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",
  },
  formBody: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 24px 24px 24px",
  },
  formContent: {
    maxWidth: "960px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    padding: "16px 20px",
    marginBottom: "16px",
  },
  sectionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  emptyFormMessage: {
    padding: "40px 24px",
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
});

// ── Types ─────────────────────────────────────────────────────────────

export interface D365FormRendererProps {
  /** The screen layout to render (from UX Expert agent output) */
  screen: ScreenLayout;
  /** Command bar actions for this entity (from UX Expert) */
  commandBarActions?: string[];
  /** Currently highlighted element ID (for walkthrough) */
  highlightedElementId?: string | null;
  /** Callback when an element is clicked (for walkthrough interaction) */
  onElementClick?: (elementId: string) => void;
  /**
   * Map of element_id → Markdown annotation text.
   * When provided, each field whose element_id appears in this map will
   * display the corresponding Markdown annotation below the field input.
   */
  fieldAnnotations?: Record<string, string>;
}

// ── Helpers ───────────────────────────────────────────────────────────

interface TabData {
  tabId: string;
  label: string;
  element: ScreenElement | null;
  order: number;
}

interface SectionData {
  sectionId: string;
  label: string;
  element: ScreenElement | null;
  fields: ScreenElement[];
  order: number;
}

/**
 * Organize screen elements into tabs → sections → fields hierarchy.
 */
function organizeFormElements(elements: ScreenElement[]): {
  header: ScreenElement | null;
  commandButtons: ScreenElement[];
  tabs: TabData[];
  sectionsByTab: Record<string, SectionData[]>;
  subgrids: ScreenElement[];
  navItems: ScreenElement[];
} {
  const header = elements.find((e) => e.element_type === "header") ?? null;
  const commandButtons = elements
    .filter((e) => e.element_type === "command_button")
    .sort((a, b) => (a.position?.order ?? 99) - (b.position?.order ?? 99));
  const navItems = elements
    .filter((e) => e.element_type === "nav_item")
    .sort((a, b) => (a.position?.order ?? 99) - (b.position?.order ?? 99));
  const subgrids = elements
    .filter((e) => e.element_type === "subgrid")
    .sort((a, b) => (a.position?.order ?? 99) - (b.position?.order ?? 99));

  // Collect tab elements
  const tabElements = elements.filter((e) => e.element_type === "tab");
  const sectionElements = elements.filter(
    (e) => e.element_type === "section" && !e.metadata?.business_rule
  );
  const fieldElements = elements.filter(
    (e) => e.element_type === "form_field"
  );

  // Build tabs — if no explicit tab elements, create a default "General" tab
  const tabMap = new Map<string, TabData>();
  if (tabElements.length > 0) {
    for (const te of tabElements) {
      const tabName = te.metadata?.tab_name ?? te.label ?? "General";
      tabMap.set(tabName, {
        tabId: te.element_id,
        label: tabName as string,
        element: te,
        order: (te.position?.order as number) ?? 1,
      });
    }
  }

  // Ensure every field's tab exists
  for (const fe of fieldElements) {
    const tabName = (fe.position?.tab as string) ?? "General";
    if (!tabMap.has(tabName)) {
      tabMap.set(tabName, {
        tabId: `tab_auto_${tabName.toLowerCase().replace(/\s+/g, "_")}`,
        label: tabName,
        element: null,
        order: tabMap.size + 1,
      });
    }
  }

  // Default tab if nothing found
  if (tabMap.size === 0) {
    tabMap.set("General", {
      tabId: "tab_default_general",
      label: "General",
      element: null,
      order: 1,
    });
  }

  const tabs = Array.from(tabMap.values()).sort((a, b) => a.order - b.order);

  // Organize sections per tab, then fields per section
  const sectionsByTab: Record<string, SectionData[]> = {};

  for (const tab of tabs) {
    const tabName = tab.label;
    const sectionsForTab = new Map<string, SectionData>();

    // Find explicit sections assigned to this tab
    for (const se of sectionElements) {
      const sectionTab = (se.position?.tab as string) ?? "General";
      if (sectionTab === tabName) {
        const sectionName =
          (se.metadata?.section_name as string) ?? se.label ?? "General";
        sectionsForTab.set(sectionName, {
          sectionId: se.element_id,
          label: sectionName,
          element: se,
          fields: [],
          order: (se.position?.order as number) ?? 1,
        });
      }
    }

    // Assign fields to sections within this tab
    for (const fe of fieldElements) {
      const fieldTab = (fe.position?.tab as string) ?? "General";
      if (fieldTab !== tabName) continue;

      const fieldSection = (fe.position?.section as string) ?? "General";
      if (!sectionsForTab.has(fieldSection)) {
        sectionsForTab.set(fieldSection, {
          sectionId: `section_auto_${fieldSection.toLowerCase().replace(/\s+/g, "_")}`,
          label: fieldSection,
          element: null,
          fields: [],
          order: sectionsForTab.size + 1,
        });
      }
      sectionsForTab.get(fieldSection)!.fields.push(fe);
    }

    // Ensure at least one section per tab
    if (sectionsForTab.size === 0) {
      sectionsForTab.set("General", {
        sectionId: `section_default_${tabName.toLowerCase().replace(/\s+/g, "_")}`,
        label: "General",
        element: null,
        fields: [],
        order: 1,
      });
    }

    sectionsByTab[tabName] = Array.from(sectionsForTab.values()).sort(
      (a, b) => a.order - b.order
    );
  }

  return { header, commandButtons, tabs, sectionsByTab, subgrids, navItems };
}

// ── Component ─────────────────────────────────────────────────────────

export function D365FormRenderer({
  screen,
  commandBarActions,
  highlightedElementId,
  onElementClick,
  fieldAnnotations,
}: D365FormRendererProps) {
  const styles = useStyles();

  const organized = useMemo(
    () => organizeFormElements(screen.elements),
    [screen.elements]
  );

  const { header, commandButtons, tabs, sectionsByTab, subgrids } = organized;

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>(
    tabs.length > 0 ? tabs[0].label : "General"
  );

  const handleTabChange = useCallback((tabLabel: string) => {
    setActiveTab(tabLabel);
  }, []);

  const activeSections = sectionsByTab[activeTab] ?? [];

  // Derive command bar action labels
  const cmdActions = useMemo(() => {
    if (commandBarActions && commandBarActions.length > 0) {
      return commandBarActions;
    }
    // Fall back to command button elements
    return commandButtons.map((cb) => cb.label);
  }, [commandBarActions, commandButtons]);

  const isQuickCreate = screen.screen_type === "quick_create";

  return (
    <div className={styles.root} data-screen-id={screen.screen_id}>
      {/* Command Bar */}
      <D365CommandBar
        actions={cmdActions}
        commandElements={commandButtons}
        highlightedElementId={highlightedElementId}
        onElementClick={onElementClick}
        isQuickCreate={isQuickCreate}
      />

      {/* Form Header */}
      <D365FormHeader
        entityDisplayName={screen.entity_display_name || screen.entity_logical_name}
        headerElement={header}
        highlightedElementId={highlightedElementId}
        onElementClick={onElementClick}
        isQuickCreate={isQuickCreate}
        formTitle={screen.title}
      />

      {/* Tabs (not shown for quick create forms) */}
      {!isQuickCreate && tabs.length > 1 && (
        <D365FormTabs
          tabs={tabs.map((t) => ({
            id: t.tabId,
            label: t.label,
            elementId: t.element?.element_id ?? t.tabId,
          }))}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          highlightedElementId={highlightedElementId}
          onElementClick={onElementClick}
        />
      )}

      {/* Form Body — sections and fields */}
      <div className={styles.formBody}>
        {activeSections.length > 0 ? (
          <div className={styles.formContent}>
            <div className={styles.sectionGroup}>
              {activeSections.map((section) => (
                <D365FormSection
                  key={section.sectionId}
                  sectionId={section.sectionId}
                  label={section.label}
                  element={section.element}
                  highlightedElementId={highlightedElementId}
                  onElementClick={onElementClick}
                >
                  {section.fields
                    .sort(
                      (a, b) =>
                        ((a.position?.order as number) ?? 99) -
                        ((b.position?.order as number) ?? 99)
                    )
                    .map((field) => (
                      <D365FormField
                        key={field.element_id}
                        element={field}
                        isHighlighted={
                          highlightedElementId === field.element_id
                        }
                        onElementClick={onElementClick}
                        annotationMarkdown={
                          fieldAnnotations?.[field.element_id] ?? null
                        }
                      />
                    ))}
                </D365FormSection>
              ))}

              {/* Subgrids in active tab */}
              {subgrids.length > 0 && (
                <D365FormSection
                  sectionId="section_subgrids"
                  label="Related Records"
                  highlightedElementId={highlightedElementId}
                  onElementClick={onElementClick}
                >
                  {subgrids.map((sg) => (
                    <div
                      key={sg.element_id}
                      data-element-id={sg.element_id}
                      style={{
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        borderRadius: tokens.borderRadiusMedium,
                        padding: "12px",
                        backgroundColor: tokens.colorNeutralBackground3,
                        cursor: onElementClick ? "pointer" : "default",
                      }}
                      onClick={() => onElementClick?.(sg.element_id)}
                    >
                      <Text size={200} weight="semibold">
                        {sg.label || "Subgrid"}
                      </Text>
                      <Text
                        size={100}
                        style={{
                          display: "block",
                          marginTop: "4px",
                          color: tokens.colorNeutralForeground3,
                          fontStyle: "italic",
                        }}
                      >
                        Related records grid
                      </Text>
                    </div>
                  ))}
                </D365FormSection>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyFormMessage}>
            <Text size={300}>
              No fields defined for the &quot;{activeTab}&quot; tab.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
