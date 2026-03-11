"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Badge,
  Card,
  CardHeader,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Search24Regular,
  Database24Regular,
  DocumentBulletList24Regular,
  Eye24Regular,
  Flow24Regular,
  Table24Regular,
  Dismiss24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { listEntities, ApiError } from "@/lib/api";
import type { EntityListItem, EntityListResponse } from "@/types/entity";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  container: {
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
  searchBar: {
    marginBottom: tokens.spacingVerticalL,
    maxWidth: "480px",
  },
  searchInput: {
    width: "100%",
  },
  resultsSummary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },
  entityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  entityCard: {
    cursor: "pointer",
    transitionProperty: "box-shadow",
    transitionDuration: tokens.durationNormal,
    ":hover": {
      boxShadow: tokens.shadow8,
    },
  },
  cardBody: {
    padding: tokens.spacingHorizontalM,
    paddingTop: 0,
  },
  descriptionText: {
    color: tokens.colorNeutralForeground3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: tokens.spacingVerticalS,
  },
  statsRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
  },
  statIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: "16px",
    width: "16px",
    height: "16px",
  },
  matchBadges: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
    marginTop: tokens.spacingVerticalXS,
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
  logicalName: {
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  customBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
});

// ---------------------------------------------------------------------------
// Match label mapping
// ---------------------------------------------------------------------------

const MATCH_LABELS: Record<string, string> = {
  entity_name: "Name",
  entity_description: "Description",
  field_description: "Fields",
  business_rule: "Business Rules",
  form_name: "Forms",
  view_name: "Views",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EntityDocsIndexProps {
  projectId: string;
  /** Called when a user clicks on an entity card. */
  onEntitySelect?: (entityId: string) => void;
}

export function EntityDocsIndex({
  projectId,
  onEntitySelect,
}: EntityDocsIndexProps) {
  const styles = useStyles();

  // State
  const [entities, setEntities] = useState<EntityListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch entities ─────────────────────────────────────────────────
  const fetchEntities = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listEntities(projectId, query || undefined);
        setEntities(data.entities);
        setTotalCount(data.total_count);
        setActiveQuery(query);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to load entity documentation";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    fetchEntities("");
  }, [fetchEntities]);

  // ── Debounced search ──────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const value = ev.target.value;
      setSearchQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchEntities(value);
      }, 300);
    },
    [fetchEntities]
  );

  // ── Clear search ─────────────────────────────────────────────────
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    fetchEntities("");
  }, [fetchEntities]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ── Summary text ──────────────────────────────────────────────────
  const summaryText = useMemo(() => {
    if (activeQuery) {
      return `${totalCount} ${totalCount === 1 ? "entity" : "entities"} matching "${activeQuery}"`;
    }
    return `${totalCount} ${totalCount === 1 ? "entity" : "entities"} in this solution`;
  }, [totalCount, activeQuery]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
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
          Entity Reference Documentation
        </Text>
        <Text size={300} className={styles.subtitle}>
          Browse and search all tables, fields, forms, views, and business rules
          extracted from the Dataverse solution.
        </Text>
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <Input
          className={styles.searchInput}
          placeholder="Search entities, fields, business rules..."
          value={searchQuery}
          onChange={handleSearchChange}
          contentBefore={<Search24Regular />}
          contentAfter={
            searchQuery ? (
              <Dismiss24Regular
                style={{ cursor: "pointer" }}
                onClick={handleClearSearch}
                aria-label="Clear search"
              />
            ) : undefined
          }
          aria-label="Search entity documentation"
          size="large"
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className={styles.spinnerContainer}>
          <Spinner
            label={
              activeQuery
                ? `Searching for "${activeQuery}"...`
                : "Loading entities..."
            }
            size="large"
          />
        </div>
      ) : entities.length === 0 ? (
        /* Empty state */
        <div className={styles.emptyState}>
          {activeQuery ? (
            <>
              <Search24Regular className={styles.emptyIcon} />
              <Text size={500} weight="semibold">
                No Matching Entities
              </Text>
              <Text size={300} className={styles.subtitle}>
                No entities match &quot;{activeQuery}&quot;. Try a different
                search term or clear the search to see all entities.
              </Text>
            </>
          ) : (
            <>
              <Warning24Regular className={styles.emptyIcon} />
              <Text size={500} weight="semibold">
                No Entities Found
              </Text>
              <Text size={300} className={styles.subtitle}>
                This solution does not contain any entity data yet.
                Run the AI pipeline first to generate documentation.
              </Text>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Results summary */}
          <div className={styles.resultsSummary}>
            <Text size={300} className={styles.subtitle}>
              {summaryText}
            </Text>
          </div>

          {/* Entity cards grid */}
          <div className={styles.entityGrid}>
            {entities.map((entity) => (
              <EntityCard
                key={entity.entity_id}
                entity={entity}
                hasSearchQuery={!!activeQuery}
                onClick={() => onEntitySelect?.(entity.entity_id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entity Card sub-component
// ---------------------------------------------------------------------------

interface EntityCardProps {
  entity: EntityListItem;
  hasSearchQuery: boolean;
  onClick?: () => void;
}

function EntityCard({ entity, hasSearchQuery, onClick }: EntityCardProps) {
  const styles = useStyles();

  return (
    <Card
      className={styles.entityCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`View documentation for ${entity.display_name}`}
    >
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            {entity.display_name}
            {entity.is_custom_entity && (
              <Badge
                appearance="outline"
                size="small"
                color="informative"
                className={styles.customBadge}
              >
                Custom
              </Badge>
            )}
          </Text>
        }
        description={
          <Text className={styles.logicalName}>{entity.logical_name}</Text>
        }
      />
      <div className={styles.cardBody}>
        {/* Component counts */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <Database24Regular className={styles.statIcon} />
            <Text size={200}>
              {entity.field_count} {entity.field_count === 1 ? "field" : "fields"}
            </Text>
          </div>
          <div className={styles.stat}>
            <DocumentBulletList24Regular className={styles.statIcon} />
            <Text size={200}>
              {entity.form_count} {entity.form_count === 1 ? "form" : "forms"}
            </Text>
          </div>
          <div className={styles.stat}>
            <Eye24Regular className={styles.statIcon} />
            <Text size={200}>
              {entity.view_count} {entity.view_count === 1 ? "view" : "views"}
            </Text>
          </div>
          {entity.business_rule_count > 0 && (
            <div className={styles.stat}>
              <Flow24Regular className={styles.statIcon} />
              <Text size={200}>
                {entity.business_rule_count}{" "}
                {entity.business_rule_count === 1 ? "rule" : "rules"}
              </Text>
            </div>
          )}
        </div>

        {/* Search match badges */}
        {hasSearchQuery && entity.search_match?.matched_on?.length ? (
          <div className={styles.matchBadges}>
            <Text size={100} className={styles.subtitle}>
              Matched in:
            </Text>
            {entity.search_match.matched_on.map((category) => (
              <Badge
                key={category}
                appearance="tint"
                size="small"
                color="brand"
              >
                {MATCH_LABELS[category] || category}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
