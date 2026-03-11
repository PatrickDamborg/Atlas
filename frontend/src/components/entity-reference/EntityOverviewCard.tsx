"use client";

import {
  Card,
  CardHeader,
  Text,
  Badge,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Database24Regular,
  Key24Regular,
  TextDescription24Regular,
} from "@fluentui/react-icons";
import type { EntityDetailResponse } from "@/types/entity";

const useStyles = makeStyles({
  card: {
    marginBottom: tokens.spacingVerticalL,
  },
  statsRow: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXXS,
    minWidth: "80px",
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalL}`,
    marginTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  metaLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  metaValue: {
    fontSize: tokens.fontSizeBase200,
  },
  description: {
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
  headerBadges: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    alignItems: "center",
  },
});

interface EntityOverviewCardProps {
  entity: EntityDetailResponse;
}

export function EntityOverviewCard({ entity }: EntityOverviewCardProps) {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Database24Regular />}
        header={
          <Text weight="semibold" size={500}>
            {entity.display_name || entity.logical_name}
          </Text>
        }
        description={
          <div className={styles.headerBadges}>
            <Badge
              appearance="outline"
              color={entity.is_custom_entity ? "brand" : "subtle"}
              size="small"
            >
              {entity.is_custom_entity ? "Custom" : "System"}
            </Badge>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {entity.logical_name}
            </Text>
          </div>
        }
      />

      {/* Entity Purpose / Description */}
      {entity.description && (
        <div className={styles.description}>
          <Text size={300}>{entity.description}</Text>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <Text className={styles.statValue}>{entity.field_count}</Text>
          <Text className={styles.statLabel}>Fields</Text>
        </div>
        <div className={styles.stat}>
          <Text className={styles.statValue}>{entity.form_count}</Text>
          <Text className={styles.statLabel}>Forms</Text>
        </div>
        <div className={styles.stat}>
          <Text className={styles.statValue}>{entity.view_count}</Text>
          <Text className={styles.statLabel}>Views</Text>
        </div>
        <div className={styles.stat}>
          <Text className={styles.statValue}>{entity.business_rule_count}</Text>
          <Text className={styles.statLabel}>Rules</Text>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className={styles.metaGrid}>
        {entity.primary_name_attribute && (
          <>
            <Text className={styles.metaLabel}>
              <TextDescription24Regular
                style={{ fontSize: "14px", marginRight: 4, verticalAlign: "middle" }}
              />
              Primary Name
            </Text>
            <Text className={styles.metaValue}>
              {entity.primary_name_attribute}
            </Text>
          </>
        )}
        {entity.primary_id_attribute && (
          <>
            <Text className={styles.metaLabel}>
              <Key24Regular
                style={{ fontSize: "14px", marginRight: 4, verticalAlign: "middle" }}
              />
              Primary ID
            </Text>
            <Text className={styles.metaValue}>
              {entity.primary_id_attribute}
            </Text>
          </>
        )}
        {entity.plural_name && (
          <>
            <Text className={styles.metaLabel}>Plural Name</Text>
            <Text className={styles.metaValue}>{entity.plural_name}</Text>
          </>
        )}
      </div>
    </Card>
  );
}
