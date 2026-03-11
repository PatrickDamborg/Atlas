/**
 * TypeScript types for the AI pipeline SSE progress events.
 *
 * These mirror the backend Pydantic schemas in app/schemas/pipeline.py
 * and the SSE event format from app/api/pipeline.py.
 *
 * The 3-agent pipeline stages:
 *   1. Entity Analyser – analyses entities, relationships, forms, views
 *   2. Walkthrough Generator – generates training walkthrough steps
 *   3. Documentation Generator – produces per-entity reference docs
 */

// ── Pipeline stage identifiers (matches backend PipelineStage enum) ──

export type PipelineStage =
  | "queued"
  | "agent_1_entity_analysis"
  | "agent_2_walkthrough_generation"
  | "agent_3_documentation_generation"
  | "validation"
  | "completed"
  | "failed";

// ── SSE event types (matches backend PipelineEventType enum) ─────────

export type PipelineEventType =
  | "pipeline_started"
  | "pipeline_completed"
  | "pipeline_failed"
  | "agent_started"
  | "agent_progress"
  | "agent_completed"
  | "agent_failed"
  | "validation_started"
  | "validation_passed"
  | "validation_failed"
  | "heartbeat";

// ── Agent stage identifiers (for backward compat and display) ────────

export type AgentStage =
  | "solution_analyzer"
  | "walkthrough_generator"
  | "documentation_generator";

export const AGENT_STAGES: readonly AgentStage[] = [
  "solution_analyzer",
  "walkthrough_generator",
  "documentation_generator",
] as const;

export const AGENT_STAGE_LABELS: Record<AgentStage, string> = {
  solution_analyzer: "Entity Analyser",
  walkthrough_generator: "Walkthrough Generator",
  documentation_generator: "Documentation Generator",
};

export const AGENT_STAGE_DESCRIPTIONS: Record<AgentStage, string> = {
  solution_analyzer:
    "Analysing entities, relationships, forms, views, and business rules",
  walkthrough_generator:
    "Generating interactive training walkthrough steps and annotations",
  documentation_generator:
    "Producing per-entity reference documentation pages",
};

/** Maps agent number (1-3) to the AgentStage key */
export const AGENT_NUMBER_TO_STAGE: Record<number, AgentStage> = {
  1: "solution_analyzer",
  2: "walkthrough_generator",
  3: "documentation_generator",
};

export const STAGE_DISPLAY_NAMES: Record<PipelineStage, string> = {
  queued: "Queued",
  agent_1_entity_analysis: "Analysing Entities",
  agent_2_walkthrough_generation: "Generating Walkthrough",
  agent_3_documentation_generation: "Generating Documentation",
  validation: "Validating Output",
  completed: "Completed",
  failed: "Failed",
};

// ── Event payload types (matches backend Pydantic models) ────────────

export interface AgentInfo {
  agent_number: 1 | 2 | 3;
  agent_name: string;
}

export interface PipelineProgressDetail {
  current_item: string;
  items_completed: number;
  items_total: number;
  message: string;
}

/**
 * Single SSE event from the pipeline endpoint.
 *
 * The backend sends this as the `data:` field of each SSE message,
 * with the `event:` field set to `event_type`.
 */
export interface PipelineEvent {
  event_type: PipelineEventType;
  run_id: string;
  project_id: string;
  stage: PipelineStage;
  timestamp: string; // ISO 8601
  agent?: AgentInfo | null;
  progress?: PipelineProgressDetail | null;
  error_message?: string | null;
  result_summary?: Record<string, unknown> | null;
}

// ── Request / response types ─────────────────────────────────────────

export interface PipelineStartRequest {
  app_unique_name: string;
}

export interface PipelineStartResponse {
  run_id: string;
  project_id: string;
  stage: PipelineStage;
  sse_url: string;
}

export interface PipelineRunStatus {
  run_id: string;
  project_id: string;
  stage: PipelineStage;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  events: PipelineEvent[];
}

// ── Frontend state models ────────────────────────────────────────────

export type StageStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

/** Status of a single agent stage in the UI. */
export interface StageState {
  stage: AgentStage;
  agentNumber: 1 | 2 | 3;
  status: StageStatus;
  message: string;
  progressPercent?: number;
  itemsProcessed?: number;
  itemsTotal?: number;
  errorMessage?: string;
}

/** Overall pipeline state tracked by the frontend hook. */
export interface PipelineState {
  /** Whether the SSE connection is active. */
  connected: boolean;
  /** The unique run identifier. */
  runId: string | null;
  /** Overall pipeline status. */
  status: "idle" | "running" | "completed" | "failed";
  /** Current pipeline stage. */
  currentStage: PipelineStage;
  /** Per-agent stage statuses in order. */
  stages: StageState[];
  /** Top-level error message if pipeline fails. */
  errorMessage: string | null;
  /** All events received so far. */
  events: PipelineEvent[];
  /** Last event timestamp received. */
  lastEventAt: string | null;
}

/** Initial pipeline state factory. */
export function createInitialPipelineState(): PipelineState {
  return {
    connected: false,
    runId: null,
    status: "idle",
    currentStage: "queued",
    stages: AGENT_STAGES.map((stage, i) => ({
      stage,
      agentNumber: (i + 1) as 1 | 2 | 3,
      status: "pending" as StageStatus,
      message: AGENT_STAGE_DESCRIPTIONS[stage],
    })),
    errorMessage: null,
    events: [],
    lastEventAt: null,
  };
}
