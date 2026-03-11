"use client";

/**
 * useBrandConfig — Resolves brand settings for the walkthrough renderer.
 *
 * Prefers the `brand` snapshot embedded in the pipeline result (via
 * AppTrainingContent). Falls back to fetching from the brand settings API
 * or to D365 defaults if neither is available.
 *
 * This hook ensures the D365 shell components always receive valid brand
 * colours regardless of whether the pipeline has completed or the consultant
 * has configured branding yet.
 */

import { useMemo, useState, useEffect } from "react";
import type { BrandConfig } from "@/types/trainingTrack";
import { DEFAULT_BRAND_CONFIG } from "@/types/trainingTrack";
import { getBrandSettings } from "@/lib/api";

interface UseBrandConfigOptions {
  /** Brand snapshot from AppTrainingContent (preferred source). */
  pipelineBrand?: BrandConfig | null;
  /** Project ID — used to fetch live brand settings as fallback. */
  projectId?: string | null;
}

interface UseBrandConfigReturn {
  /** Resolved brand configuration. Always non-null. */
  brand: BrandConfig;
  /** Whether the brand is still loading from the API fallback. */
  loading: boolean;
}

export function useBrandConfig({
  pipelineBrand,
  projectId,
}: UseBrandConfigOptions): UseBrandConfigReturn {
  const [apiBrand, setApiBrand] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // If pipeline brand is available, skip API fetch entirely
  const needsFetch = !pipelineBrand && !!projectId;

  useEffect(() => {
    if (!needsFetch || !projectId) return;

    let cancelled = false;
    setLoading(true);

    async function fetchBrand() {
      try {
        const settings = await getBrandSettings(projectId!);
        if (!cancelled) {
          setApiBrand({
            primary_color: settings.primary_color || "#0078D4",
            secondary_color: settings.secondary_color || "#106EBE",
            accent_color: settings.accent_color || "#005A9E",
            header_text_color: settings.header_text_color || "#FFFFFF",
            background_color: settings.background_color || "#F3F2F1",
            logo_url: settings.logo_url ?? null,
          });
        }
      } catch {
        // Fall back to defaults on error
        if (!cancelled) {
          setApiBrand(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBrand();
    return () => {
      cancelled = true;
    };
  }, [needsFetch, projectId]);

  const brand = useMemo<BrandConfig>(() => {
    // Priority: pipeline snapshot > live API > defaults
    if (pipelineBrand) return pipelineBrand;
    if (apiBrand) return apiBrand;
    return DEFAULT_BRAND_CONFIG;
  }, [pipelineBrand, apiBrand]);

  return { brand, loading };
}
