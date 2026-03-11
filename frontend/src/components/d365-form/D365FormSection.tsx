"use client";

/**
 * D365FormSection — Mimics a Dynamics 365 form section.
 *
 * Sections group related fields and display a section header label.
 * In D365, sections typically use a 1- or 2-column layout. This
 * renderer uses a 2-column grid to match the default D365 form layout.
 */

import { type ReactNode } from "react";
import {
  Text,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import type { ScreenElement } from "@/types/trainingTrack";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px 0",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    marginBottom: "8px",
  },
  sectionLabel: {
    color: tokens.colorNeutralForeground2,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 24px",
    alignItems: "start",
  },
  highlighted: {
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    padding: "8px",
  },
});

// ── Component ─────────────────────────────────────────────────────────

export interface D365FormSectionProps {
  sectionId: string;
  label: string;
  element?: ScreenElement | null;
  children: ReactNode;
  highlightedElementId?: string | null;
  onElementClick?: (elementId: string) => void;
}

export function D365FormSection({
  sectionId,
  label,
  element,
  children,
  highlightedElementId,
  onElementClick,
}: D365FormSectionProps) {
  const styles = useStyles();

  const elementId = element?.element_id ?? sectionId;
  const isHighlighted = highlightedElementId === elementId;

  return (
    <div
      data-element-id={elementId}
      className={mergeClasses(
        styles.root,
        isHighlighted && styles.highlighted
      )}
      onClick={(e) => {
        // Only fire if clicking the section itself, not a child field
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-element-id]") === e.currentTarget) {
          onElementClick?.(elementId);
        }
      }}
    >
      <div className={styles.sectionHeader}>
        <Text size={200} weight="semibold" className={styles.sectionLabel}>
          {label}
        </Text>
      </div>
      <div className={styles.fieldGrid}>{children}</div>
    </div>
  );
}
