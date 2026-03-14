# Atlas API Contract

> **Single source of truth for all frontend ↔ backend communication.**
> Both the `frontend` and `backend` agents must read this document before implementing
> any endpoint, response shape, or data model.

## Governance Rules

1. **TypeScript types are canonical.** `frontend/src/types/` and `frontend/src/lib/api.ts`
   define the shapes. Pydantic models in the backend must match them exactly.
2. **The backend agent owns this document.** When adding or changing an endpoint,
   the backend agent updates this file and the corresponding Pydantic schema.
3. **The frontend agent reads this document.** Before calling an endpoint, verify it
   exists here. Do not invent API shapes.
4. **No breaking changes without updating both sides.** If a response shape changes,
   update the Pydantic model, this document, and the TypeScript type simultaneously.
5. **All IDs are UUIDs** (`string` in TypeScript, `uuid.UUID` in Python, `UNIQUEIDENTIFIER` in SQL).
6. **All timestamps are ISO 8601 UTC strings** on the wire.
7. **Error responses** always follow: `{ "detail": string }` (FastAPI default).

---

## Authentication

| Route prefix | Auth method | Notes |
|---|---|---|
| `/api/*` (consultant) | `Authorization: Bearer <MSAL token>` | Validated against Azure Entra ID |
| `/api/invites/:token/*` | `X-Invite-Token: <token>` | Public invite flow |
| `/api/enduser/*` | `X-Session-Token: <token>` | End-user session token |

---

## Endpoints

### Upload & Project Creation

#### `POST /api/upload`
Upload a Dataverse solution ZIP and create a project.

**Request:** `multipart/form-data`
- `file`: ZIP file

**Response:** `UploadSolutionResponse`
```typescript
// Source: frontend/src/types/upload.ts
{
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
```

---

### App Discovery & Selection

#### `GET /api/projects/{project_id}/apps`
List apps discovered in the uploaded solution.

**Response:** `DiscoveredAppsResponse`
```typescript
// Source: frontend/src/types/appModule.ts
{
  project_id: string;
  solution_display_name: string;
  apps: DiscoveredApp[];
  warnings: string[];
}
```

#### `POST /api/projects/{project_id}/apps/select`
Select apps for walkthrough generation.

**Request:** `AppSelectionRequest`
```typescript
{ app_unique_names: string[] }
```

**Response:** `AppSelectionResponse`
```typescript
{ project_id: string; selected_count: number }
```

---

### Workflow Review

#### `GET /api/projects/{project_id}/pipeline/{run_id}/workflows`
Get AI-proposed workflows for consultant review.

**Response:** `ProposedWorkflowsResponse`
```typescript
// Source: frontend/src/types/workflow.ts
{
  run_id: string;
  workflows: ProposedWorkflow[];
}
// ProposedWorkflow shape:
{
  id: string;
  name: string;
  description: string;
  primary_entity: string;
  related_entities: string[];
  estimated_steps: number;
  ai_recommended: boolean;
  confidence: number;       // 0.0–1.0
  gap_warning?: string | null;
}
```

#### `POST /api/projects/{project_id}/workflows/confirm`
Confirm selected workflows and start the full pipeline.

**Request:**
```typescript
{ workflow_ids: string[] }
```

**Response:** `WorkflowConfirmResponse`
```typescript
{ run_id: string; sse_url: string }
```

---

### Pipeline & SSE

#### `POST /api/projects/{project_id}/pipeline/run`
Start a pipeline run (skips workflow review step).

**Response:** `PipelineStartResponse`
```typescript
{ run_id: string; sse_url: string }
```

#### `GET /api/pipeline/{run_id}/events` *(SSE)*
Real-time pipeline progress stream.

**Event shape:** `PipelineEvent`
```typescript
// Source: frontend/src/lib/sse.ts + frontend/src/types/pipeline.ts
{
  event_type: "pipeline_started" | "pipeline_completed" | "pipeline_failed"
            | "agent_started" | "agent_progress" | "agent_completed" | "agent_failed"
            | "validation_started" | "validation_passed" | "validation_failed"
            | "heartbeat";
  run_id: string;
  project_id: string;
  stage: "queued" | "agent_1_entity_analysis" | "agent_2_walkthrough_generation"
       | "agent_3_documentation_generation" | "validation" | "completed" | "failed";
  timestamp: string;
  agent?: { agent_number: 1 | 2 | 3; agent_name: string } | null;
  progress?: {
    current_item: string;
    items_completed: number;
    items_total: number;
    message: string;
  } | null;
  error_message?: string | null;
  result_summary?: Record<string, unknown> | null;
}
```

