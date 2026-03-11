"use client";

/**
 * D365FormWithShell — Renders a D365 Main Form inside the full chrome shell.
 *
 * Composes the D365Shell (nav bar, sitemap, command bar) with the
 * D365FormRenderer for form_view screens. This gives end users the full
 * Dynamics 365 experience during walkthroughs: dark nav bar at top, left
 * sitemap navigation, and a tabbed form with sections and empty fields
 * annotated with Markdown walkthrough instructions.
 *
 * Props accept the same UX Expert output data (screens, sitemap, command bar
 * actions) that the view grid uses, plus walkthrough annotations for the
 * currently active step.
 */

import { useMemo, useCallback } from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { D365Shell } from "@/components/d365-shell";
import type { SitemapStructure, CommandBarActions } from "@/components/d365-shell";
import { D365FormRenderer } from "./D365FormRenderer";
import type {
  ScreenLayout,
  StepLayout,
  TrainingAnnotation,
  BrandConfig,
} from "@/types/trainingTrack";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  formArea: {
    flex: 1,
    overflow: "hidden",
  },
  noFormMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
  },
});

// ── Types ─────────────────────────────────────────────────────────────

export interface D365FormWithShellProps {
  /** App display name for the nav bar header */
  appName: string;
  /** The form_view screen layout to render */
  screen: ScreenLayout;
  /** All available screens (for entity navigation) */
  screens: ScreenLayout[];
  /** Sitemap navigation structure from UX Expert */
  sitemapStructure: SitemapStructure;
  /** Per-entity command bar actions from UX Expert */
  commandBarActions: CommandBarActions;
  /** Step layouts from UX Expert */
  stepLayouts: StepLayout[];
  /** Currently active annotation (for Markdown display on fields) */
  activeAnnotation?: TrainingAnnotation | null;
  /** Currently active step layout (for element highlighting) */
  activeStepLayout?: StepLayout | null;
  /** Brand configuration for the chrome shell */
  brand?: BrandConfig | null;
  /** Called when a sitemap entity is clicked (for screen navigation) */
  onEntitySelect?: (entityLogicalName: string) => void;
  /** Optional class name */
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Build a map of element_id → Markdown annotation text for fields
 * targeted by the current walkthrough step.
 *
 * When a step targets a specific field, we display the annotation's
 * instruction text as Markdown below that field. When a step targets
 * a non-field element (tab, section, header), we do not annotate
 * individual fields.
 */
function buildFieldAnnotationMap(
  screen: ScreenLayout,
  activeAnnotation: TrainingAnnotation | null | undefined,
  activeStepLayout: StepLayout | null | undefined
): Record<string, string> {
  const map: Record<string, string> = {};

  if (!activeAnnotation || !activeStepLayout) return map;

  // Only annotate if the step targets this screen
  if (activeStepLayout.screen_id !== screen.screen_id) return map;

  const targetElementId = activeStepLayout.target_element_id;
  if (!targetElementId) return map;

  // Check if the target is a form field
  const targetElement = screen.elements.find(
    (el) => el.element_id === targetElementId
  );

  if (targetElement?.element_type === "form_field") {
    // Show the annotation instruction on the targeted field
    const annotationText = activeAnnotation.instruction || activeAnnotation.detail_text || "";
    if (annotationText.trim()) {
      map[targetElementId] = annotationText;
    }
  }

  return map;
}

// ── Component ─────────────────────────────────────────────────────────

export function D365FormWithShell({
  appName,
  screen,
  screens,
  sitemapStructure,
  commandBarActions,
  stepLayouts,
  activeAnnotation,
  activeStepLayout,
  brand,
  onEntitySelect,
  className,
}: D365FormWithShellProps) {
  const styles = useStyles();

  // Determine the active entity from the current screen
  const activeEntity = screen.entity_logical_name;

  // Build field annotations map for Markdown display
  const fieldAnnotations = useMemo(
    () => buildFieldAnnotationMap(screen, activeAnnotation, activeStepLayout),
    [screen, activeAnnotation, activeStepLayout]
  );

  // Determine highlighted element
  const highlightedElementId = activeStepLayout?.screen_id === screen.screen_id
    ? activeStepLayout?.target_element_id ?? null
    : null;

  // Get command bar actions for the current entity
  const entityActions = useMemo(() => {
    return commandBarActions[activeEntity] ?? [];
  }, [commandBarActions, activeEntity]);

  // Handle entity selection from sitemap
  const handleEntitySelect = useCallback(
    (entityLogicalName: string, _displayName: string) => {
      onEntitySelect?.(entityLogicalName);
    },
    [onEntitySelect]
  );

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      <D365Shell
        appName={appName}
        sitemapStructure={sitemapStructure}
        commandBarActions={commandBarActions}
        activeEntity={activeEntity}
        onEntitySelect={handleEntitySelect}
        primaryColor={brand?.primary_color}
        headerTextColor={brand?.header_text_color}
        logoUrl={brand?.logo_url}
      >
        <div className={styles.formArea}>
          <D365FormRenderer
            screen={screen}
            commandBarActions={entityActions}
            highlightedElementId={highlightedElementId}
            fieldAnnotations={fieldAnnotations}
          />
        </div>
      </D365Shell>
    </div>
  );
}
