"use client";

import { useRef, useEffect, useState, useCallback, useId } from "react";
import {
  Button,
  Text,
  Badge,
  Card,
  Divider,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Lightbulb24Regular,
  Info24Regular,
  Dismiss24Regular,
  ShieldTask24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import type { ResolvedStep } from "@/hooks/useStepResolver";
import { useOverlayPositioning } from "@/hooks/useOverlayPositioning";
import { useOptionalTargetRefRegistry } from "@/contexts/TargetRefRegistry";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  /** Full-screen overlay backdrop */
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9000,
    pointerEvents: "none",
  },

  /** SVG mask that dims everything except the highlight cutout */
  backdropSvg: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 9001,
    pointerEvents: "auto",
  },

  /** Highlight ring drawn around the target element */
  highlightRing: {
    position: "fixed",
    zIndex: 9002,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: `0 0 0 4px ${tokens.colorBrandBackground}, 0 0 0 6px ${tokens.colorBrandBackgroundPressed}`,
    pointerEvents: "none",
    transitionProperty: "top, left, width, height",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },

  highlightPulse: {
    animationName: {
      "0%": { boxShadow: `0 0 0 4px ${tokens.colorBrandBackground}, 0 0 0 6px ${tokens.colorBrandBackgroundPressed}` },
      "50%": { boxShadow: `0 0 0 6px ${tokens.colorBrandBackground}, 0 0 12px 8px ${tokens.colorBrandBackgroundPressed}` },
      "100%": { boxShadow: `0 0 0 4px ${tokens.colorBrandBackground}, 0 0 0 6px ${tokens.colorBrandBackgroundPressed}` },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
  },

  /** Callout card positioned near the target */
  callout: {
    position: "fixed",
    zIndex: 9003,
    pointerEvents: "auto",
    maxWidth: "420px",
    minWidth: "320px",
    transitionProperty: "top, left, opacity",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },

  calloutCard: {
    boxShadow: tokens.shadow16,
  },

  calloutHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },

  calloutTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flex: 1,
  },

  markdownContent: {
    lineHeight: "1.6",
    marginBottom: tokens.spacingVerticalM,
    "& p": {
      marginTop: 0,
      marginBottom: tokens.spacingVerticalS,
    },
    "& ul, & ol": {
      paddingLeft: tokens.spacingHorizontalL,
      marginTop: 0,
      marginBottom: tokens.spacingVerticalS,
    },
    "& li": {
      marginBottom: tokens.spacingVerticalXXS,
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground3,
      paddingLeft: tokens.spacingHorizontalXXS,
      paddingRight: tokens.spacingHorizontalXXS,
      borderRadius: tokens.borderRadiusSmall,
      fontFamily: tokens.fontFamilyMonospace,
      fontSize: tokens.fontSizeBase200,
    },
    "& strong": {
      fontWeight: tokens.fontWeightSemibold,
    },
  },

  tooltipHint: {
    marginBottom: tokens.spacingVerticalM,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },

  detailSection: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },

  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalS,
  },

  tipsSection: {
    marginTop: tokens.spacingVerticalS,
  },

  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalS,
  },

  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },

  tipIcon: {
    color: tokens.colorPaletteYellowForeground1,
    marginTop: "2px",
    flexShrink: 0,
  },

  navBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  navButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },

  progressText: {
    color: tokens.colorNeutralForeground3,
  },

  /** Fallback styles when no DOM target element found */
  calloutCentered: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 9003,
    pointerEvents: "auto",
    maxWidth: "480px",
    minWidth: "320px",
  },

  /** Badge row for text-only (business rule) steps */
  textStepBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },

  /** Business rule name label */
  businessRuleName: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },

  /** Visually hidden live region for screen reader announcements */
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
});

// ── Types ─────────────────────────────────────────────────────────────

export type CalloutPosition = "bottom" | "top" | "left" | "right" | "auto";

export interface CoachMarkOverlayProps {
  /** The resolved step to display */
  step: ResolvedStep;
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirst: boolean;
  /** Whether this is the last step */
  isLast: boolean;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go to previous step */
  onPrev: () => void;
  /** Callback when user dismisses the overlay */
  onDismiss?: () => void;
  /** Preferred callout position relative to the highlight target */
  preferredPosition?: CalloutPosition;
  /**
   * CSS selector or data-element-id attribute to find the target DOM element.
   * If provided, overrides the step's target_element_id lookup.
   */
  targetSelector?: string;
  /** Whether to show the dim backdrop overlay. Defaults to true. */
  showBackdrop?: boolean;
}

