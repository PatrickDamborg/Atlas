/** Types matching the backend Pydantic schemas for app module discovery and selection. */

export interface AppModuleEntity {
  logical_name: string;
  display_name: string;
  is_custom_entity: boolean;
}

export interface SitemapSubArea {
  sub_area_id: string;
  entity: string;
  title: string;
  url: string;
}

export interface SitemapGroup {
  group_id: string;
  title: string;
  sub_areas: SitemapSubArea[];
}

export interface SitemapArea {
  area_id: string;
  title: string;
  groups: SitemapGroup[];
}

export interface DiscoveredApp {
  app_unique_name: string;
  display_name: string;
  description: string;
  app_id: string;
  entity_count: number;
  entities: AppModuleEntity[];
  sitemap_areas: SitemapArea[];
}

export interface DiscoveredAppsResponse {
  project_id: string;
  solution_display_name: string;
  apps: DiscoveredApp[];
  warnings: string[];
}

export interface AppSelectionRequest {
  /** Single app for backward compat. Use app_unique_names for multi-select. */
  app_unique_name?: string;
  app_unique_names: string[];
}

export interface AppSelectionResponseItem {
  app_unique_name: string;
  display_name: string;
  entity_count: number;
}

export interface AppSelectionResponse {
  project_id: string;
  selected_apps: AppSelectionResponseItem[];
  selected_at: string;
}
