"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Checkbox,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRight24Regular,
  Warning24Regular,
  SelectAllOn24Regular,
} from "@fluentui/react-icons";
import { AppCard } from "./AppCard";
import { getDiscoveredApps, selectApps, ApiError } from "@/lib/api";
import type { DiscoveredApp, AppSelectionResponse } from "@/types/appModule";

const useStyles = makeStyles({
  panel: {
    padding: tokens.spacingHorizontalXXL,
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalL,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  solutionBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalL,
  },
  warningList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalL,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  selectionSummary: {
    color: tokens.colorNeutralForeground2,
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacingVerticalXXXL,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXXL,
    textAlign: "center",
  },
  emptyIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: "48px",
    width: "48px",
    height: "48px",
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalM,
  },
});

interface AppSelectionPanelProps {
  projectId: string;
  /** Callback when the consultant confirms their app selection. */
  onSelectionConfirmed?: (selection: AppSelectionResponse) => void;
}

export function AppSelectionPanel({
  projectId,
  onSelectionConfirmed,
}: AppSelectionPanelProps) {
  const styles = useStyles();

  // Data state
  const [apps, setApps] = useState<DiscoveredApp[]>([]);
  const [solutionName, setSolutionName] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedAppNames, setSelectedAppNames] = useState<Set<string>>(
    new Set()
  );

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load discovered apps ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDiscoveredApps(projectId)
      .then((data) => {
        if (cancelled) return;
        setApps(data.apps);
        setSolutionName(data.solution_display_name);
        setWarnings(data.warnings);

        // Auto-select if only one app is available
        if (data.apps.length === 1) {
          setSelectedAppNames(new Set([data.apps[0].app_unique_name]));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to load discovered apps";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ── Handle selection toggle (multi-select) ──────────────────────────
  const handleToggle = useCallback((appUniqueName: string) => {
    setSelectedAppNames((current) => {
      const next = new Set(current);
      if (next.has(appUniqueName)) {
        next.delete(appUniqueName);
      } else {
        next.add(appUniqueName);
      }
      return next;
    });
  }, []);

  // ── Select / deselect all ───────────────────────────────────────────
  const handleSelectAll = useCallback(() => {
    setSelectedAppNames((current) => {
      if (current.size === apps.length) {
        // All selected → deselect all
        return new Set();
      }
      return new Set(apps.map((a) => a.app_unique_name));
    });
  }, [apps]);

  // ── Confirm selection ──────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (selectedAppNames.size === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await selectApps(projectId, {
        app_unique_names: Array.from(selectedAppNames),
      });
      onSelectionConfirmed?.(response);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to save app selection";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [projectId, selectedAppNames, onSelectionConfirmed]);

  // ── Derived data ───────────────────────────────────────────────────
  const selectedApps = useMemo(
    () => apps.filter((a) => selectedAppNames.has(a.app_unique_name)),
    [apps, selectedAppNames]
  );

  const totalTables = useMemo(
    () => selectedApps.reduce((sum, a) => sum + a.entity_count, 0),
    [selectedApps]
  );

  const allSelected = apps.length > 0 && selectedAppNames.size === apps.length;

  // ── Selection summary text ─────────────────────────────────────────
  const summaryText = useMemo(() => {
    if (selectedAppNames.size === 0) return "No apps selected";
    const appNames = selectedApps
      .map((a) => a.display_name || a.app_unique_name)
      .join(", ");
    return `${selectedAppNames.size} app${selectedAppNames.size > 1 ? "s" : ""} selected (${totalTables} table${totalTables !== 1 ? "s" : ""}): ${appNames}`;
  }, [selectedAppNames, selectedApps, totalTables]);

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner label="Discovering model-driven apps..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {/* Error bar */}
      {error && (
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Page header */}
      <div className={styles.pageHeader}>
        <Text size={800} weight="bold">
          Select Model-Driven Apps
        </Text>
        <Text size={300} className={styles.subtitle}>
          Choose one or more apps to generate training materials for.
          Each selected app&apos;s tables, forms, views, and business rules will
          be used to build the walkthrough.
        </Text>
      </div>

      {/* Solution context */}
      {solutionName && (
        <div className={styles.solutionBadge}>
          <Text size={200} weight="semibold">
            Solution:
          </Text>
          <Text size={200}>{solutionName}</Text>
        </div>
      )}

      {/* Warnings from parser */}
      {warnings.length > 0 && (
        <div className={styles.warningList}>
          {warnings.map((warning, idx) => (
            <MessageBar key={idx} intent="warning">
              <MessageBarBody>
                <MessageBarTitle>Warning</MessageBarTitle>
                {warning}
              </MessageBarBody>
            </MessageBar>
          ))}
        </div>
      )}

      {/* App cards or empty state */}
      {apps.length === 0 ? (
        <div className={styles.emptyState}>
          <Warning24Regular className={styles.emptyIcon} />
          <Text size={500} weight="semibold">
            No Model-Driven Apps Found
          </Text>
          <Text size={300} className={styles.subtitle}>
            The uploaded solution does not contain any model-driven app modules.
            Please upload a solution that includes at least one AppModule
            component.
          </Text>
        </div>
      ) : (
        <>
          {/* Select all toolbar (shown when more than 1 app) */}
          {apps.length > 1 && (
            <div className={styles.toolbar}>
              <Checkbox
                checked={
                  allSelected
                    ? true
                    : selectedAppNames.size > 0
                      ? "mixed"
                      : false
                }
                onChange={handleSelectAll}
                label={allSelected ? "Deselect all" : "Select all"}
              />
            </div>
          )}

          <div
            className={styles.cardGrid}
            role="listbox"
            aria-label="Available model-driven apps"
            aria-multiselectable="true"
          >
            {apps.map((app) => (
              <AppCard
                key={app.app_unique_name}
                app={app}
                isSelected={selectedAppNames.has(app.app_unique_name)}
                onSelect={handleToggle}
              />
            ))}
          </div>

          {/* Footer with confirm action */}
          <div className={styles.footer}>
            <Text size={300} className={styles.selectionSummary}>
              {summaryText}
            </Text>
            <Button
              appearance="primary"
              size="large"
              icon={<ArrowRight24Regular />}
              iconPosition="after"
              disabled={selectedAppNames.size === 0 || submitting}
              onClick={handleConfirm}
            >
              {submitting
                ? "Saving..."
                : `Confirm Selection (${selectedAppNames.size})`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
