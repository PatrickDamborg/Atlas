/**
 * TypeScript types for walkthrough progress tracking.
 *
 * Mirrors the backend Pydantic schemas in walkthrough_progress.py.
 */

/** Request to mark a step as completed. */
export interface StepCompletionRequest {
  step_id: string;
  step_index: number;
  total_steps: number;
}

/** Request to reset progress (start over). */
export interface ProgressResetRequest {
  confirm: boolean;
}

/** Full progress state for a user on a specific app track. */
export interface WalkthroughProgressResponse {
  id: string;
  session_id: string;
  app_track_id: string;
  project_id: string;
  completed_steps: string[];
  total_steps: number;
  last_completed_step_index: number;
  last_completed_step_id: string | null;
  is_complete: boolean;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  next_step_index: number;
  completion_percentage: number;
}

/** Lightweight resume state for loading a walkthrough. */
export interface ResumeStateResponse {
  app_track_id: string;
  has_progress: boolean;
  next_step_index: number;
  last_completed_step_id: string | null;
  completed_steps: string[];
  is_complete: boolean;
  completion_percentage: number;
}

/** Response after marking a step as completed. */
export interface StepCompletionResponse {
  step_id: string;
  step_index: number;
  is_complete: boolean;
  next_step_index: number;
  completion_percentage: number;
  completed_steps: string[];
}

/** Response after resetting progress. */
export interface ProgressResetResponse {
  app_track_id: string;
  message: string;
}

/** Summary of progress for a single track. */
export interface TrackProgressSummary {
  app_track_id: string;
  app_name: string;
  completed_count: number;
  total_steps: number;
  completion_percentage: number;
  is_complete: boolean;
  last_activity_at: string | null;
}

/** Progress summary across all tracks in a project. */
export interface AllTracksProgressResponse {
  project_id: string;
  tracks: TrackProgressSummary[];
  overall_percentage: number;
}
