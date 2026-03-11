"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dropdown,
  Option,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Folder24Regular } from "@fluentui/react-icons";
import { listProjects, ApiError } from "@/lib/api";
import type { ProjectSummary } from "@/types/project";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  dropdown: {
    minWidth: "320px",
    maxWidth: "480px",
  },
  projectMeta: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS,
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
  },
});

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectSelect: (project: ProjectSummary) => void;
}

export function ProjectSelector({
  selectedProjectId,
  onProjectSelect,
}: ProjectSelectorProps) {
  const styles = useStyles();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listProjects();
      setProjects(data.items);
      setError(null);

      // Auto-select first project if none selected
      if (!selectedProjectId && data.items.length > 0) {
        onProjectSelect(data.items[0]);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load projects";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, onProjectSelect]);

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={styles.spinnerRow}>
        <Spinner size="tiny" />
        <Text size={200}>Loading projects...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>Error</MessageBarTitle>
          {error}
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (projects.length === 0) {
    return (
      <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
        No projects found. Upload a Dataverse solution to get started.
      </Text>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        <Folder24Regular />
        <Text weight="semibold" size={300}>
          Project
        </Text>
      </div>
      <Dropdown
        className={styles.dropdown}
        placeholder="Select a project..."
        value={
          selectedProject
            ? selectedProject.solution_display_name || selectedProject.name
            : undefined
        }
        selectedOptions={selectedProjectId ? [selectedProjectId] : []}
        onOptionSelect={(_, data) => {
          const project = projects.find((p) => p.id === data.optionValue);
          if (project) onProjectSelect(project);
        }}
      >
        {projects.map((project) => (
          <Option key={project.id} value={project.id}>
            {project.solution_display_name || project.name}
            {project.solution_version
              ? ` (v${project.solution_version})`
              : ""}
          </Option>
        ))}
      </Dropdown>
      {selectedProject && (
        <div className={styles.projectMeta}>
          {selectedProject.publisher && (
            <Text size={200}>Publisher: {selectedProject.publisher}</Text>
          )}
          <Text size={200}>
            {selectedProject.entity_count} entities
          </Text>
          <Text size={200}>
            Seat limit: {selectedProject.seat_limit}
          </Text>
        </div>
      )}
    </div>
  );
}
