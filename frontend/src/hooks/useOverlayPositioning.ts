"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useOptionalTargetRefRegistry } from "@/contexts/TargetRefRegistry";

// ── Types ────────────────────────────────────────────────────────────

export interface OverlayRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface OverlayPositioningOptions {
  /** The target element ID to track */
  targetElementId: string | null | undefined;
  /** Padding around the target rect (px) */
  padding?: number;
  /** Whether positioning is active */
  enabled?: boolean;
  /** Debounce interval for scroll/resize (ms). Default: 16 (~60fps) */
  debounceMs?: number;
}

export interface OverlayPositioningResult {
  /** The current measured rect of the target (with padding), or null */
  targetRect: OverlayRect | null;
  /** The raw DOM element, if found */
  targetElement: HTMLElement | null;
  /** Force an immediate position update */
  recompute: () => void;
  /** Whether the target was found in the DOM */
  isTargetFound: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────

/**
 * Hook that tracks the position of a target element for overlay positioning.
 *
 * Uses multiple strategies to stay in sync:
 * 1. TargetRefRegistry for fast ref lookup (when available)
 * 2. DOM query fallback via data-element-id
 * 3. ResizeObserver for element size changes
 * 4. Scroll listeners (capture phase) for container scrolling
 * 5. Window resize listener
 * 6. MutationObserver for DOM structure changes
 *
 * All measurements are debounced via requestAnimationFrame for performance.
 */
export function useOverlayPositioning({
  targetElementId,
  padding = 6,
  enabled = true,
  debounceMs = 16,
}: OverlayPositioningOptions): OverlayPositioningResult {
  const registry = useOptionalTargetRefRegistry();
  const [targetRect, setTargetRect] = useState<OverlayRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const lastRectRef = useRef<string>("");

  // ── Find the target element ──────────────────────────────────────
  const findTarget = useCallback((): HTMLElement | null => {
    if (!targetElementId) return null;

    // 1. Registry fast path
    if (registry) {
      const el = registry.getElement(targetElementId);
      if (el) return el;
    }

    // 2. DOM query fallback
    return (
      document.querySelector<HTMLElement>(
        `[data-element-id="${targetElementId}"]`
      ) ??
      document.querySelector<HTMLElement>(`#${CSS.escape(targetElementId)}`) ??
      null
    );
  }, [targetElementId, registry]);

  // ── Measure and update rect ──────────────────────────────────────
  const measure = useCallback(() => {
    const el = findTarget();
    setTargetElement(el);

    if (!el) {
      if (targetRect !== null) {
        setTargetRect(null);
        lastRectRef.current = "";
      }
      return;
    }

    const domRect = el.getBoundingClientRect();
    const newRect: OverlayRect = {
      top: domRect.top - padding,
      left: domRect.left - padding,
      width: domRect.width + padding * 2,
      height: domRect.height + padding * 2,
    };

    // Only update state if the rect actually changed (avoid re-renders)
    const key = `${newRect.top},${newRect.left},${newRect.width},${newRect.height}`;
    if (key !== lastRectRef.current) {
      lastRectRef.current = key;
      setTargetRect(newRect);

      // Update registry cache
      if (registry && targetElementId) {
        registry.recomputeAll();
      }
    }
  }, [findTarget, padding, registry, targetElementId, targetRect]);

  // ── RAF-debounced measure ─────────────────────────────────────────
  const scheduleMeasure = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  }, [measure]);

  // ── Explicit recompute ────────────────────────────────────────────
  const recompute = useCallback(() => {
    measure();
  }, [measure]);

  // ── Set up observers and listeners ────────────────────────────────
  useEffect(() => {
    if (!enabled || !targetElementId) {
      setTargetRect(null);
      setTargetElement(null);
      return;
    }

    // Initial measure (small delay to let DOM settle after step transitions)
    const initTimer = setTimeout(measure, 50);

    // Second measure for layout stabilization
    const settleTimer = setTimeout(measure, 200);

    // Scroll listener (capture phase to catch container scrolls)
    const handleScroll = () => scheduleMeasure();
    window.addEventListener("scroll", handleScroll, true);

    // Resize listener
    const handleResize = () => scheduleMeasure();
    window.addEventListener("resize", handleResize);

    // ResizeObserver for the target element
    const target = findTarget();
    if (target) {
      resizeObserverRef.current = new ResizeObserver(() => {
        scheduleMeasure();
      });
      resizeObserverRef.current.observe(target);
    }

    // MutationObserver to detect when the target element appears/disappears/moves
    mutationObserverRef.current = new MutationObserver((mutations) => {
      // Only recompute if relevant changes occurred
      const hasRelevant = mutations.some(
        (m) =>
          m.type === "childList" ||
          (m.type === "attributes" &&
            (m.attributeName === "data-element-id" ||
              m.attributeName === "style" ||
              m.attributeName === "class"))
      );
      if (hasRelevant) {
        scheduleMeasure();
      }
    });
    // Observe the document body for structural changes
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-element-id", "style", "class"],
    });

    return () => {
      clearTimeout(initTimer);
      clearTimeout(settleTimer);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
    };
  }, [enabled, targetElementId, measure, scheduleMeasure, findTarget]);

  // ── Re-observe when target element changes ────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const el = findTarget();
    if (el && resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current.observe(el);
    }
  }, [targetElement, enabled, findTarget]);

  return {
    targetRect,
    targetElement,
    recompute,
    isTargetFound: targetElement !== null,
  };
}
