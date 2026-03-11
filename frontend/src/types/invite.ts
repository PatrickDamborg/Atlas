/** Types matching the backend Pydantic schemas for invite/seat management. */

export interface InviteLinkResponse {
  id: string;
  project_id: string;
  token: string;
  invite_url: string;
  label: string | null;
  status: "active" | "expired" | "revoked" | "exhausted";
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
}

export interface InviteLinkList {
  items: InviteLinkResponse[];
  total: number;
}

export interface InviteLinkCreateRequest {
  label?: string | null;
  max_uses?: number | null;
  expires_in_days?: number | null;
}

export interface SeatSummary {
  project_id: string;
  seat_limit: number;
  seats_used: number;
  seats_available: number;
  total_invites: number;
  active_invites: number;
}

export interface SeatAssignmentResponse {
  id: string;
  project_id: string;
  invite_link_id: string | null;
  user_email: string;
  user_display_name: string | null;
  is_active: boolean;
  consent_given_at: string | null;
  assigned_at: string;
  revoked_at: string | null;
}

export interface SeatAssignmentList {
  items: SeatAssignmentResponse[];
  total: number;
  seat_limit: number;
  seats_used: number;
  seats_available: number;
}

export interface SeatLimitUpdateRequest {
  seat_limit: number;
}
