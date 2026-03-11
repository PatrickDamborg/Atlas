/**
 * API client for Forge Atlas backend.
 *
 * All requests go through Next.js rewrites to the FastAPI backend,
 * keeping API keys and auth tokens server-side.
 *
 * Consultant endpoints automatically attach the MSAL access token
 * via the authFetch helper. Public/end-user endpoints use publicApiFetch.
 */

import type {
  InviteLinkCreateRequest,
  InviteLinkList,
  InviteLinkResponse,
  SeatAssignmentList,
  SeatAssignmentResponse,
  SeatLimitUpdateRequest,
  SeatSummary,
} from "@/types/invite";
import type {
  AppSelectionRequest,
  AppSelectionResponse,
  DiscoveredAppsResponse,
} from "@/types/appModule";
// Re-export legacy single-select name for backward compat
export type { AppSelectionRequest } from "@/types/appModule";
import type {
  ConsentAcceptRequest,
  ConsentAcceptResponse,
  ConsentContent,
  ConsentStatus,
} from "@/types/consent";
import type {
  IdentityCaptureRequest,
  IdentityCaptureResponse,
  InviteValidateResponse,
  SessionValidationResponse,
} from "@/types/end-user";
import type {
  BulkDeleteResponse,
  UserDeleteResponse,
  ProjectDataDeletionResult,
  SingleEndUserDeletionResult,
  GdprAuditLogListResponse,
} from "@/types/data-management";
import type {
  ProjectListResponse,
} from "@/types/project";
import { authFetch } from "@/lib/authFetch";

const BASE = "/api";

/**
 * Authenticated API fetch for consultant endpoints.
 * Automatically attaches the MSAL Bearer token via authFetch.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await authFetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Support structured detail objects (e.g. seat-limit 403 with admin_contact_email)
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message ?? `Request failed: ${res.status}`;
    const data = typeof detail === "object" && detail !== null ? detail : null;
    throw new ApiError(res.status, message, data);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

/**
 * Unauthenticated API fetch for public/end-user endpoints.
 * Does NOT attach MSAL token — used for invite, consent, training routes.
 */
async function publicApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Support structured detail objects (e.g. seat-limit 403 with admin_contact_email)
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message ?? `Request failed: ${res.status}`;
    const data = typeof detail === "object" && detail !== null ? detail : null;
    throw new ApiError(res.status, message, data);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

export class ApiError extends Error {
  /** Optional structured data from the error response body. */
  public data: Record<string, unknown> | null;

  constructor(
    public status: number,
    message: string,
    data?: Record<string, unknown> | null
  ) {
    super(message);
    this.name = "ApiError";
    this.data = data ?? null;
  }
}

// ── Solution Upload ──────────────────────────────────────────────────

import type { UploadSolutionResponse } from "@/types/upload";

/**
 * Upload a Dataverse solution ZIP file.
 *
 * Uses multipart/form-data (not JSON), so we call authFetch directly
 * instead of apiFetch — the browser auto-sets Content-Type with boundary.
 */
