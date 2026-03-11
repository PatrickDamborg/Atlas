"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
  type RefObject,
} from "react";

// ── Types ────────────────────────────────────────────────────────────

export interface TargetRefEntry {
  /** The element ref */
  ref: RefObject<HTMLElement | null>;
  /** The element's bounding rect (cached, updated on recompute) */
  rect: DOMRect | null;
}

export interface TargetRefRegistryValue {
  /** Register a target element ref by element ID */
  register: (elementId: string, ref: RefObject<HTMLElement | null>) => void;
  /** Unregister a target element ref */
  unregister: (elementId: string) => void;
  /** Get the ref for a given element ID */
  getRef: (elementId: string) => RefObject<HTMLElement | null> | null;
  /** Get the current DOM element for a given element ID */
  getElement: (elementId: string) => HTMLElement | null;
  /** Get cached bounding rect, recomputing if stale */
  getRect: (elementId: string) => DOMRect | null;
  /** Force recompute all cached rects (call on scroll/resize) */
  recomputeAll: () => void;
  /** Number of registered refs */
  size: number;
}

// ── Context ──────────────────────────────────────────────────────────

const TargetRefRegistryContext = createContext<TargetRefRegistryValue | null>(null);
TargetRefRegistryContext.displayName = "TargetRefRegistry";

// ── Provider ─────────────────────────────────────────────────────────

interface TargetRefRegistryProviderProps {
  children: ReactNode;
}

/**
 * TargetRefRegistryProvider maintains a map of element IDs → React refs.
 *
 * D365 renderer components register their refs here via `data-element-id`,
 * and the CoachMark overlay looks them up to position highlights without
 * needing expensive DOM queries.
 */
export function TargetRefRegistryProvider({ children }: TargetRefRegistryProviderProps) {
  // Use a mutable ref map so updates don't trigger re-renders
  const registryRef = useRef<Map<string, RefObject<HTMLElement | null>>>(new Map());
  const rectCacheRef = useRef<Map<string, DOMRect>>(new Map());
  const sizeRef = useRef(0);

  const register = useCallback(
    (elementId: string, ref: RefObject<HTMLElement | null>) => {
      registryRef.current.set(elementId, ref);
      sizeRef.current = registryRef.current.size;
      // Eagerly cache rect
      if (ref.current) {
        rectCacheRef.current.set(elementId, ref.current.getBoundingClientRect());
      }
    },
    []
  );

  const unregister = useCallback((elementId: string) => {
    registryRef.current.delete(elementId);
    rectCacheRef.current.delete(elementId);
    sizeRef.current = registryRef.current.size;
  }, []);

  const getRef = useCallback(
    (elementId: string): RefObject<HTMLElement | null> | null => {
      return registryRef.current.get(elementId) ?? null;
    },
    []
  );

  const getElement = useCallback(
    (elementId: string): HTMLElement | null => {
      const ref = registryRef.current.get(elementId);
      return ref?.current ?? null;
    },
    []
  );

  const getRect = useCallback(
    (elementId: string): DOMRect | null => {
      // Try cached rect first
      const cached = rectCacheRef.current.get(elementId);
      if (cached) return cached;

      // Recompute from DOM
      const el = registryRef.current.get(elementId)?.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      rectCacheRef.current.set(elementId, rect);
      return rect;
    },
    []
  );

  const recomputeAll = useCallback(() => {
    rectCacheRef.current.clear();
    for (const [id, ref] of registryRef.current) {
      if (ref.current) {
        rectCacheRef.current.set(id, ref.current.getBoundingClientRect());
      }
    }
  }, []);

  const value: TargetRefRegistryValue = useMemo(
    () => ({
      register,
      unregister,
      getRef,
      getElement,
      getRect,
      recomputeAll,
      get size() {
        return sizeRef.current;
      },
    }),
    [register, unregister, getRef, getElement, getRect, recomputeAll]
  );

  return (
    <TargetRefRegistryContext.Provider value={value}>
      {children}
    </TargetRefRegistryContext.Provider>
  );
}

// ── Consumer hook ────────────────────────────────────────────────────

/**
 * Hook to access the target ref registry.
 *
 * Must be used within a <TargetRefRegistryProvider>.
 */
export function useTargetRefRegistry(): TargetRefRegistryValue {
  const context = useContext(TargetRefRegistryContext);
  if (!context) {
    throw new Error(
      "useTargetRefRegistry must be used within a <TargetRefRegistryProvider>. " +
        "Wrap your walkthrough tree with <TargetRefRegistryProvider>."
    );
  }
  return context;
}

/**
 * Optional hook that returns null when outside the provider.
 * Useful for components that may or may not be inside a walkthrough context.
 */
export function useOptionalTargetRefRegistry(): TargetRefRegistryValue | null {
  return useContext(TargetRefRegistryContext);
}
