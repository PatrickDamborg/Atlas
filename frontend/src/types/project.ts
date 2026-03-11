/** Types for project listing and selection in the consultant portal. */

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  solution_unique_name: string | null;
  solution_display_name: string | null;
  solution_version: string | null;
  publisher: string | null;
  entity_count: number;
  seat_limit: number;
  created_at: string;
}

export interface ProjectListResponse {
  items: ProjectSummary[];
  total: number;
}
