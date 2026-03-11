/**
 * LogoUpload — Drag-and-drop logo upload component with image preview.
 *
 * Features:
 * - Drag & drop or click to select file
 * - Client-side validation (file type, size)
 * - Image preview after selection (before upload)
 * - Upload progress indication
 * - Replace existing logo
 * - Delete uploaded logo
 * - Error messages via Fluent UI MessageBar
 *
 * Uses Microsoft Fluent UI React components throughout.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Button,
  Caption1,
  Card,
  CardHeader,
  Image,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Subtitle2,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowUploadRegular,
  DeleteRegular,
  ImageRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { LOGO_CONSTRAINTS } from "@/types/brand";

// ── Styles ───────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    width: "100%",
    maxWidth: "480px",
  },
  dropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalS,
    minHeight: "160px",
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("2px", "dashed", tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: "pointer",
    transitionDuration: tokens.durationNormal,
    transitionProperty: "border-color, background-color",
    "&:hover": {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  dropZoneActive: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderStyle("solid"),
  },
  dropZoneDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
    "&:hover": {
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  hiddenInput: {
    display: "none",
  },
  previewContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  previewImage: {
    maxWidth: "200px",
    maxHeight: "80px",
    objectFit: "contain",
  },
  previewActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  fileMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXS,
  },
  uploadIcon: {
    fontSize: "32px",
    color: tokens.colorNeutralForeground3,
  },
  currentLogo: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
  },
  currentLogoImage: {
    maxWidth: "120px",
    maxHeight: "48px",
    objectFit: "contain",
  },
  currentLogoInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    flexGrow: 1,
  },
});

// ── Types ────────────────────────────────────────────────────────────

export interface LogoUploadProps {
  /** The current logo URL (if one is already uploaded). */
  currentLogoUrl?: string | null;
  /** Called when upload completes successfully. */
  onUploadComplete: (logoUrl: string) => void;
  /** Called when the logo is deleted. */
  onDelete: () => void;
  /** Whether the component is disabled. */
  disabled?: boolean;
  /** Whether an upload or delete is in progress (external control). */
  loading?: boolean;
  /** Callback to perform the actual upload. Returns the new logo URL. */
  onUpload: (file: File) => Promise<string>;
  /** Callback to perform the actual delete. */
  onDeleteRequest: () => Promise<void>;
}

// ── Validation ───────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > LOGO_CONSTRAINTS.maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum size is ${LOGO_CONSTRAINTS.maxSizeLabel}.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }

  // Check MIME type
  const allowedTypes: readonly string[] = LOGO_CONSTRAINTS.acceptedTypes;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type || "unknown"}" is not supported. Accepted: PNG, JPEG, SVG, WebP.`,
    };
  }

  // Check extension
  const ext = file.name.toLowerCase().split(".").pop();
  const allowedExts = LOGO_CONSTRAINTS.acceptedExtensions.map((e) =>
    e.replace(".", "")
  );
  if (ext && !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `File extension ".${ext}" is not supported. Accepted: ${LOGO_CONSTRAINTS.acceptedExtensions.join(", ")}.`,
    };
  }

  return { valid: true };
}

// ── Component ────────────────────────────────────────────────────────

export function LogoUpload({
  currentLogoUrl,
  onUploadComplete,
  onDelete,
  disabled = false,
  loading = false,
  onUpload,
  onDeleteRequest,
}: LogoUploadProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = disabled || loading || isUploading || isDeleting;

  // ── File selection / preview ──────────────────────────────────────

  const handleFileSelected = useCallback(
    (file: File) => {
      setError(null);

      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error!);
        return;
      }

      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPreviewFile(file);
    },
    []
  );

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    setError(null);
  }, [previewUrl]);

  // ── Upload ────────────────────────────────────────────────────────

  const handleUpload = useCallback(async () => {
    if (!previewFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const logoUrl = await onUpload(previewFile);
      clearPreview();
      onUploadComplete(logoUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [previewFile, onUpload, clearPreview, onUploadComplete]);

  // ── Delete ────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onDeleteRequest();
      onDelete();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete logo. Please try again.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteRequest, onDelete]);

  // ── Drag & drop handlers ──────────────────────────────────────────

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) setIsDragOver(true);
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) setIsDragOver(true);
    },
    [isDisabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isDisabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelected(files[0]);
      }
    },
    [isDisabled, handleFileSelected]
  );

  // ── Click to select ───────────────────────────────────────────────

  const handleClick = useCallback(() => {
    if (!isDisabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isDisabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelected(files[0]);
      }
      // Reset the input so the same file can be selected again
      e.target.value = "";
    },
    [handleFileSelected]
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      <Subtitle2>Logo</Subtitle2>

      {/* Error message */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Upload Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Current logo display */}
      {currentLogoUrl && !previewUrl && (
        <div className={styles.currentLogo}>
          <Image
            src={currentLogoUrl}
            alt="Current project logo"
            className={styles.currentLogoImage}
          />
          <div className={styles.currentLogoInfo}>
            <Text size={200} weight="semibold">
              Current logo
            </Text>
            <Caption1>Click below to replace or delete</Caption1>
          </div>
          <Button
            appearance="subtle"
            icon={<DeleteRegular />}
            onClick={handleDelete}
            disabled={isDisabled}
            title="Delete logo"
          >
            {isDeleting ? <Spinner size="tiny" /> : "Delete"}
          </Button>
        </div>
      )}

      {/* Preview of selected file (before upload) */}
      {previewUrl && previewFile && (
        <div className={styles.previewContainer}>
          <Image
            src={previewUrl}
            alt="Logo preview"
            className={styles.previewImage}
          />
          <div className={styles.fileMeta}>
            <Text size={200} weight="semibold">
              {previewFile.name}
            </Text>
            <Caption1>
              {(previewFile.size / 1024).toFixed(1)} KB
            </Caption1>
          </div>
          <div className={styles.previewActions}>
            <Button
              appearance="primary"
              icon={isUploading ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={clearPreview}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!previewUrl && (
        <>
          <div
            className={mergeClasses(
              styles.dropZone,
              isDragOver && styles.dropZoneActive,
              isDisabled && styles.dropZoneDisabled
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
            aria-label="Upload logo. Drag and drop an image or click to select."
            aria-disabled={isDisabled}
          >
            {isDragOver ? (
              <>
                <ImageRegular className={styles.uploadIcon} />
                <Text size={300} weight="semibold">
                  Drop your logo here
                </Text>
              </>
            ) : (
              <>
                <ArrowUploadRegular className={styles.uploadIcon} />
                <Text size={300} weight="semibold">
                  {currentLogoUrl ? "Replace logo" : "Upload logo"}
                </Text>
                <Caption1>
                  Drag & drop or click to select. PNG, JPEG, SVG, or WebP up to{" "}
                  {LOGO_CONSTRAINTS.maxSizeLabel}.
                </Caption1>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={LOGO_CONSTRAINTS.acceptString}
            className={styles.hiddenInput}
            onChange={handleInputChange}
            disabled={isDisabled}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
