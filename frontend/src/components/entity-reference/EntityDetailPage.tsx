"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Spinner,
  Text,
  Divider,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowLeft24Regular } from "@fluentui/react-icons";
import { getEntityDetail, ApiError } from "@/lib/api";
import type { EntityDetailResponse } from "@/types/entity";
import { EntityOverviewCard } from "./EntityOverviewCard";
import { FieldDescriptionsTable } from "./FieldDescriptionsTable";
import { LinkedFormsList } from "./LinkedFormsList";
import { BusinessRulesSummary } from "./BusinessRulesSummary";

const useStyles = makeStyles({
  page: {
    padding: tokens.spacingHorizontalXXL,
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  breadcrumb: {
    marginBottom: tokens.spacingVerticalL,
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacingVerticalXXXL,
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  sectionDivider: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    cursor: "pointer",
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalM,
    background: "none",
    border: "none",
    padding: 0,
    fontSize: tokens.fontSizeBase300,
    "&:hover": {
      textDecoration: "underline",
    },
  },
});

interface EntityDetailPageProps {
  projectId: string;
  entityId: string;
  /** Optional callback to navigate back to entity list */
  onBack?: () => void;
  /** Optional project name for breadcrumb */
  projectName?: string;
}

export function EntityDetailPage({
  projectId,
  entityId,
  onBack,
  projectName,
}: EntityDetailPageProps) {
  const styles = useStyles();

  const [entity, setEntity] = useState<EntityDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEntityDetail(projectId, entityId);
      setEntity(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to load entity details";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, entityId]);

  useEffect(() => {
    loadEntity();
  }, [loadEntity]);

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner label="Loading entity details..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <MessageBar intent="error" className={styles.errorBar}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
        {onBack && (
          <button className={styles.backButton} onClick={onBack} type="button">
            <ArrowLeft24Regular />
            <Text>Back to entity list</Text>
          </button>
        )}
      </div>
    );
  }

  if (!entity) {
    return (
      <div className={styles.page}>
        <Text>Entity not found.</Text>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className={styles.breadcrumb} aria-label="Entity navigation">
        <BreadcrumbItem>
          <BreadcrumbButton onClick={onBack}>
            {projectName || "Project"}
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbButton onClick={onBack}>Entities</BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbButton current>
            {entity.display_name || entity.logical_name}
          </BreadcrumbButton>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Entity Overview */}
      <EntityOverviewCard entity={entity} />

      <Divider className={styles.sectionDivider} />

      {/* Field Descriptions Table */}
      <FieldDescriptionsTable fields={entity.fields} />

      <Divider className={styles.sectionDivider} />

      {/* Linked Forms & Views */}
      <LinkedFormsList forms={entity.forms} views={entity.views} />

      <Divider className={styles.sectionDivider} />

      {/* Business Rules Summary */}
      <BusinessRulesSummary rules={entity.business_rules} />
    </div>
  );
}
