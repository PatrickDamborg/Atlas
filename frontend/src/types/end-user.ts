/** Types matching the backend Pydantic schemas for end-user identity capture and sessions. */

export interface IdentityCaptureRequest {
  email: string;
  display_name: string;
  consent_given: boolean;
}

export interface IdentityCaptureResponse {
  session_token: string;
  seat_id: string;
  project_id: string;
  redirect_url: string;
  display_name: string;
  message: string;
  is_returning_user: boolean;
}

export interface InviteValidateResponse {
  valid: boolean;
  status: string;
  project_name: string | null;
  project_id: string | null;
  label: string | null;
  expires_at: string | null;
  seats_available: boolean;
  error_code: string | null;
  error_message: string | null;
  /** Administrator contact email — shown when seat limit is reached. */
  admin_contact_email: string | null;
}

export interface SessionValidationResponse {
  valid: boolean;
  session: EndUserSessionResponse | null;
  message: string;
}

export interface EndUserSessionResponse {
  id: string;
  email: string;
  display_name: string;
  project_id: string;
  seat_assignment_id: string;
  is_active: boolean;
  last_accessed_at: string | null;
  created_at: string;
}
