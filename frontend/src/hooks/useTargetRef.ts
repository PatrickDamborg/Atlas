"use client";

import { useRef, useEffect } from "react";
import { useOptionalTargetRefRegistry } from "@/contexts/TargetRefRegistry";

/**
 * Hook that registers a DOM element ref in the TargetRefRegistry.
 *
 * Use this in D365 renderer components to make elements discoverable
 * by the CoachMark overlay without expensive DOM queries.
 *
 * @param elementId - The data-element-id value for this element
 * @returns A ref to attach to the target element
 *
 * @example
 * ```tsx
 * function MyField({ elementId }) {
 *   const ref = useTargetRef(elementId);
 *   return <div ref={ref} data-element-id={elementId}>...</div>;
 * }
 * ```
 */
export function useTargetRef<T extends HTMLElement = HTMLElement>(
  elementId: string | undefined | null
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const registry = useOptionalTargetRefRegistry();

  useEffect(() => {
    if (!elementId || !registry) return;

    // Register the ref when the element mounts
    registry.register(elementId, ref as React.RefObject<HTMLElement | null>);

    return () => {
      registry.unregister(elementId);
    };
  }, [elementId, registry]);

  return ref;
}
