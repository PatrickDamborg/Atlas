/** Types for GDPR data management — project-level bulk and per-user deletion. */

export interface BulkDeleteResponse {
  deleted_count: number;
  project_id: string;
}

export interface UserDeleteResponse {
  deleted_count: number;
  user_email: string;
}

export type BulkDeleteStatus = "idle" | "confirming" | "deleting" | "success" | "error";

/** Response from the comprehensive GDPR bulk delete endpoint. */
export interface ProjectDataDeletionResult {
  project_id: string;
  sessions_deleted: number;
  consent_records_deleted: number;
  seat_assignments_deleted: number;
  invite_links_deleted: number;
  progress_records_deleted: number;
  total_records_deleted: number;
  deleted_at: string;
  message: string;
  audit_log_id: string | null;
}

/** Response from single end-user GDPR hard delete. */
export interface SingleEndUserDeletionResult {
  project_id: string;
  seat_id: string;
  user_email: string;
  sessions_deleted: number;
  consent_records_deleted: number;
  progress_records_deleted: number;
  seat_deleted: boolean;
  total_records_deleted: number;
  deleted_at: string;
  message: string;
  audit_log_id: string | null;
}

/** A single GDPR audit log entry. */
export interface GdprAuditLogEntry {
  id: string;
  requested_by_id: string;
  requested_by_email: string;
  project_id: string | null;
  scope: "project_bulk" | "single_user";
  sessions_deleted: number;
  consent_records_deleted: number;
  seat_assignments_deleted: number;
  invite_links_deleted: number;
  progress_records_deleted: number;
  total_records_deleted: number;
  reason: string | null;
  extra_metadata: Record<string, unknown> | null;
  executed_at: string;
}

/** Paginated list of GDPR audit log entries. */
export interface GdprAuditLogListResponse {
  items: GdprAuditLogEntry[];
  total: number;
}