// ── Geometry helpers ──────────────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CALLOUT_GAP = 12; // px between highlight and callout
const HIGHLIGHT_PADDING = 6; // px padding around the highlight rect

/**
 * Compute the best callout position based on available viewport space.
 */
function computeCalloutPosition(
  targetRect: Rect,
  calloutRect: { width: number; height: number },
  preferred: CalloutPosition,
  viewport: { width: number; height: number }
): { top: number; left: number; resolvedPosition: CalloutPosition } {
  const positions: CalloutPosition[] =
    preferred === "auto"
      ? ["bottom", "right", "top", "left"]
      : [preferred, "bottom", "right", "top", "left"];

  for (const pos of positions) {
    let top = 0;
    let left = 0;

    switch (pos) {
      case "bottom":
        top = targetRect.top + targetRect.height + CALLOUT_GAP;
        left = targetRect.left + targetRect.width / 2 - calloutRect.width / 2;
        break;
      case "top":
        top = targetRect.top - calloutRect.height - CALLOUT_GAP;
        left = targetRect.left + targetRect.width / 2 - calloutRect.width / 2;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - calloutRect.height / 2;
        left = targetRect.left + targetRect.width + CALLOUT_GAP;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - calloutRect.height / 2;
        left = targetRect.left - calloutRect.width - CALLOUT_GAP;
        break;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, viewport.width - calloutRect.width - 8));
    top = Math.max(8, Math.min(top, viewport.height - calloutRect.height - 8));

    // Check if it fits without overlapping the target
    const calloutBounds = {
      top,
      left,
      right: left + calloutRect.width,
      bottom: top + calloutRect.height,
    };
    const targetBounds = {
      top: targetRect.top - HIGHLIGHT_PADDING,
      left: targetRect.left - HIGHLIGHT_PADDING,
      right: targetRect.left + targetRect.width + HIGHLIGHT_PADDING,
      bottom: targetRect.top + targetRect.height + HIGHLIGHT_PADDING,
    };

    const overlaps =
      calloutBounds.left < targetBounds.right &&
      calloutBounds.right > targetBounds.left &&
      calloutBounds.top < targetBounds.bottom &&
      calloutBounds.bottom > targetBounds.top;

    if (!overlaps) {
      return { top, left, resolvedPosition: pos };
    }
  }

  // Fallback: below
  return {
    top: targetRect.top + targetRect.height + CALLOUT_GAP,
    left: Math.max(
      8,
      Math.min(
        targetRect.left + targetRect.width / 2 - calloutRect.width / 2,
        viewport.width - calloutRect.width - 8
      )
    ),
    resolvedPosition: "bottom",
  };
}

// ── Component ─────────────────────────────────────────────────────────

