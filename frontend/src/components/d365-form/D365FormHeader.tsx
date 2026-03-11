"use client";

/**
 * D365FormHeader — Mimics the Dynamics 365 form header.
 *
 * Shows the entity display name, a placeholder for the record title,
 * and optional header fields. This mirrors the real D365 form header
 * with the entity icon area and the record name placeholder.
 */

import {
  Text,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Form24Regular,
  WindowNew24Regular,
} from "@fluentui/react-icons";
import type { ScreenElement } from "@/types/trainingTrack";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 24px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  quickCreateRoot: {
    padding: "12px 20px",
    backgroundColor: tokens.colorBrandBackground2,
    borderBottom: `2px solid ${tokens.colorBrandStroke1}`,
  },
  iconArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  quickCreateIcon: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  entityName: {
    lineHeight: "1.2",
  },
  recordPlaceholder: {
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
    lineHeight: "1.2",
  },
  highlighted: {
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
  },
});

// ── Component ─────────────────────────────────────────────────────────

export interface D365FormHeaderProps {
  /** Entity display name */
  entityDisplayName: string;
  /** Header element from the screen layout */
  headerElement?: ScreenElement | null;
  /** Currently highlighted element ID */
  highlightedElementId?: string | null;
  /** Element click callback */
  onElementClick?: (elementId: string) => void;
  /** Whether this is a quick create form */
  isQuickCreate?: boolean;
  /** Optional form title override */
  formTitle?: string;
}

export function D365FormHeader({
  entityDisplayName,
  headerElement,
  highlightedElementId,
  onElementClick,
  isQuickCreate = false,
  formTitle,
}: D365FormHeaderProps) {
  const styles = useStyles();

  const elementId = headerElement?.element_id ?? `header_${entityDisplayName}`;
  const isHighlighted = highlightedElementId === elementId;

  return (
    <div
      data-element-id={elementId}
      className={mergeClasses(
        styles.root,
        isQuickCreate && styles.quickCreateRoot,
        isHighlighted && styles.highlighted
      )}
      onClick={() => onElementClick?.(elementId)}
      style={{ cursor: onElementClick ? "pointer" : "default" }}
    >
      <div
        className={mergeClasses(
          styles.iconArea,
          isQuickCreate && styles.quickCreateIcon
        )}
      >
        {isQuickCreate ? (
          <WindowNew24Regular style={{ fontSize: "18px" }} />
        ) : (
          <Form24Regular style={{ fontSize: "18px" }} />
        )}
      </div>

      <div className={styles.titleArea}>
        <Text size={isQuickCreate ? 400 : 500} weight="semibold" className={styles.entityName}>
          {isQuickCreate
            ? `Quick Create: ${formTitle || entityDisplayName}`
            : formTitle || entityDisplayName}
        </Text>
        {!isQuickCreate && (
          <Text size={200} className={styles.recordPlaceholder}>
            New record — no data entered yet
          </Text>
        )}
      </div>
    </div>
  );
}
