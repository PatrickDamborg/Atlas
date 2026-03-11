"use client";

import { useState, useCallback } from "react";
import {
  Divider,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ShieldLock24Regular } from "@fluentui/react-icons";
import { AuthGuard } from "@/components/auth";
import { ProjectSelector } from "@/components/data-management/ProjectSelector";
import { ProjectDataManagementPanel } from "@/components/data-management";
import type { ProjectSummary } from "@/types/project";

const useStyles = makeStyles({
  page: {
    maxWidth: "1200px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: tokens.spacingHorizontalXXL,
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: tokens.spacingVerticalL,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  headerIcon: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  gdprBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  selectorSection: {
    marginBottom: tokens.spacingVerticalXL,
  },
  emptyState: {
    textAlign: "center",
    padding: tokens.spacingVerticalXXXL,
    color: tokens.colorNeutralForeground3,
  },
});

function ManageDataContent() {
  const styles = useStyles();
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(
    null
  );

  const handleProjectSelect = useCallback((project: ProjectSummary) => {
    setSelectedProject(project);
  }, []);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ShieldLock24Regular />
            <Text size={800} weight="bold">
              Manage Data
            </Text>
          </div>
          <Text
            size={300}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            GDPR-compliant data management. Select a project to view and
            manage end-user records. All deletions are permanent hard deletes
            with immutable audit logging.
          </Text>
        </div>
        <div className={styles.gdprBadge}>
          <ShieldLock24Regular />
          GDPR Compliant
        </div>
      </div>

      {/* Project Selector */}
      <div className={styles.selectorSection}>
        <ProjectSelector
          selectedProjectId={selectedProject?.id ?? null}
          onProjectSelect={handleProjectSelect}
        />
      </div>

      <Divider />

      {/* Data Management Panel (loaded after project selection) */}
      {selectedProject ? (
        <ProjectDataManagementPanel projectId={selectedProject.id} />
      ) : (
        <div className={styles.emptyState}>
          <Text size={400}>
            Select a project above to manage end-user data
          </Text>
        </div>
      )}
    </div>
  );
}

export default function ManageDataPage() {
  return (
    <AuthGuard>
      <ManageDataContent />
    </AuthGuard>
  );
}
