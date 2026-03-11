/**
 * Types for training tracks displayed in the App Picker.
 *
 * A training track corresponds to a selected model-driven app that
 * has been processed by the AI pipeline. End users and consultants
 * use the app picker to select which track to view.
 */

export type TrainingTrackStatus =
  | "ready"       // Pipeline completed, walkthrough is available
  | "generating"  // Pipeline currently running
  | "pending"     // Selected but pipeline not yet started
  | "error";      // Pipeline failed

export interface TrainingTrack {
  /** Unique name of the app module (matches AppSelection.app_unique_name) */
  app_unique_name: string;
  /** Human-friendly display name */
  display_name: string;
  /** Brief description of the app */
  description: string;
  /** Number of entities/tables in the app */
  entity_count: number;
  /** Number of sitemap areas */
  sitemap_area_count: number;
  /** Current generation status */
  status: TrainingTrackStatus;
  /** Pipeline run ID if generating or completed */
  pipeline_run_id?: string | null;
  /** ISO 8601 timestamp of last generation */
  last_generated_at?: string | null;
  /** Error message if status is 'error' */
  error_message?: string | null;
}

export interface TrainingTracksResponse {
  project_id: string;
  tracks: TrainingTrack[];
  /** Total count of selected apps */
  total_count: number;
}

// ── Training content types for walkthrough viewer integration ────────

/** An app that has completed training tracks available */
export interface TrainingAppEntry {
  app_unique_name: string;
  display_name: string;
  description: string;
  entity_count: number;
  track_count: number;
  pipeline_run_id: string;
  completed_at: string | null;
}

export interface TrainingAppsResponse {
  project_id: string;
  apps: TrainingAppEntry[];
}

// ── Screen elements & layouts (from UX Expert) ───────────────────────

export interface ScreenElement {
  element_id: string;
  element_type: string;
  label: string;
  entity_logical_name: string;
  field_logical_name: string;
  position: Record<string, unknown>;
  is_highlighted: boolean;
  metadata: Record<string, unknown>;
}

export interface ScreenLayout {
  screen_id: string;
  screen_type: string;
  title: string;
  entity_logical_name: string;
  entity_display_name: string;
  form_id: string | null;
  view_name: string;
  elements: ScreenElement[];
  nav_context: Record<string, unknown>;
}

export interface StepLayout {
  step_id: string;
  screen_id: string;
  target_element_id: string;
  annotation_position: string;
  highlight_style: string;
}

// ── Training annotations & walkthrough tracks ────────────────────────

/**
 * Distinguishes interactive UI steps from text-only annotation steps.
 *
 * - `"interactive"` — Standard step targeting a UI element with coach mark
 * - `"text"` — Full-text annotation (e.g. business rule explanation) rendered
 *   as a centered panel with no element targeting
 */
export type AnnotationStepType = "interactive" | "text";

export interface TrainingAnnotation {
  step_id: string;
  title: string;
  /**
   * Whether this step targets a UI element or displays as standalone text.
   * Business rule observations use `"text"`. Defaults to `"interactive"`.
   */
  step_type: AnnotationStepType;
  instruction: string;
  tooltip_text: string;
  detail_text: string;
  tips: string[];
  /** Name of the business rule (only for text/business-rule steps). */
  business_rule_name?: string | null;
}

export interface WalkthroughTrack {
  track_id: string;
  workflow_id: string;
  title: string;
  description: string;
  estimated_duration_minutes: number;
  step_count: number;
  annotations: TrainingAnnotation[];
  learning_objectives: string[];
  /** Step IDs that the consultant has disabled (hidden from end users). */
  disabled_step_ids?: string[];
}

// ── Brand config snapshot (from pipeline result) ────────────────────

/** Brand color/logo snapshot captured when the pipeline completes. */
export interface BrandConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text_color: string;
  background_color: string;
  logo_url: string | null;
}

/** Default brand config matching Dynamics 365 out-of-box colours. */
export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  primary_color: "#0078D4",
  secondary_color: "#106EBE",
  accent_color: "#005A9E",
  header_text_color: "#FFFFFF",
  background_color: "#F3F2F1",
  logo_url: null,
};

// ── Combined training content for an app ─────────────────────────────

export interface AppTrainingContent {
  project_id: string;
  app_unique_name: string;
  app_display_name: string;
  pipeline_run_id: string;
  completed_at: string | null;
  // Brand settings snapshot
  brand?: BrandConfig;
  // UX Expert data
  screens: ScreenLayout[];
  step_layouts: StepLayout[];
  sitemap_structure: Record<string, unknown>;
  command_bar_actions: Record<string, unknown>;
  // Training Expert data
  solution_overview: string;
  tracks: WalkthroughTrack[];
  documentation_pages: unknown[];
  // Warnings
  warnings: string[];
}

// ── Navigation state per track ───────────────────────────────────────

export interface TrackNavigationState {
  trackId: string;
  currentStepIndex: number;
  totalSteps: number;
  completed: boolean;
}

export type TrackNavigationMap = Record<string, TrackNavigationState>;

// ── Step visibility types ─────────────────────────────────────────────

export interface StepVisibilityEntry {
  step_id: string;
  enabled: boolean;
}

export interface StepVisibilityUpdateRequest {
  steps: StepVisibilityEntry[];
}

export interface StepVisibilityResponse {
  track_id: string;
  step_count: number;
  disabled_step_ids: string[];
  enabled_step_ids: string[];
}
