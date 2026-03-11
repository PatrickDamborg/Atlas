/**
 * useLogoUpload — Hook that wires the LogoUpload component to the API.
 *
 * Manages the current logo URL state and provides upload/delete callbacks
 * that call the backend endpoints and update state accordingly.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { uploadLogo, deleteLogo, getBrandSettings } from "@/lib/api";

interface UseLogoUploadOptions {
  projectId: string;
}

interface UseLogoUploadReturn {
  /** The current logo URL, or null if no logo is set. */
  logoUrl: string | null;
  /** Whether the initial brand settings are still loading. */
  isLoading: boolean;
  /** Upload a file and return the new logo URL. */
  handleUpload: (file: File) => Promise<string>;
  /** Delete the current logo. */
  handleDelete: () => Promise<void>;
  /** Called after a successful upload to update local state. */
  setLogoUrl: (url: string | null) => void;
}

export function useLogoUpload({
  projectId,
}: UseLogoUploadOptions): UseLogoUploadReturn {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current brand settings on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchBrand() {
      try {
        const settings = await getBrandSettings(projectId);
        if (!cancelled) {
          setLogoUrl(settings.logo_url ?? null);
        }
      } catch {
        // If brand settings don't exist yet, that's fine — no logo
        if (!cancelled) {
          setLogoUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchBrand();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleUpload = useCallback(
    async (file: File): Promise<string> => {
      const result = await uploadLogo(projectId, file);
      setLogoUrl(result.logo_url);
      return result.logo_url;
    },
    [projectId]
  );

  const handleDelete = useCallback(async () => {
    await deleteLogo(projectId);
    setLogoUrl(null);
  }, [projectId]);

  return {
    logoUrl,
    isLoading,
    handleUpload,
    handleDelete,
    setLogoUrl,
  };
}