export async function uploadSolution(
  file: File
): Promise<UploadSolutionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(`${BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.detail ?? `Upload failed: ${res.status}`
    );
  }

  return res.json();
}

// ── Invite Links ──────────────────────────────────────────────────────

export async function createInviteLink(
  projectId: string,
  data: InviteLinkCreateRequest
): Promise<InviteLinkResponse> {
  return apiFetch(`/projects/${projectId}/invites`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listInviteLinks(
  projectId: string,
  includeRevoked = false
): Promise<InviteLinkList> {
  const params = new URLSearchParams();
  if (includeRevoked) params.set("include_revoked", "true");
  return apiFetch(`/projects/${projectId}/invites?${params}`);
}

export async function revokeInviteLink(
  projectId: string,
  inviteId: string
): Promise<InviteLinkResponse> {
  return apiFetch(`/projects/${projectId}/invites/${inviteId}/revoke`, {
    method: "POST",
  });
}

// ── Seat Management ───────────────────────────────────────────────────

export async function getSeatSummary(
  projectId: string
): Promise<SeatSummary> {
  return apiFetch(`/projects/${projectId}/seats/summary`);
}

export async function updateSeatLimit(
  projectId: string,
  data: SeatLimitUpdateRequest
): Promise<SeatSummary> {
  return apiFetch(`/projects/${projectId}/seats/limit`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function listSeatAssignments(
  projectId: string,
  includeRevoked = false
): Promise<SeatAssignmentList> {
  const params = new URLSearchParams();
  if (includeRevoked) params.set("include_revoked", "true");
  return apiFetch(`/projects/${projectId}/seats?${params}`);
}

export async function revokeSeatAssignment(
  projectId: string,
  seatId: string
): Promise<SeatAssignmentResponse> {
  return apiFetch(`/projects/${projectId}/seats/${seatId}/revoke`, {
    method: "POST",
  });
}

export async function hardDeleteSeat(
  projectId: string,
  seatId: string
): Promise<void> {
  return apiFetch(`/projects/${projectId}/seats/${seatId}`, {
    method: "DELETE",
  });
}

// ── GDPR Data Management ─────────────────────────────────────────────

export async function bulkDeleteProjectData(
  projectId: string
): Promise<BulkDeleteResponse> {
  return apiFetch(`/projects/${projectId}/seats`, {
    method: "DELETE",
  });
}

export async function deleteUserDataByEmail(
  projectId: string,
  userEmail: string
): Promise<UserDeleteResponse> {
  return apiFetch(
    `/projects/${projectId}/seats/by-email/${encodeURIComponent(userEmail)}`,
    { method: "DELETE" }
  );
}

/**
 * GDPR hard delete all end-user data for a project (comprehensive).
 *
 * Calls the dedicated GDPR endpoint that deletes sessions, consent records,
 * seat assignments, invite links, and walkthrough progress — then creates
 * an immutable audit log entry.
 */
export async function gdprBulkDeleteProject(
  projectId: string,
  reason?: string
): Promise<ProjectDataDeletionResult> {
  return apiFetch(`/projects/${projectId}/enduser-data`, {
    method: "DELETE",
    body: JSON.stringify({ confirm: true, reason: reason ?? null }),
  });
}

/**
 * GDPR hard delete a single end user's data (comprehensive).
 *
 * Calls the dedicated GDPR endpoint that deletes the user's sessions,
 * consent records, walkthrough progress, and seat assignment — then
 * creates an immutable audit log entry.
 */
export async function gdprDeleteEndUser(
  projectId: string,
  seatId: string,
  reason?: string
): Promise<SingleEndUserDeletionResult> {
  const params = new URLSearchParams();
  if (reason) params.set("reason", reason);
  const qs = params.toString();
  return apiFetch(
    `/projects/${projectId}/end-users/${seatId}${qs ? `?${qs}` : ""}`,
    { method: "DELETE" }
  );
}

/**
 * Fetch GDPR audit logs for a project.
 */
export async function getGdprAuditLogs(
  projectId: string,
  limit = 50,
  offset = 0
): Promise<GdprAuditLogListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiFetch(`/projects/${projectId}/gdpr-audit-logs?${params}`);
}

// ── Projects ──────────────────────────────────────────────────────────

/**
 * List all projects for the current consultant.
 *
 * Used by the project selector in the Manage Data UI and dashboard.
 */
export async function listProjects(): Promise<ProjectListResponse> {
  return apiFetch("/projects");
}

// ── App Discovery & Selection ────────────────────────────────────────

export async function getDiscoveredApps(
  projectId: string
): Promise<DiscoveredAppsResponse> {
  return apiFetch(`/projects/${projectId}/apps`);
}

/** @deprecated Use selectApps for multi-select support. */
export async function selectApp(
  projectId: string,
  data: AppSelectionRequest
): Promise<AppSelectionResponse> {
  return apiFetch(`/projects/${projectId}/apps/select`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function selectApps(
  projectId: string,
  data: AppSelectionRequest
): Promise<AppSelectionResponse> {
  return apiFetch(`/projects/${projectId}/apps/select`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Consent (End-User) ──────────────────────────────────────────────

export async function getConsentContent(): Promise<ConsentContent> {
  return publicApiFetch("/consent/content");
}

export async function getConsentStatus(
  seatId: string
): Promise<ConsentStatus> {
  return publicApiFetch(`/consent/${seatId}/status`);
}

export async function acceptConsent(
  seatId: string,
  data: ConsentAcceptRequest
): Promise<ConsentAcceptResponse> {
  return publicApiFetch(`/consent/${seatId}/accept`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Invite Validation & Identity Capture (End-User) ──────────────────

export async function validateInviteToken(
  token: string
): Promise<InviteValidateResponse> {
  return publicApiFetch(`/invites/${token}/validate`);
}

export async function captureIdentity(
  token: string,
  data: IdentityCaptureRequest
): Promise<IdentityCaptureResponse> {
  return publicApiFetch(`/invites/${token}/identity`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function validateEndUserSession(
  sessionToken: string
): Promise<SessionValidationResponse> {
  return publicApiFetch("/end-user/session", {
    headers: { "X-Session-Token": sessionToken },
  });
}

export async function endUserLogout(
  sessionToken: string
): Promise<void> {
  return publicApiFetch("/end-user/logout", {
    method: "POST",
    headers: { "X-Session-Token": sessionToken },
  });
}

// ── Entity Reference Documentation ───────────────────────────────────

import type {
  EntityListResponse,
  EntityDetailResponse,
} from "@/types/entity";

export async function listEntities(
  projectId: string,
  searchQuery?: string
): Promise<EntityListResponse> {
  const params = new URLSearchParams();
  if (searchQuery && searchQuery.trim()) {
    params.set("q", searchQuery.trim());
  }
  const qs = params.toString();
  return apiFetch(`/projects/${projectId}/entities${qs ? `?${qs}` : ""}`);
}

export async function getEntityDetail(
  projectId: string,
  entityId: string
): Promise<EntityDetailResponse> {
  return apiFetch(`/projects/${projectId}/entities/${entityId}`);
}

// ── App Tracks (per-app training units) ──────────────────────────────

import type {
  AppTrackListResponse,
  AppTrackDetail,
} from "@/types/appTrack";

export async function listAppTracks(
  projectId: string
): Promise<AppTrackListResponse> {
  return apiFetch(`/projects/${projectId}/tracks`);
}

export async function getAppTrackDetail(
  projectId: string,
  trackId: string
): Promise<AppTrackDetail> {
  return apiFetch(`/projects/${projectId}/tracks/${trackId}`);
}

// ── Training Tracks (App Picker) ──────────────────────────────────────

import type {
  TrainingTracksResponse,
  TrainingAppsResponse,
  AppTrainingContent,
  StepVisibilityUpdateRequest,
  StepVisibilityResponse,
} from "@/types/trainingTrack";

export async function getTrainingTracks(
  projectId: string
): Promise<TrainingTracksResponse> {
  return apiFetch(`/projects/${projectId}/apps/tracks`);
}

export async function listTrainingApps(
  projectId: string
): Promise<TrainingAppsResponse> {
  return apiFetch(`/projects/${projectId}/training/apps`);
}

export async function getAppTrainingContent(
  projectId: string,
  appUniqueName: string
): Promise<AppTrainingContent> {
  return apiFetch(
    `/projects/${projectId}/training/apps/${encodeURIComponent(appUniqueName)}`
  );
}

// ── Step Editor ──────────────────────────────────────────────────────

export interface StepReorderRequest {
  step_ids: string[];
}

export interface StepReorderResponse {
  track_id: string;
  step_count: number;
  step_ids: string[];
}

/**
 * Reorder steps within a walkthrough track.
 *
 * Sends the new step order (as an array of step_ids) to the backend,
 * which persists it to the pipeline run result JSONB.
 */
export async function reorderTrackSteps(
  projectId: string,
  appUniqueName: string,
  trackId: string,
  stepIds: string[]
): Promise<StepReorderResponse> {
  return apiFetch(
    `/projects/${projectId}/training/apps/${encodeURIComponent(appUniqueName)}/tracks/${encodeURIComponent(trackId)}/steps/reorder`,
    {
      method: "PUT",
      body: JSON.stringify({ step_ids: stepIds } satisfies StepReorderRequest),
    }
  );
}

/**
 * Get the current step visibility state for a walkthrough track.
 */
export async function getStepVisibility(
  projectId: string,
  appUniqueName: string,
  trackId: string
): Promise<StepVisibilityResponse> {
  return apiFetch(
    `/projects/${projectId}/training/apps/${encodeURIComponent(appUniqueName)}/tracks/${encodeURIComponent(trackId)}/steps/visibility`
  );
}

/**
 * Update step visibility (enable/disable) within a walkthrough track.
 *
 * Uses PATCH semantics — only the provided step entries are updated.
 * Disabled steps are skipped in the end-user walkthrough.
 */
export async function updateStepVisibility(
  projectId: string,
  appUniqueName: string,
  trackId: string,
  steps: StepVisibilityUpdateRequest["steps"]
): Promise<StepVisibilityResponse> {
  return apiFetch(
    `/projects/${projectId}/training/apps/${encodeURIComponent(appUniqueName)}/tracks/${encodeURIComponent(trackId)}/steps/visibility`,
    {
      method: "PUT",
      body: JSON.stringify({ steps } satisfies StepVisibilityUpdateRequest),
    }
  );
}

// ── Annotation Content Editing ────────────────────────────────────────

export interface AnnotationUpdateRequest {
  title?: string;
  instruction?: string;
  tooltip_text?: string;
  detail_text?: string;
  tips?: string[];
}

export interface AnnotationUpdateResponse {
  step_id: string;
  track_id: string;
  title: string;
  instruction: string;
  tooltip_text: string;
  detail_text: string;
  tips: string[];
}

/**
 * Update annotation content for a single walkthrough step.
 *
 * Only provided fields are updated — omitted fields are preserved.
 * Used by the inline Markdown annotation editor in step cards.
 */
export async function updateStepAnnotation(
  projectId: string,
  appUniqueName: string,
  trackId: string,
  stepId: string,
  data: AnnotationUpdateRequest
): Promise<AnnotationUpdateResponse> {
  return apiFetch(
    `/projects/${projectId}/training/apps/${encodeURIComponent(appUniqueName)}/tracks/${encodeURIComponent(trackId)}/steps/${encodeURIComponent(stepId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

// ── Pipeline ─────────────────────────────────────────────────────────

import type {
  PipelineStartRequest,
  PipelineStartResponse,
  PipelineRunStatus,
} from "@/types/pipeline";

export async function startPipelineRun(
  projectId: string,
  data: PipelineStartRequest
): Promise<PipelineStartResponse> {
  return apiFetch(`/projects/${projectId}/pipeline/run`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPipelineRunStatus(
  projectId: string,
  runId: string
): Promise<PipelineRunStatus> {
  return apiFetch(`/projects/${projectId}/pipeline/${runId}/status`);
}

// ── Workflow Review ──────────────────────────────────────────────────

import type {
  ProposedWorkflowsResponse,
  WorkflowSelectionRequest,
  WorkflowSelectionResponse,
  WorkflowConfirmRequest,
  WorkflowConfirmResponse,
} from "@/types/workflow";

export async function getProposedWorkflows(
  projectId: string,
  runId: string
): Promise<ProposedWorkflowsResponse> {
  return apiFetch(`/projects/${projectId}/pipeline/${runId}/workflows`);
}

/** @deprecated Use confirmWorkflows for the combined confirm + pipeline trigger. */
export async function confirmWorkflowSelection(
  projectId: string,
  runId: string,
  data: WorkflowSelectionRequest
): Promise<WorkflowSelectionResponse> {
  return apiFetch(`/projects/${projectId}/pipeline/${runId}/workflows/select`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Confirm the edited workflow list and trigger the generation pipeline.
 *
 * Locks in the consultant's selected/reordered/edited workflows, then
 * starts the 3-agent AI pipeline in the background. Returns a run_id
 * and SSE URL for real-time progress tracking.
 */
export async function confirmWorkflows(
  projectId: string,
  data: WorkflowConfirmRequest
): Promise<WorkflowConfirmResponse> {
  return apiFetch(`/projects/${projectId}/workflows/confirm`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Logo Upload ──────────────────────────────────────────────────────

import type {
  BrandSettings,
  BrandSettingsUpdate,
  LogoUploadResponse,
  LogoDeleteResponse,
} from "@/types/brand";

/**
 * Upload a logo image for a project.
 *
 * Uses multipart/form-data — do NOT set Content-Type header manually
 * (the browser will set the correct boundary).
 */
export async function uploadLogo(
  projectId: string,
  file: File
): Promise<LogoUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(`${BASE}/projects/${projectId}/logo`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.detail ?? `Logo upload failed: ${res.status}`
    );
  }

  return res.json();
}

/** Delete the logo for a project. */
export async function deleteLogo(
  projectId: string
): Promise<LogoDeleteResponse> {
  return apiFetch(`/projects/${projectId}/logo`, {
    method: "DELETE",
  });
}

/** Fetch brand settings (includes logo_url) for a project. */
export async function getBrandSettings(
  projectId: string
): Promise<BrandSettings> {
  return apiFetch(`/projects/${projectId}/brand-settings`);
}

/** Update brand settings for a project. */
export async function updateBrandSettings(
  projectId: string,
  data: BrandSettingsUpdate
): Promise<BrandSettings> {
  return apiFetch(`/projects/${projectId}/brand-settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Walkthrough Progress Tracking ────────────────────────────────────

import type {
  StepCompletionRequest,
  StepCompletionResponse,
  WalkthroughProgressResponse,
  ResumeStateResponse,
  ProgressResetResponse,
  AllTracksProgressResponse,
} from "@/types/walkthroughProgress";

/**
 * Helper for end-user API calls that require X-Session-Token header.
 */
function endUserApiFetch<T>(
  path: string,
  sessionToken: string,
  options: RequestInit = {}
): Promise<T> {
  return publicApiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      "X-Session-Token": sessionToken,
    },
  });
}

/**
 * Mark a walkthrough step as completed.
 *
 * Idempotent — re-completing a step is a no-op.
 */
export async function completeWalkthroughStep(
  projectId: string,
  appTrackId: string,
  sessionToken: string,
  data: StepCompletionRequest
): Promise<StepCompletionResponse> {
  return endUserApiFetch(
    `/projects/${projectId}/tracks/${appTrackId}/progress`,
    sessionToken,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get full progress state for a user on a specific app track.
 * Returns null if no progress exists.
 */
export async function getWalkthroughProgress(
  projectId: string,
  appTrackId: string,
  sessionToken: string
): Promise<WalkthroughProgressResponse | null> {
  return endUserApiFetch(
    `/projects/${projectId}/tracks/${appTrackId}/progress`,
    sessionToken
  );
}

/**
 * Get lightweight resume state for loading a walkthrough.
 *
 * Always returns a response — defaults to step 0 if no progress.
 */
export async function getWalkthroughResumeState(
  projectId: string,
  appTrackId: string,
  sessionToken: string
): Promise<ResumeStateResponse> {
  return endUserApiFetch(
    `/projects/${projectId}/tracks/${appTrackId}/progress/resume`,
    sessionToken
  );
}

/**
 * Reset progress for a track (start over).
 */
export async function resetWalkthroughProgress(
  projectId: string,
  appTrackId: string,
  sessionToken: string
): Promise<ProgressResetResponse> {
  return endUserApiFetch(
    `/projects/${projectId}/tracks/${appTrackId}/progress`,
    sessionToken,
    {
      method: "DELETE",
      body: JSON.stringify({ confirm: true }),
    }
  );
}

/**
 * Get progress summary across all tracks in a project.
 */
export async function getAllTracksProgress(
  projectId: string,
  sessionToken: string
): Promise<AllTracksProgressResponse> {
  return endUserApiFetch(
    `/projects/${projectId}/progress`,
    sessionToken
  );
}

// ── Adoption Dashboard (Consultant) ──────────────────────────────────

import type { AdoptionDashboardResponse } from "@/types/adoptionDashboard";

/**
 * Get adoption dashboard metrics for a project.
 *
 * Consultant-authenticated endpoint that returns per-track completion
 * percentages, enrolled user counts, and per-user step completion details.
 */
export async function getAdoptionDashboard(
  projectId: string
): Promise<AdoptionDashboardResponse> {
  return apiFetch(`/projects/${projectId}/adoption`);
}
