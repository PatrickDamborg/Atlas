/**
 * Type definitions for brand settings and logo upload.
 */

export interface BrandSettings {
  id?: string;
  project_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text_color: string;
  background_color: string;
  is_default?: boolean;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BrandSettingsUpdate {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  header_text_color?: string | null;
  background_color?: string | null;
}

export interface LogoUploadResponse {
  logo_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
}

export interface LogoDeleteResponse {
  message: string;
}

/** Validation constraints for logo uploads. */
export const LOGO_CONSTRAINTS = {
  /** Max file size in bytes (2 MB). */
  maxSizeBytes: 2 * 1024 * 1024,
  /** Max file size as human-readable string. */
  maxSizeLabel: "2 MB",
  /** Accepted MIME types. */
  acceptedTypes: [
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "image/webp",
  ] as const,
  /** Accepted file extensions. */
  acceptedExtensions: [".png", ".jpg", ".jpeg", ".svg", ".webp"] as const,
  /** Accept string for file input. */
  acceptString: "image/png,image/jpeg,image/svg+xml,image/webp",
} as const;
