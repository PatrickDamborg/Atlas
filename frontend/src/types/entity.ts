/** Types matching the backend entity detail reference schemas. */

export interface FieldOption {
  value: number;
  label: string;
}

export interface FieldDescription {
  logical_name: string;
  display_name: string;
  field_type: string;
  description: string;
  is_required: boolean;
  is_primary_name: boolean;
  max_length: number | null;
  options: FieldOption[];
  target_entities: string[];
}

export interface FormSummary {
  form_id: string;
  name: string;
  form_type: string;
  description: string;
  tab_count: number;
  field_count: number;
}

export interface ViewSummary {
  saved_query_id: string;
  name: string;
  description: string;
  is_default: boolean;
  column_count: number;
  columns: string[];
}

export interface BusinessRuleConditionSummary {
  field: string;
  operator: string;
  value: string;
}

export interface BusinessRuleActionSummary {
  action_type: string;
  field: string;
  value: string;
}

export interface BusinessRuleSummary {
  workflow_id: string;
  name: string;
  description: string;
  scope: string;
  conditions: BusinessRuleConditionSummary[];
  actions: BusinessRuleActionSummary[];
}

export interface EntityDetailResponse {
  entity_id: string;
  project_id: string;
  logical_name: string;
  display_name: string;
  plural_name: string;
  description: string;
  is_custom_entity: boolean;
  primary_id_attribute: string;
  primary_name_attribute: string;
  field_count: number;
  form_count: number;
  view_count: number;
  business_rule_count: number;
  fields: FieldDescription[];
  forms: FormSummary[];
  views: ViewSummary[];
  business_rules: BusinessRuleSummary[];
}

export interface EntitySearchMatch {
  /** Categories where the search matched (e.g. 'entity_name', 'field_description', 'business_rule'). */
  matched_on: string[];
}

export interface EntityListItem {
  entity_id: string;
  logical_name: string;
  display_name: string;
  is_custom_entity: boolean;
  field_count: number;
  form_count: number;
  view_count: number;
  business_rule_count: number;
  /** Present only when a search query was provided. */
  search_match?: EntitySearchMatch | null;
}

export interface EntityListResponse {
  project_id: string;
  entities: EntityListItem[];
  total_count: number;
  /** Echo of the search query, if one was provided. */
  search_query?: string | null;
}