export function CoachMarkOverlay({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onDismiss,
  preferredPosition = "auto",
  targetSelector,
  showBackdrop = true,
}: CoachMarkOverlayProps) {
  const styles = useStyles();
  const calloutRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [calloutPos, setCalloutPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Unique mask ID so multiple overlays don't clash
  const reactId = useId();
  const maskId = `coach-mark-mask-${reactId.replace(/:/g, "")}`;

  const { annotation, layout, targetElement } = step;

  // Text-only steps (e.g. business rules) have no target element and always
  // render as a centered callout with a special visual treatment.
  const isTextStep = annotation.step_type === "text";

  // ── Resolve the target element ID ──────────────────────────────────
  // Priority: explicit selector → layout target → element from resolved step
  const resolvedTargetId = targetSelector
    ? undefined // handled separately by selector path below
    : layout?.target_element_id ?? targetElement?.element_id ?? undefined;

  // ── Enhanced positioning via registry + ResizeObserver + MutationObserver
  // The useOverlayPositioning hook uses TargetRefRegistry for O(1) lookup,
  // falls back to DOM query, and listens for resize/scroll/mutation events.
  const registry = useOptionalTargetRefRegistry();
  const {
    targetRect: trackedRect,
    recompute: recomputeTrackedRect,
  } = useOverlayPositioning({
    targetElementId: resolvedTargetId,
    padding: HIGHLIGHT_PADDING,
    enabled: !targetSelector, // Disable when using custom CSS selector
  });

  // ── Custom selector fallback path ──────────────────────────────────
  const findTargetBySelector = useCallback((): HTMLElement | null => {
    if (!targetSelector) return null;
    return document.querySelector<HTMLElement>(targetSelector);
  }, [targetSelector]);

  // ── Compute callout position from a given target rect ──────────────
  const computeCallout = useCallback(
    (rect: Rect) => {
      const calloutEl = calloutRef.current;
      if (!calloutEl) return;
      const calloutDims = {
        width: calloutEl.offsetWidth || 380,
        height: calloutEl.offsetHeight || 300,
      };
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const pos = computeCalloutPosition(rect, calloutDims, preferredPosition, viewport);
      setCalloutPos({ top: pos.top, left: pos.left });
    },
    [preferredPosition]
  );

  // ── Update position from tracked rect (registry/observer path) ─────
  useEffect(() => {
    if (targetSelector) return; // Handled by selector path
    if (trackedRect) {
      const rect: Rect = {
        top: trackedRect.top,
        left: trackedRect.left,
        width: trackedRect.width,
        height: trackedRect.height,
      };
      setTargetRect(rect);
      computeCallout(rect);
    } else {
      setTargetRect(null);
      setCalloutPos(null);
    }
  }, [trackedRect, targetSelector, computeCallout]);

  // ── Custom selector path: direct DOM measurement + listeners ───────
  const updateSelectorPosition = useCallback(() => {
    if (!targetSelector) return;
    const el = findTargetBySelector();
    if (el) {
      const domRect = el.getBoundingClientRect();
      const rect: Rect = {
        top: domRect.top - HIGHLIGHT_PADDING,
        left: domRect.left - HIGHLIGHT_PADDING,
        width: domRect.width + HIGHLIGHT_PADDING * 2,
        height: domRect.height + HIGHLIGHT_PADDING * 2,
      };
      setTargetRect(rect);
      computeCallout(rect);
    } else {
      setTargetRect(null);
      setCalloutPos(null);
    }
  }, [targetSelector, findTargetBySelector, computeCallout]);

  useEffect(() => {
    if (!targetSelector) return;
    const timer = setTimeout(updateSelectorPosition, 50);
    window.addEventListener("resize", updateSelectorPosition);
    window.addEventListener("scroll", updateSelectorPosition, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSelectorPosition);
      window.removeEventListener("scroll", updateSelectorPosition, true);
    };
  }, [targetSelector, updateSelectorPosition, stepIndex]);

  // ── Re-measure after callout renders (for accurate height) ─────────
  useEffect(() => {
    if (calloutRef.current && targetRect) {
      requestAnimationFrame(() => {
        if (targetRect) computeCallout(targetRect);
      });
    }
  }, [annotation, targetRect, computeCallout]);

  // ── Force recompute on step change ─────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!targetSelector) {
        recomputeTrackedRect();
      }
      registry?.recomputeAll();
    }, 100);
    return () => clearTimeout(timer);
  }, [stepIndex, targetSelector, recomputeTrackedRect, registry]);

  // ── Keyboard navigation ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        if (!isFirst) {
          e.preventDefault();
          onPrev();
        }
      } else if (e.key === "Escape" && onDismiss) {
        e.preventDefault();
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFirst, isLast, onNext, onPrev, onDismiss]);

  // ── Annotation callout content ────────────────────────────────────
  const calloutContent = (
    <Card className={styles.calloutCard}>
      {/* Header */}
      <div className={styles.calloutHeader}>
        <div className={styles.calloutTitle}>
          <Badge appearance="filled" color={isTextStep ? "warning" : "brand"} size="medium">
            {stepIndex + 1}
          </Badge>
          <Text size={500} weight="semibold">
            {annotation.title || `Step ${stepIndex + 1}`}
          </Text>
        </div>
        {onDismiss && (
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            size="small"
            onClick={onDismiss}
            aria-label="Dismiss walkthrough"
          />
        )}
      </div>

      {/* Business rule badge for text-only steps */}
      {isTextStep && (
        <div className={styles.textStepBadgeRow}>
          <Badge
            appearance="outline"
            color="warning"
            size="medium"
            icon={<ShieldTask24Regular />}
          >
            Business Rule
          </Badge>
        </div>
      )}

      {/* Business rule name (if present) */}
      {isTextStep && annotation.business_rule_name && (
        <div className={styles.businessRuleName}>
          <ShieldTask24Regular style={{ fontSize: "16px", flexShrink: 0 }} />
          <Text size={200} weight="semibold">
            {annotation.business_rule_name}
          </Text>
        </div>
      )}

      {/* Instruction rendered as Markdown */}
      {annotation.instruction && (
        <div className={styles.markdownContent}>
          <ReactMarkdown>{annotation.instruction}</ReactMarkdown>
        </div>
      )}

      {/* Tooltip hint */}
      {annotation.tooltip_text && (
        <div className={styles.tooltipHint}>
          <Badge appearance="tint" color="informative" size="small">
            Hint
          </Badge>
          <Text
            size={200}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            {annotation.tooltip_text}
          </Text>
        </div>
      )}

      {/* Detail section rendered as Markdown */}
      {annotation.detail_text && (
        <div className={styles.detailSection}>
          <div className={styles.detailHeader}>
            <Info24Regular style={{ fontSize: "16px" }} />
            <Text size={200} weight="semibold">
              More Detail
            </Text>
          </div>
          <div className={styles.markdownContent}>
            <ReactMarkdown>{annotation.detail_text}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Tips */}
      {annotation.tips.length > 0 && (
        <div className={styles.tipsSection}>
          <Divider />
          <div className={styles.tipsList}>
            {annotation.tips.map((tip, idx) => (
              <div key={idx} className={styles.tipItem}>
                <Lightbulb24Regular
                  className={styles.tipIcon}
                  style={{
                    fontSize: "16px",
                    width: "16px",
                    height: "16px",
                  }}
                />
                <Text size={200}>{tip}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation bar */}
      <div className={styles.navBar}>
        <Text size={100} className={styles.progressText}>
          {stepIndex + 1} of {totalSteps}
        </Text>
        <div className={styles.navButtons}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            size="small"
            disabled={isFirst}
            onClick={onPrev}
            aria-label="Previous step"
          >
            Back
          </Button>
          <Button
            appearance="primary"
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            size="small"
            onClick={onNext}
            aria-label={isLast ? "Finish walkthrough" : "Next step"}
          >
            {isLast ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </Card>
  );

  // ── Render ────────────────────────────────────────────────────────

  // ARIA live region announces step changes to screen readers
  const stepTypeLabel = isTextStep ? "Business Rule" : "Walkthrough step";
  const liveAnnouncement = `Step ${stepIndex + 1} of ${totalSteps}: ${annotation.title || stepTypeLabel}`;

  // Text-only steps (business rules) always render centered — no element to highlight
  // Also fall back to centered when no target element found in DOM
  if (isTextStep || !targetRect || !calloutPos) {
    return (
      <div className={styles.overlay} role="dialog" aria-label="Walkthrough step">
        <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </div>
        {showBackdrop && (
          <svg className={styles.backdropSvg}>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" />
          </svg>
        )}
        <div ref={calloutRef} className={styles.calloutCentered}>
          {calloutContent}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-label="Walkthrough step">
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Dim backdrop with a cutout for the highlighted element */}
      {showBackdrop && (
        <svg className={styles.backdropSvg}>
          <defs>
            <mask id={maskId}>
              {/* White = visible (dimmed) */}
              <rect width="100%" height="100%" fill="white" />
              {/* Black = transparent cutout */}
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx={4}
                ry={4}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.45)"
            mask={`url(#${maskId})`}
          />
        </svg>
      )}

      {/* Highlight ring around the target */}
      <div
        className={mergeClasses(styles.highlightRing, styles.highlightPulse)}
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />

      {/* Positioned callout */}
      <div
        ref={calloutRef}
        className={styles.callout}
        style={{
          top: calloutPos.top,
          left: calloutPos.left,
        }}
      >
        {calloutContent}
      </div>
    </div>
  );
}
