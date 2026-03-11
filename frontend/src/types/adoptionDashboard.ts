/**
 * TypeScript types for the consultant-facing adoption dashboard.
 *
 * Mirrors the backend Pydantic schemas in adoption_dashboard.py.
 */

/** Progress for a single user on a single track. */
export interface UserTrackProgress {
  user_email: string;
  user_display_name: string;
  seat_id: string;
  completed_count: number;
  total_steps: number;
  completion_percentage: number;
  is_complete: boolean;
  started_at: string | null;
  last_activity_at: string | null;
  completed_at: string | null;
}

/** Adoption metrics for a single app track across all users. */
export interface TrackAdoptionMetrics {
  app_track_id: string;
  app_name: string;
  total_steps: number;
  enrolled_users: number;
  completed_users: number;
  average_completion_percentage: number;
  user_progress: UserTrackProgress[];
}

/** Full adoption dashboard data for a project. */
export interface AdoptionDashboardResponse {
  project_id: string;
  total_enrolled_users: number;
  total_tracks: number;
  overall_completion_percentage: number;
  tracks: TrackAdoptionMetrics[];
}
