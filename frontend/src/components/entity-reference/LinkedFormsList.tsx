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
  Form24Regular,
  DocumentBulletList24Regular,
} from "@fluentui/react-icons";
import type { FormSummary, ViewSummary } from "@/types/entity";

const useStyles = makeStyles({
  container: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  card: {
    minHeight: "auto",
  },
  cardDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
  },
  cardMeta: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  viewColumns: {
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

function getFormTypeBadgeColor(formType: string): "brand" | "informative" | "success" | "warning" {
  switch (formType) {
    case "Main":
      return "brand";
    case "QuickCreate":
      return "success";
    case "QuickView":
      return "informative";
    default:
      return "warning";
  }
}

interface LinkedFormsListProps {
  forms: FormSummary[];
  views: ViewSummary[];
}

export function LinkedFormsList({ forms, views }: LinkedFormsListProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {/* Forms Section */}
      <div className={styles.sectionHeader}>
        <Form24Regular />
        <Text size={500} weight="semibold">
          Forms ({forms.length})
        </Text>
      </div>

      {forms.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={300}>No forms found for this entity.</Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {forms.map((form) => (
            <Card key={form.form_id || form.name} className={styles.card} size="small">
              <CardHeader
                header={
                  <Text weight="semibold" size={300}>
                    {form.name || "Unnamed Form"}
                  </Text>
                }
                description={
                  <div className={styles.cardDescription}>
                    {form.description || "No description"}
                  </div>
                }
              />
              <div className={styles.cardMeta}>
                <Badge
                  appearance="tint"
                  color={getFormTypeBadgeColor(form.form_type)}
                  size="small"
                >
                  {form.form_type}
                </Badge>
                <Badge appearance="outline" size="small" color="subtle">
                  {form.tab_count} tab{form.tab_count !== 1 ? "s" : ""}
                </Badge>
                <Badge appearance="outline" size="small" color="subtle">
                  {form.field_count} field{form.field_count !== 1 ? "s" : ""}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Views Section */}
      <div
        className={styles.sectionHeader}
        style={{ marginTop: tokens.spacingVerticalXL }}
      >
        <DocumentBulletList24Regular />
        <Text size={500} weight="semibold">
          Views ({views.length})
        </Text>
      </div>

      {views.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={300}>No views found for this entity.</Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {views.map((view) => (
            <Card
              key={view.saved_query_id || view.name}
              className={styles.card}
              size="small"
            >
              <CardHeader
                header={
                  <Text weight="semibold" size={300}>
                    {view.name || "Unnamed View"}
                    {view.is_default && (
                      <Badge
                        appearance="filled"
                        color="brand"
                        size="tiny"
                        style={{ marginLeft: 8 }}
                      >
                        Default
                      </Badge>
                    )}
                  </Text>
                }
                description={
                  <div className={styles.cardDescription}>
                    {view.description || "No description"}
                  </div>
                }
              />
              <div className={styles.cardMeta}>
                <Badge appearance="outline" size="small" color="subtle">
                  {view.column_count} column{view.column_count !== 1 ? "s" : ""}
                </Badge>
              </div>
              {view.columns.length > 0 && (
                <div className={styles.viewColumns}>
                  <Text size={200}>
                    Columns: {view.columns.join(", ")}
                  </Text>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
