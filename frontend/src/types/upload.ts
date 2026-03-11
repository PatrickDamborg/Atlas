/** Types for the solution upload endpoint. */

export interface EntitySummary {
  logical_name: string;
  display_name: string;
  is_custom_entity: boolean;
  attribute_count: number;
  form_count: number;
  view_count: number;
  business_rule_count: number;
}

export interface AppModuleSummary {
  unique_name: string;
  display_name: string;
  description: string;
  entity_count: number;
  is_default: boolean;
}

export interface UploadSolutionResponse {
  project_id: string;
  solution_unique_name: string;
  solution_display_name: string;
  solution_version: string;
  publisher: string;
  description: string;
  entity_count: number;
  app_module_count: number;
  entity_summaries: EntitySummary[];
  app_module_summaries: AppModuleSummary[];
  warnings: string[];
}
