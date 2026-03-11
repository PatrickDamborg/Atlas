"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
  type ReactNode,
  type RefObject,
  type CSSProperties,
} from "react";
import { makeStyles, tokens } from "@fluentui/react-components";

// ── Types ────────────────────────────────────────────────────────────

export interface CoachMarkRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type CoachMarkTarget =
  | { kind: "selector"; value: string }
  | { kind: "ref"; value: RefObject<HTMLElement | null> }
  | { kind: "rect"; value: CoachMarkRect };

export interface CoachMarkProps {
  /** The element to highlight. Pass a CSS selector string, a React ref, or a manual rect. */
  target: CoachMarkTarget | string;
  /** Whether the overlay is visible */
  active?: boolean;
  /** Padding (px) around the target element cutout */
  padding?: number;
  /** Border-radius (px) for the cutout */
  borderRadius?: number;
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number;
  /** Callback when the backdrop (outside the cutout) is clicked */
  onBackdropClick?: () => void;
  /** Optional children rendered adjacent to the cutout (e.g. tooltip / annotation) */
  children?: ReactNode;
  /** z-index for the overlay layer */
  zIndex?: number;
}

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "auto",
  },
  childrenWrapper: {
    position: "fixed",
    pointerEvents: "auto",
  },
  cutoutHighlight: {
    position: "fixed",
    pointerEvents: "none",
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────

function resolveTarget(target: CoachMarkTarget | string): CoachMarkTarget {
  if (typeof target === "string") {
    return { kind: "selector", value: target };
  }
  return target;
}

function getTargetRect(target: CoachMarkTarget): CoachMarkRect | null {
  switch (target.kind) {
    case "selector": {
      const el = document.querySelector(target.value);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    }
    case "ref": {
      const el = target.value.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    }
    case "rect":
      return target.value;
  }
}

// ── Component ────────────────────────────────────────────────────────

export function CoachMark({
  target,
  active = true,
  padding = 4,
  borderRadius = 4,
  backdropOpacity = 0.5,
  onBackdropClick,
  children,
  zIndex = 10000,
}: CoachMarkProps) {
  const styles = useStyles();
  const [rect, setRect] = useState<CoachMarkRect | null>(null);
  const rafRef = useRef<number>(0);
  const reactId = useId();
  const maskId = `coachmark-mask-${reactId.replace(/:/g, "")}`;

  const resolved = resolveTarget(target);

  // Measure target element on every animation frame while active so the
  // cutout stays aligned even if the page scrolls or resizes.
  const measure = useCallback(() => {
    const measured = getTargetRect(resolved);
    setRect((prev) => {
      if (!prev && !measured) return prev;
      if (
        prev &&
        measured &&
        prev.top === measured.top &&
        prev.left === measured.left &&
        prev.width === measured.width &&
        prev.height === measured.height
      ) {
        return prev; // no change – avoid re-render
      }
      return measured;
    });
  }, [resolved]);

  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }

    // Initial measure
    measure();

    // Re-measure on scroll / resize
    const handleUpdate = () => measure();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true); // capture phase for nested scrolls

    // Also poll via rAF to catch layout shifts / animations
    let running = true;
    const loop = () => {
      if (!running) return;
      measure();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, target]);

  if (!active || !rect) return null;

  // Padded cutout rect
  const cutout = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  // Build an SVG mask: full-viewport dark rect with a transparent rounded-rect cutout
  const svgStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex,
    pointerEvents: "none",
  };

  return (
    <>
      {/* SVG backdrop with cutout */}
      <svg
        style={svgStyle}
        data-testid="coachmark-backdrop"
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            {/* White = visible (the dark overlay) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black = transparent (the cutout hole) */}
            <rect
              x={cutout.left}
              y={cutout.top}
              width={cutout.width}
              height={cutout.height}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`rgba(0,0,0,${backdropOpacity})`}
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Invisible click-catcher for the backdrop area */}
      {onBackdropClick && (
        <div
          className={styles.overlay}
          style={{ zIndex: zIndex + 1 }}
          onClick={onBackdropClick}
          data-testid="coachmark-click-catcher"
          aria-hidden
        />
      )}

      {/* Highlight border around cutout */}
      <div
        className={styles.cutoutHighlight}
        data-testid="coachmark-highlight"
        style={{
          top: cutout.top,
          left: cutout.left,
          width: cutout.width,
          height: cutout.height,
          borderRadius,
          zIndex: zIndex + 2,
        }}
      />

      {/* Children (tooltip / annotation panel) rendered next to the cutout */}
      {children && (
        <div
          className={styles.childrenWrapper}
          data-testid="coachmark-children"
          style={{
            top: cutout.top + cutout.height + 8,
            left: cutout.left,
            zIndex: zIndex + 3,
          }}
        >
          {children}
        </div>
      )}
    </>
  );
}
