"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";
import {
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
  shorthands,
  Badge,
  Card,
  CardHeader,
} from "@fluentui/react-components";
import {
  ArrowUpload24Regular,
  DocumentFolder24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { uploadSolution, ApiError } from "@/lib/api";
import type { UploadSolutionResponse } from "@/types/upload";

/** Maximum file size in bytes (100 MB). */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Accepted file extension. */
const ACCEPTED_EXTENSION = ".zip";

/** Accepted MIME types for ZIP files. */
const ACCEPTED_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "application/octet-stream",
]);

const useStyles = makeStyles({
  panel: {
    padding: tokens.spacingHorizontalXXL,
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalL,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  dropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXXL,
    ...shorthands.border("2px", "dashed", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: "pointer",
    transitionProperty: "border-color, background-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    textAlign: "center",
  },
  dropZoneActive: {
    ...shorthands.border("2px", "dashed", tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },
  dropZoneDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
  },
  dropIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: "48px",
    width: "48px",
    height: "48px",
  },
  dropIconActive: {
    color: tokens.colorBrandForeground1,
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM,
  },
  fileDetails: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
  },
  fileName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removeButton: {
    flexShrink: 0,
  },
  uploadActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  errorBar: {
    marginTop: tokens.spacingVerticalM,
  },
  successCard: {
    marginTop: tokens.spacingVerticalL,
  },
  successHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
  },
  metadataLabel: {
    color: tokens.colorNeutralForeground3,
  },
  warningList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalM,
  },
  statsRow: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
  },
  hiddenInput: {
    display: "none",
  },
  spinnerOverlay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXXL,
  },
});

interface SolutionUploadPanelProps {
  /** Callback when the upload is complete and a project has been created. */
  onUploadComplete?: (response: UploadSolutionResponse) => void;
}

export function SolutionUploadPanel({
  onUploadComplete,
}: SolutionUploadPanelProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadSolutionResponse | null>(null);

  // ── Validation ────────────────────────────────────────────────────
  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION)) {
      return `File must be a ${ACCEPTED_EXTENSION} file. Received: ${file.name}`;
    }
    if (file.size === 0) {
      return "File is empty. Please select a valid Dataverse solution ZIP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      return `File size (${sizeMB} MB) exceeds the maximum of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`;
    }
    return null;
  }, []);

  // ── File selection ────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);
      setValidationError(null);
      setResult(null);

      const vError = validateFile(file);
      if (vError) {
        setValidationError(vError);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input value so same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    setError(null);
  }, []);

  // ── Drag & drop ──────────────────────────────────────────────────
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!uploading) setIsDragOver(true);
    },
    [uploading]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (uploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [uploading, handleFileSelect]
  );

  const handleDropZoneClick = useCallback(() => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }, [uploading]);

  // ── Upload ────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadSolution(selectedFile);
      setResult(response);
      onUploadComplete?.(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during upload. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFile, onUploadComplete]);

  // ── Format helpers ────────────────────────────────────────────────
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Upload in progress ────────────────────────────────────────────
  if (uploading) {
    return (
      <div className={styles.panel}>
        <div className={styles.spinnerOverlay}>
          <Spinner size="large" label="Uploading and parsing solution..." />
          <Text size={300} className={styles.subtitle}>
            The ZIP file is being parsed into structured data. This may take a
            moment for larger solutions.
          </Text>
        </div>
      </div>
    );
  }

  // ── Upload complete ───────────────────────────────────────────────
  if (result) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <Text size={800} weight="bold">
            Solution Uploaded
          </Text>
          <Text size={300} className={styles.subtitle}>
            Your Dataverse solution has been parsed and a project has been
            created.
          </Text>
        </div>

        <Card className={styles.successCard}>
          <CardHeader
            image={
              <CheckmarkCircle24Regular className={styles.successIcon} />
            }
            header={
              <Text weight="semibold">
                {result.solution_display_name || result.solution_unique_name}
              </Text>
            }
            description={
              <Text size={200} className={styles.subtitle}>
                Version {result.solution_version} by {result.publisher}
              </Text>
            }
          />

          <div className={styles.metadataGrid}>
            <Text size={200} className={styles.metadataLabel}>
              Unique Name
            </Text>
            <Text size={200}>{result.solution_unique_name}</Text>

            <Text size={200} className={styles.metadataLabel}>
              Project ID
            </Text>
            <Text size={200}>{result.project_id}</Text>
          </div>

          <div className={styles.statsRow}>
            <Badge appearance="outline" color="informative">
              {result.entity_count} {result.entity_count === 1 ? "entity" : "entities"}
            </Badge>
            <Badge appearance="outline" color="informative">
              {result.app_module_count} {result.app_module_count === 1 ? "app" : "apps"}
            </Badge>
          </div>
        </Card>

        {/* Parser warnings */}
        {result.warnings.length > 0 && (
          <div className={styles.warningList}>
            {result.warnings.map((warning, idx) => (
              <MessageBar key={idx} intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>Warning</MessageBarTitle>
                  {warning}
                </MessageBarBody>
              </MessageBar>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Default: file selection ───────────────────────────────────────
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text size={800} weight="bold">
          Upload Solution
        </Text>
        <Text size={300} className={styles.subtitle}>
          Upload a Dataverse solution .zip file to begin generating training
          walkthroughs. The ZIP file is parsed in memory and deleted after
          extraction — only structured data is persisted.
        </Text>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        aria-label="Select a Dataverse solution ZIP file"
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""} ${uploading ? styles.dropZoneDisabled : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleDropZoneClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleDropZoneClick();
          }
        }}
        aria-label="Drop zone for Dataverse solution ZIP file"
      >
        <ArrowUpload24Regular
          className={`${styles.dropIcon} ${isDragOver ? styles.dropIconActive : ""}`}
        />
        <Text size={400} weight="semibold">
          {isDragOver
            ? "Drop your solution file here"
            : "Drag and drop your solution ZIP file here"}
        </Text>
        <Text size={200} className={styles.subtitle}>
          or click to browse. Accepts .zip files up to 100 MB.
        </Text>
      </div>

      {/* Validation error */}
      {validationError && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>
            <MessageBarTitle>Invalid File</MessageBarTitle>
            {validationError}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Upload error */}
      {error && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>
            <MessageBarTitle>Upload Failed</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Selected file info */}
      {selectedFile && (
        <>
          <div className={styles.fileInfo}>
            <DocumentFolder24Regular />
            <div className={styles.fileDetails}>
              <Text size={300} weight="semibold" className={styles.fileName}>
                {selectedFile.name}
              </Text>
              <Text size={200} className={styles.subtitle}>
                {formatFileSize(selectedFile.size)}
              </Text>
            </div>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              size="small"
              className={styles.removeButton}
              onClick={handleRemoveFile}
              aria-label="Remove selected file"
            />
          </div>

          <div className={styles.uploadActions}>
            <Button
              appearance="primary"
              size="large"
              icon={<ArrowUpload24Regular />}
              onClick={handleUpload}
              disabled={uploading}
            >
              Upload & Parse
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
