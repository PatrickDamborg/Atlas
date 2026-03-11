/** Types for app track API responses.
 *
 * An AppTrack represents a distinct model-driven app extracted from a
 * Dataverse solution, serving as an independent training unit within a project.
 */

import type { AppModuleEntity, SitemapArea } from "./appModule";

export interface AppTrackSummary {
  id: string;
  project_id: string;
  app_unique_name: string;
  display_name: string;
  description: string;
  entity_count: number;
  is_default: boolean;
  status: string;
  created_at: string;
}

export interface AppTrackListResponse {
  project_id: string;
  tracks: AppTrackSummary[];
  total_count: number;
}

export interface AppTrackDetail {
  id: string;
  project_id: string;
  app_unique_name: string;
  display_name: string;
  description: string;
  app_module_id: string;
  is_default: boolean;
  entity_count: number;
  status: string;
  entity_names: string[];
  entities: AppModuleEntity[];
  sitemap_areas: SitemapArea[];
  latest_pipeline_run_id: string | null;
  created_at: string;
  updated_at: string;
}
