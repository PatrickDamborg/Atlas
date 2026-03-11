"use client";

import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  AppsListDetail24Regular,
  Table24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import type { DiscoveredApp } from "@/types/appModule";

const useStyles = makeStyles({
  card: {
    width: "100%",
    maxWidth: "400px",
    cursor: "pointer",
    transitionProperty: "box-shadow, border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-in-out",
    ...shorthands.border("2px", "solid", "transparent"),
    "&:hover": {
      boxShadow: tokens.shadow8,
    },
  },
  cardSelected: {
    ...shorthands.border("2px", "solid", tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow8,
  },
  cardPreview: {
    backgroundColor: tokens.colorNeutralBackground3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "80px",
    position: "relative",
  },
  cardPreviewSelected: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  appIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "40px",
    width: "40px",
    height: "40px",
  },
  selectedBadge: {
    position: "absolute",
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
  },
  headerAction: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "2.6em",
  },
  entitySection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  entityHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalXXS,
  },
  entityList: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  entityBadge: {
    fontSize: tokens.fontSizeBase100,
  },
  moreEntities: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  sitemapInfo: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
  },
});

interface AppCardProps {
  app: DiscoveredApp;
  isSelected: boolean;
  onSelect: (appUniqueName: string) => void;
}

/** Maximum number of entity badges to display before showing "+N more". */
const MAX_VISIBLE_ENTITIES = 8;

export function AppCard({ app, isSelected, onSelect }: AppCardProps) {
  const styles = useStyles();

  const visibleEntities = app.entities.slice(0, MAX_VISIBLE_ENTITIES);
  const remainingCount = app.entities.length - MAX_VISIBLE_ENTITIES;
  const areaCount = app.sitemap_areas.length;

  return (
    <Card
      className={mergeClasses(styles.card, isSelected && styles.cardSelected)}
      onClick={() => onSelect(app.app_unique_name)}
      role="option"
      aria-selected={isSelected}
    >
      <CardPreview
        className={mergeClasses(
          styles.cardPreview,
          isSelected && styles.cardPreviewSelected
        )}
      >
        <AppsListDetail24Regular className={styles.appIcon} />
        {isSelected && (
          <Badge
            appearance="filled"
            color="brand"
            className={styles.selectedBadge}
            icon={<Checkmark24Regular />}
          >
            Selected
          </Badge>
        )}
      </CardPreview>

      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            {app.display_name || app.app_unique_name}
          </Text>
        }
        action={
          <div className={styles.headerAction}>
            <Badge appearance="outline" color="informative" size="small">
              {app.entity_count} {app.entity_count === 1 ? "table" : "tables"}
            </Badge>
          </div>
        }
        description={
          <Text className={styles.description} size={200}>
            {app.description || "No description available for this app module."}
          </Text>
        }
      />

      {/* Entity badges */}
      {app.entities.length > 0 && (
        <div className={styles.entitySection}>
          <div className={styles.entityHeader}>
            <Table24Regular style={{ fontSize: "16px" }} />
            <Text size={200} weight="semibold">
              Tables
            </Text>
          </div>
          <div className={styles.entityList}>
            {visibleEntities.map((entity) => (
              <Tooltip
                key={entity.logical_name}
                content={entity.logical_name}
                relationship="label"
              >
                <Badge
                  appearance="tint"
                  color={entity.is_custom_entity ? "brand" : "subtle"}
                  size="small"
                  className={styles.entityBadge}
                >
                  {entity.display_name || entity.logical_name}
                </Badge>
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Text className={styles.moreEntities}>
                +{remainingCount} more
              </Text>
            )}
          </div>
        </div>
      )}

      {/* Sitemap areas */}
      {areaCount > 0 && (
        <div className={styles.sitemapInfo}>
          <Text size={200}>
            {areaCount} sitemap {areaCount === 1 ? "area" : "areas"}
          </Text>
        </div>
      )}
    </Card>
  );
}