---

### Training Content

#### `GET /api/projects/{project_id}/training/apps`
List all training apps for a project.

#### `GET /api/projects/{project_id}/training/apps/{app_unique_name}`
Get full training content for an app (screens, step layouts, documentation).

#### `PUT /api/projects/{project_id}/training/apps/{app_unique_name}/tracks/{track_id}/steps/visibility`
Toggle step visibility (consultant editing).

**Request:**
```typescript
{ step_ids: string[]; visible: boolean }
```

---

### App Tracks

#### `GET /api/projects/{project_id}/tracks`
List all app tracks for a project.

#### `GET /api/projects/{project_id}/tracks/{track_id}`
Get track detail with steps.

---

### Walkthrough Progress (End-User)

#### `POST /api/invites/{token}/validate`
Validate an invite token and return project context.

#### `POST /api/invites/{token}/identity`
Capture end-user name/email after invite validation.

#### `GET /api/projects/{project_id}/tracks/{track_id}/progress`
Get end-user progress for a track.

#### `POST /api/projects/{project_id}/tracks/{track_id}/progress`
Mark a step as complete.

**Request:**
```typescript
{ step_id: string; completed: boolean }
```

#### `GET /api/projects/{project_id}/progress`
Overall progress across all tracks for the current end-user.

---

### Seats & Invites

#### `POST /api/projects/{project_id}/invites`
Create a new invite link.

**Request:**
```typescript
{
  max_uses?: number | null;
  expires_at?: string | null;   // ISO 8601
}
```

#### `GET /api/projects/{project_id}/invites`
List all invite links for a project.

#### `GET /api/projects/{project_id}/seats`
List all seat assignments.

#### `GET /api/projects/{project_id}/seats/summary`
Seat usage summary (total, used, available).

---

### Consent & GDPR

#### `GET /api/consent/content`
Get current versioned consent policy texts.

#### `POST /api/consent/{seat_id}/accept`
Record consent acceptance for a seat.

#### `DELETE /api/projects/{project_id}/enduser-data`
GDPR bulk delete — all end-user data for a project.

#### `DELETE /api/projects/{project_id}/end-users/{seat_id}`
GDPR individual delete for a single seat.

---

### Branding

#### `POST /api/projects/{project_id}/logo`
Upload a project logo.

**Request:** `multipart/form-data`
- `file`: image file

**Response:**
```typescript
{ logo_url: string }
```

#### `PUT /api/projects/{project_id}/brand-settings`
Update brand colours and settings.

**Request/Response shape:** `BrandSettings`
```typescript
// Source: frontend/src/types/brand.ts
{
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text_color: string;
  background_color: string;
  logo_url?: string | null;
}
```

---

### Adoption Dashboard

#### `GET /api/projects/{project_id}/adoption`
Aggregate adoption metrics for a project.

**Response:** `AdoptionDashboardData`
```typescript
// Source: frontend/src/types/adoptionDashboard.ts
{
  total_enrolled: number;
  overall_completion_rate: number;   // 0.0–1.0
  tracks: TrackAdoptionMetric[];
}
// TrackAdoptionMetric:
{
  track_id: string;
  track_name: string;
  enrolled_count: number;
  completion_rate: number;
  steps_completed_total: number;
  steps_total: number;
}
```

---

## Database ↔ API Mapping

| Table | Primary API owner | Notes |
|---|---|---|
| `projects` | `/api/upload` | Created on solution upload |
| `entities`, `entity_fields`, `entity_forms`, `entity_views`, `entity_business_rules` | Pipeline Agent 1 | Read-only via training content endpoints |
| `pipeline_runs`, `pipeline_events` | `/api/pipeline/*` | Written by pipeline, read via SSE |
| `proposed_workflows` | `/api/projects/{id}/pipeline/{runId}/workflows` | Written by Agent 1 |
| `app_tracks`, `training_content` | Pipeline Agents 2 & 3 | Read via training endpoints |
| `invite_links`, `seat_assignments` | `/api/projects/{id}/invites`, `/api/projects/{id}/seats` | — |
| `end_user_sessions`, `walkthrough_progress` | `/api/invites/*`, `/api/projects/{id}/tracks/{id}/progress` | End-user flow |
| `consent_records`, `consent_content` | `/api/consent/*` | Immutable consent log |
| `brand_settings` | `/api/projects/{id}/brand-settings` | — |
| `gdpr_audit_logs` | `/api/projects/{id}/enduser-data` | Written on deletion |
| `app_selections`, `app_modules` | `/api/projects/{id}/apps/*` | — |

---

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-03-14 | Initial contract document created | backend-agent |
