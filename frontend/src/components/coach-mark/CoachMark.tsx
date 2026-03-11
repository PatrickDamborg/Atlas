"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  type RefObject,
} from "react";
import {
  Button,
  Text,
  Badge,
  Divider,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRight24Regular,
  ArrowLeft24Regular,
  Dismiss24Regular,
  Lightbulb24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import type { TrainingAnnotation } from "@/types/trainingTrack";

// ── Position types ──────────────────────────────────────────────────────

export type CoachMarkPosition = "top" | "bottom" | "left" | "right" | "auto";

interface ComputedPosition {
  top: number;
  left: number;
  placement: Exclude<CoachMarkPosition, "auto">;
}

// ── Styles ──────────────────────────────────────────────────────────────

const TOOLTIP_WIDTH = 360;
const TOOLTIP_OFFSET = 16;
const ARROW_SIZE = 8;

const useStyles = makeStyles({
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    pointerEvents: "none",
  },
  spotlight: {
    position: "fixed",
    zIndex: 9998,
    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.45)`,
    borderRadius: tokens.borderRadiusMedium,
    pointerEvents: "none",
    transitionProperty: "top, left, width, height",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },
  tooltipPanel: {
    position: "fixed",
    zIndex: 9999,
    width: `${TOOLTIP_WIDTH}px`,
    maxHeight: "80vh",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow16,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    pointerEvents: "auto",
    transitionProperty: "top, left, opacity",
    transitionDuration: "250ms",
    transitionTimingFunction: "ease-out",
  },
  tooltipHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorBrandBackground2,
    borderTopLeftRadius: tokens.borderRadiusLarge,
    borderTopRightRadius: tokens.borderRadiusLarge,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flex: 1,
    minWidth: 0,
  },
  tooltipBody: {
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  markdownContent: {
    "& p": {
      margin: 0,
      marginBottom: tokens.spacingVerticalS,
      lineHeight: "1.5",
      fontSize: tokens.fontSizeBase200,
    },
    "& p:last-child": {
      marginBottom: 0,
    },
    "& strong": {
      fontWeight: tokens.fontWeightSemibold,
    },
    "& em": {
      fontStyle: "italic",
    },
    "& ul, & ol": {
      paddingLeft: tokens.spacingHorizontalL,
      margin: 0,
      marginBottom: tokens.spacingVerticalS,
    },
    "& li": {
      fontSize: tokens.fontSizeBase200,
      lineHeight: "1.5",
      marginBottom: tokens.spacingVerticalXXS,
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground4,
      padding: "1px 4px",
      borderRadius: tokens.borderRadiusSmall,
      fontSize: tokens.fontSizeBase100,
      fontFamily: tokens.fontFamilyMonospace,
    },
    "& blockquote": {
      borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
      margin: 0,
      marginBottom: tokens.spacingVerticalS,
      paddingLeft: tokens.spacingHorizontalM,
      color: tokens.colorNeutralForeground3,
    },
  },
  detailSection: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  tipsSection: {
    marginTop: tokens.spacingVerticalS,
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXS,
    padding: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalXXS,
  },
  tipIcon: {
    color: tokens.colorPaletteYellowForeground1,
    marginTop: "2px",
    flexShrink: 0,
  },
  tooltipFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stepCounter: {
    color: tokens.colorNeutralForeground3,
  },
  footerButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  arrow: {
    position: "fixed",
    width: 0,
    height: 0,
    zIndex: 9999,
    pointerEvents: "none",
  },
  arrowTop: {
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid ${tokens.colorNeutralBackground1}`,
  },
  arrowBottom: {
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid ${tokens.colorNeutralBackground1}`,
  },
  arrowLeft: {
    borderTop: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid transparent`,
    borderLeft: `${ARROW_SIZE}px solid ${tokens.colorNeutralBackground1}`,
  },
  arrowRight: {
    borderTop: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid ${tokens.colorNeutralBackground1}`,
  },
});

// ── Position computation ────────────────────────────────────────────────

function computePosition(
  targetRect: DOMRect,
  preferredPosition: CoachMarkPosition,
  tooltipHeight: number
): ComputedPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceTop = targetRect.top;
  const spaceBottom = vh - targetRect.bottom;
  const spaceLeft = targetRect.left;
  const spaceRight = vw - targetRect.right;

  // Determine the best placement
  let placement: Exclude<CoachMarkPosition, "auto">;

  if (preferredPosition !== "auto") {
    placement = preferredPosition;
  } else {
    // Auto: pick the side with the most space, preferring bottom/right
    const spaces = [
      { dir: "bottom" as const, space: spaceBottom },
      { dir: "right" as const, space: spaceRight },
      { dir: "top" as const, space: spaceTop },
      { dir: "left" as const, space: spaceLeft },
    ];
    const best = spaces.reduce((a, b) => (b.space > a.space ? b : a));
    placement = best.dir;
  }

  let top = 0;
  let left = 0;

  switch (placement) {
    case "bottom":
      top = targetRect.bottom + TOOLTIP_OFFSET;
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "top":
      top = targetRect.top - tooltipHeight - TOOLTIP_OFFSET;
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "right":
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + TOOLTIP_OFFSET;
      break;
    case "left":
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
      break;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - tooltipHeight - 8));

  return { top, left, placement };
}

function getArrowPosition(
  targetRect: DOMRect,
  placement: Exclude<CoachMarkPosition, "auto">,
  tooltipLeft: number,
  tooltipTop: number,
  tooltipHeight: number
): { top: number; left: number } {
  switch (placement) {
    case "bottom":
      return {
        top: targetRect.bottom + TOOLTIP_OFFSET - ARROW_SIZE,
        left: targetRect.left + targetRect.width / 2 - ARROW_SIZE,
      };
    case "top":
      return {
        top: targetRect.top - TOOLTIP_OFFSET,
        left: targetRect.left + targetRect.width / 2 - ARROW_SIZE,
      };
    case "right":
      return {
        top: targetRect.top + targetRect.height / 2 - ARROW_SIZE,
        left: targetRect.right + TOOLTIP_OFFSET - ARROW_SIZE,
      };
    case "left":
      return {
        top: targetRect.top + targetRect.height / 2 - ARROW_SIZE,
        left: targetRect.left - TOOLTIP_OFFSET,
      };
  }
}

// ── CoachMark Component ─────────────────────────────────────────────────

export interface CoachMarkProps {
  /** The annotation content to display */
  annotation: TrainingAnnotation;
  /** Target element to highlight — pass a ref or a CSS selector string */
  targetRef?: RefObject<HTMLElement | null>;
  /** CSS selector to find the target element (used if targetRef not provided) */
  targetSelector?: string;
  /** Preferred tooltip position relative to the target */
  position?: CoachMarkPosition;
  /** Current step number (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirst: boolean;
  /** Whether this is the last step */
  isLast: boolean;
  /** Called when the user clicks Next */
  onNext: () => void;
  /** Called when the user clicks Previous */
  onPrev: () => void;
  /** Called when the user dismisses the coach mark */
  onDismiss?: () => void;
  /** Whether the coach mark is visible */
  visible?: boolean;
  /** Spotlight padding around the target element in pixels */
  spotlightPadding?: number;
}

export function CoachMark({
  annotation,
  targetRef,
  targetSelector,
  position = "auto",
  currentStep,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onDismiss,
  visible = true,
  spotlightPadding = 8,
}: CoachMarkProps) {
  const styles = useStyles();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(300);
  const [computedPos, setComputedPos] = useState<ComputedPosition | null>(null);

  // ── Resolve target element ──────────────────────────────────────────
  const resolveTarget = useCallback((): HTMLElement | null => {
    if (targetRef?.current) return targetRef.current;
    if (targetSelector) {
      return document.querySelector<HTMLElement>(targetSelector);
    }
    return null;
  }, [targetRef, targetSelector]);

  // ── Measure target and compute position ─────────────────────────────
  const updatePosition = useCallback(() => {
    const target = resolveTarget();
    if (!target) {
      setTargetRect(null);
      setComputedPos(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setTargetRect(rect);

    // Measure tooltip height
    const tipH = tooltipRef.current?.offsetHeight ?? tooltipHeight;
    setTooltipHeight(tipH);

    const pos = computePosition(rect, position, tipH);
    setComputedPos(pos);
  }, [resolveTarget, position, tooltipHeight]);

  // Run on mount and when annotation/position changes
  useEffect(() => {
    if (!visible) return;

    // Small delay to let DOM settle after step change
    const raf = requestAnimationFrame(() => {
      updatePosition();
    });

    return () => cancelAnimationFrame(raf);
  }, [visible, annotation.step_id, updatePosition]);

  // Update on window resize/scroll
  useEffect(() => {
    if (!visible) return;

    const handleUpdate = () => updatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [visible, updatePosition]);

  // Re-measure tooltip height after render
  useEffect(() => {
    if (!visible || !tooltipRef.current) return;
    const measured = tooltipRef.current.offsetHeight;
    if (measured !== tooltipHeight && measured > 0) {
      setTooltipHeight(measured);
    }
  });

  // ── Keyboard navigation ────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (!isLast) {
          e.preventDefault();
          onNext();
        }
      } else if (e.key === "ArrowLeft") {
        if (!isFirst) {
          e.preventDefault();
          onPrev();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDismiss?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, isFirst, isLast, onNext, onPrev, onDismiss]);

  if (!visible) return null;

  // Build the Markdown content from the annotation
  const markdownContent = buildMarkdownContent(annotation);

  // Arrow style based on placement
  const arrowClassName =
    computedPos &&
    {
      bottom: styles.arrowBottom,
      top: styles.arrowTop,
      right: styles.arrowRight,
      left: styles.arrowLeft,
    }[computedPos.placement];

  const arrowPos =
    targetRect && computedPos
      ? getArrowPosition(
          targetRect,
          computedPos.placement,
          computedPos.left,
          computedPos.top,
          tooltipHeight
        )
      : null;

  return (
    <>
      {/* Spotlight overlay highlighting the target element */}
      {targetRect && (
        <div
          className={styles.spotlight}
          style={{
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
          }}
          aria-hidden="true"
        />
      )}

      {/* Directional arrow */}
      {arrowPos && arrowClassName && (
        <div
          className={mergeClasses(styles.arrow, arrowClassName)}
          style={{ top: arrowPos.top, left: arrowPos.left }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip panel */}
      <div
        ref={tooltipRef}
        className={styles.tooltipPanel}
        style={
          computedPos
            ? { top: computedPos.top, left: computedPos.left }
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
        role="dialog"
        aria-label={`Step ${currentStep} of ${totalSteps}: ${annotation.title}`}
        aria-modal="false"
      >
        {/* Header */}
        <div className={styles.tooltipHeader}>
          <div className={styles.headerLeft}>
            <Badge appearance="filled" color="brand" size="small">
              {currentStep}
            </Badge>
            <Text
              size={300}
              weight="semibold"
              truncate
              wrap={false}
              title={annotation.title}
            >
              {annotation.title || `Step ${currentStep}`}
            </Text>
          </div>
          {onDismiss && (
            <Button
              appearance="subtle"
              size="small"
              icon={<Dismiss24Regular />}
              onClick={onDismiss}
              aria-label="Dismiss walkthrough"
            />
          )}
        </div>

        {/* Body with Markdown content */}
        <div className={styles.tooltipBody}>
          <div className={styles.markdownContent}>
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </div>

          {/* Detail section */}
          {annotation.detail_text && (
            <div className={styles.detailSection}>
              <div className={styles.detailHeader}>
                <Info24Regular
                  style={{ fontSize: "14px", width: "14px", height: "14px" }}
                />
                <Text size={100} weight="semibold">
                  More Detail
                </Text>
              </div>
              <div className={styles.markdownContent}>
                <ReactMarkdown>{annotation.detail_text}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Tips */}
          {annotation.tips && annotation.tips.length > 0 && (
            <div className={styles.tipsSection}>
              <Divider />
              {annotation.tips.map((tip, idx) => (
                <div key={idx} className={styles.tipItem}>
                  <Lightbulb24Regular
                    className={styles.tipIcon}
                    style={{ fontSize: "14px", width: "14px", height: "14px" }}
                  />
                  <Text size={100}>{tip}</Text>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className={styles.tooltipFooter}>
          <Text size={100} className={styles.stepCounter}>
            {currentStep} / {totalSteps}
          </Text>
          <div className={styles.footerButtons}>
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowLeft24Regular />}
              disabled={isFirst}
              onClick={onPrev}
              aria-label="Previous step"
            >
              Back
            </Button>
            <Button
              appearance="primary"
              size="small"
              icon={<ArrowRight24Regular />}
              iconPosition="after"
              onClick={onNext}
              aria-label={isLast ? "Finish walkthrough" : "Next step"}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helper: Build Markdown string from annotation ───────────────────────

function buildMarkdownContent(annotation: TrainingAnnotation): string {
  const parts: string[] = [];

  if (annotation.instruction) {
    parts.push(annotation.instruction);
  }

  if (annotation.tooltip_text) {
    parts.push(`> ${annotation.tooltip_text}`);
  }

  return parts.join("\n\n");
}
