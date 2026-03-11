"use client";

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Flow24Regular,
  ArrowRight16Regular,
} from "@fluentui/react-icons";
import type { BusinessRuleSummary } from "@/types/entity";

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
  ruleHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    width: "100%",
  },
  ruleName: {
    flex: 1,
  },
  panelContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
  },
  description: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalS,
  },
  subSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  subSectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  conditionRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
  },
  fieldChip: {
    fontFamily: "monospace",
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusSmall,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  operatorText: {
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
});

function getScopeBadgeColor(scope: string): "brand" | "informative" | "warning" {
  switch (scope) {
    case "Entity":
      return "brand";
    case "AllForms":
      return "informative";
    case "SpecificForm":
      return "warning";
    default:
      return "brand";
  }
}

interface BusinessRulesSummaryProps {
  rules: BusinessRuleSummary[];
}

export function BusinessRulesSummary({ rules }: BusinessRulesSummaryProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <Flow24Regular />
        <Text size={500} weight="semibold">
          Business Rules ({rules.length})
        </Text>
      </div>

      {rules.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={300}>No business rules found for this entity.</Text>
        </div>
      ) : (
        <Accordion multiple collapsible>
          {rules.map((rule, index) => (
            <AccordionItem key={rule.workflow_id || `rule-${index}`} value={`rule-${index}`}>
              <AccordionHeader>
                <div className={styles.ruleHeader}>
                  <Text className={styles.ruleName} weight="semibold" size={300}>
                    {rule.name || "Unnamed Rule"}
                  </Text>
                  <Badge
                    appearance="tint"
                    color={getScopeBadgeColor(rule.scope)}
                    size="small"
                  >
                    {rule.scope}
                  </Badge>
                </div>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.panelContent}>
                  {/* Description */}
                  {rule.description && (
                    <Text size={200} className={styles.description}>
                      {rule.description}
                    </Text>
                  )}

                  {/* Conditions */}
                  {rule.conditions.length > 0 && (
                    <div className={styles.subSection}>
                      <Text className={styles.subSectionTitle}>
                        Conditions ({rule.conditions.length})
                      </Text>
                      {rule.conditions.map((cond, ci) => (
                        <div key={`cond-${ci}`} className={styles.conditionRow}>
                          <Text>If</Text>
                          <span className={styles.fieldChip}>{cond.field || "—"}</span>
                          <Text className={styles.operatorText}>
                            {cond.operator || "equals"}
                          </Text>
                          <span className={styles.fieldChip}>
                            {cond.value || "(empty)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {rule.actions.length > 0 && (
                    <div className={styles.subSection}>
                      <Text className={styles.subSectionTitle}>
                        Actions ({rule.actions.length})
                      </Text>
                      {rule.actions.map((action, ai) => (
                        <div key={`action-${ai}`} className={styles.actionRow}>
                          <ArrowRight16Regular />
                          <Badge appearance="outline" size="small" color="subtle">
                            {action.action_type || "Set"}
                          </Badge>
                          <span className={styles.fieldChip}>
                            {action.field || "—"}
                          </span>
                          {action.value && (
                            <>
                              <Text className={styles.operatorText}>to</Text>
                              <span className={styles.fieldChip}>{action.value}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty conditions/actions */}
                  {rule.conditions.length === 0 && rule.actions.length === 0 && (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      No conditions or actions defined.
                    </Text>
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
