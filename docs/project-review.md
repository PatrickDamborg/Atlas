# Atlas Full Project Review

**Date:** 2026-03-14
**Reviewers:** UX/UI Agent, Training Expert Agent, Backend Agent, Frontend Agent
**Project State:** Architecture ~95% complete, backend implementation ~5%, frontend implementation ~95%

---

## Executive Summary

Atlas is a well-architected, specification-first Dynamics 365 training platform. The frontend is nearly complete (~95% implemented across all feature areas), the database schema and API contract are comprehensive, but the backend has almost zero functional code. The project is ready for backend implementation to begin immediately.

**Key numbers across all audits:**

| Severity | Backend | Frontend | UX/UI | Training | Total |
|----------|---------|----------|-------|----------|-------|
| Critical | 4 | 5 | 4 | 4 | **17** |
| Major | 7 | 8 | 8 | 6 | **29** |
| Minor | 11 | 10 | 10 | 6 | **37** |
| Positive | 10 | 10 | 8 | 7 | **35** |

---

## Critical Issues (Must Fix)

### Backend — Nothing Works Yet

| # | Issue | Detail |
|---|-------|--------|
| B-C1 | No backend code | Only `config.py` exists. No `main.py`, no routers, no schemas, no database module. Zero of ~40 frontend API calls have a backend. |
| B-C2 | Deployment will fail | `deploy-backend.yml` references `app.main:app` which does not exist. |
| B-C3 | No database connection module | No pyodbc connection pool. Nothing can query the database. |
| B-C4 | No authentication module | No JWT validation, no Entra ID integration, no session token validation. |

### Frontend — Bugs & Auth Gaps

| # | Issue | Files |
|---|-------|-------|
| F-C1 | Root layout may cause hydration mismatch | `app/layout.tsx` — no `suppressHydrationWarning` with MSAL sessionStorage |
| F-C2 | Pipeline SSE is unauthenticated | `lib/sse.ts` — `connectPipelineSSE` calls `fetch()` directly without MSAL token, will 401 |
| F-C3 | PipelineProgress fires callbacks on every render | `PipelineProgress.tsx` — `onComplete`/`onFailed` called during render, not in `useEffect` |
| F-C4 | AppSelectionResponse type vs contract mismatch | Contract: `{ project_id, selected_count }`. Type: `{ project_id, selected_apps[], selected_at }` |
| F-C5 | AdoptionDashboardResponse type vs contract mismatch | Completely different field names between contract and TypeScript types |

### UX/UI — Styling & Component Issues

| # | Issue | Files |
|---|-------|-------|
| U-C1 | Dashboard uses inline styles exclusively | `app/page.tsx` — the landing page violates makeStyles-only rule |
| U-C2 | 4 project pages missing AuthGuard | `adoption/`, `invites/`, `entities/`, `entities/[id]` pages render without auth guard |
| U-C3 | Duplicate CoachMark implementations | 3 separate implementations exist; neither standalone component is used by the active overlay |
| U-C4 | D365 shell hardcodes colors | NavBar, CommandBar, SitemapNav use hex values instead of BrandConfig tokens |

### Training & Adoption — Will Prevent Adoption

| # | Issue | Impact |
|---|-------|--------|
| T-C1 | No consultant onboarding | First-time users see a file upload with no context about what Atlas does or the multi-step flow |
| T-C2 | No "what happens next" guidance | Each step (upload, app selection, pipeline) terminates without a clear CTA for the next step |
| T-C3 | No pre-training orientation for end users | End users go from consent directly to walkthrough with zero orientation |
| T-C4 | Walkthrough progress not connected to API | `StepViewer` manages progress in local state only — progress is lost on browser close, adoption dashboard shows nothing |

---

## Major Issues

### Backend — Contract & Schema Gaps

| # | Issue | Detail |
|---|-------|--------|
| B-M1 | ~23 endpoints missing from API contract | Frontend calls endpoints not documented in `api-contract.md` (project listing, invite revocation, seat management, GDPR logs, entity listing, pipeline status, brand GET, etc.) |
| B-M2 | Response shapes diverge from TypeScript types | AppSelection, WorkflowConfirm, PipelineStart, AdoptionDashboard, BrandSettings, StepVisibility, WalkthroughProgress — all have field name or structure mismatches |
| B-M3 | `walkthrough_progress.app_track_id` is NVARCHAR, not UUID | Type mismatch with `app_tracks.id` (UNIQUEIDENTIFIER). No FK constraint. |
| B-M4 | CASCADE delete chains will fail | `proposed_workflows`, `app_tracks`, `end_user_sessions`, `consent_records`, `walkthrough_progress` lack CASCADE on their FKs — project deletion will be blocked |
| B-M5 | `pipeline_runs.app_unique_name` alignment | Contract doesn't mention it in request, TypeScript requires it, DB column is NOT NULL |
| B-M6 | No GET endpoint for brand settings in contract | Frontend calls `GET /api/projects/{id}/brand-settings` but contract only documents PUT |
| B-M7 | CORS_ORIGINS env var format | `.env.example` uses JSON array string, Pydantic may not parse it without custom validator |

### Frontend — Code Quality

| # | Issue | Detail |
|---|-------|--------|
| F-M1 | 273 inline styles across 54 files | Hardcoded pixel values violate makeStyles-only and tokens-only rules |
| F-M2 | 4 `as unknown as` casts | `api.ts` and `D365ChromeLayout.tsx` — type safety bypassed |
| F-M3 | 5 eslint-disable for exhaustive-deps | Potential stale closure bugs in hooks and components |
| F-M4 | Missing AuthGuard on 7 consultant routes | select-app, training, training/[app], entities, entities/[id], adoption, invites |
| F-M5 | Stale closure in useWalkthroughProgress | `completeCurrentStep` reads state from closure that may be outdated during rapid clicks |
| F-M6 | `documentation_pages: unknown[]` | Zero type safety for documentation data |
| F-M7 | Backend URL hardcoded to localhost | `next.config.ts` — no env variable for staging/preview environments |
| F-M8 | Type packages in dependencies | `@types/node`, `@types/react`, `typescript` should be devDependencies |

### UX/UI — Accessibility & Consistency

| # | Issue | Detail |
|---|-------|--------|
| U-M1 | D365NavBar uses divs for interactive controls | Settings, Help, Avatar are `<div>` with onClick — not keyboard accessible |
| U-M2 | Duplicate D365CommandBar components | Shell version uses raw HTML; form version uses Fluent UI properly |
| U-M3 | Operator precedence issue in WalkthroughSequence | `as` cast with `?? "auto"` fallback may not behave as intended |
| U-M4 | Side-effect during render in StepViewer | `syncWithStep` runs inline during render, not in useEffect |
| U-M5 | 15+ components mix inline styles with makeStyles | Establishes precedent undermining the styling constraint |
| U-M6 | CoachMarkOverlay lacks focus trap | Tab escapes dialog into background content |
| U-M7 | PipelineProgress auto-start is broken | `hasAutoStarted` callback defined but never called |
| U-M8 | No project listing on dashboard | No way to return to previously created projects |

### Training & Adoption — Reduces Adoption

| # | Issue | Detail |
|---|-------|--------|
| T-M1 | Consent screen cognitive overload | 3 full policy documents + 4 checkboxes before accessing training |
| T-M2 | Adoption dashboard is output-only | No benchmarks, trends, recommendations, or drill-down |
| T-M3 | Empty states are dead ends | No action buttons/links to guide users to the next step |
| T-M4 | Workflow review assumes domain expertise | Confidence scores, gap warnings, entity names with no contextual help |
| T-M5 | No error recovery guidance for pipeline failures | "Retry" button with no explanation of what failed or whether retry will help |
| T-M6 | Learning objectives shown once then forgotten | Objectives display on step 1 only, never referenced again |

---

## Minor Issues (Summary)

### Backend (11 items)
- No unique constraint enforcing single `is_current` consent content row
- No `updated_at` trigger on `app_tracks`
- Large JSON blobs in `training_content` without compression considerations
- `entity_fields.logical_name` index should be unique per entity
- No pagination on most list endpoints
- Pipeline heartbeat interval undocumented
- No health check endpoint
- pyodbc sync driver in async FastAPI requires `asyncio.to_thread()` wrapper
- No rate limiting on expensive endpoints (upload, pipeline)
- Deployment script may not copy `main.py` correctly
- `.env.example` CORS format may not parse

### Frontend (10 items)
- Hardcoded gap in InviteLandingPage useStyles
- String concatenation instead of `mergeClasses()`
- Duplicate D365CommandBar components
- Dependency cycle in `useOverlayPositioning`
- No SSE reconnection logic
- Auth callback missing MSAL init error handling
- WorkflowSelectionRequest field naming inconsistency
- ConsentPromptScreen has hardcoded pixels in makeStyles
- Missing `aria-busy` on loading states (5 components)
- No `rehype-sanitize` for react-markdown

### UX/UI (10 items)
- Template literal for padding shorthand
- Hardcoded fontWeight/fontSize in OverviewCards
- Custom div progress bar instead of Fluent ProgressBar
- Hardcoded rgba for overlay backdrops
- Root layout body inline style
- LoginPage mixes inline styles with tokens
- UserProgressTable inline icon colors
- StepEditorPanel reuses `headerLeft` class for right side
- Missing empty state icons in some components
- No responsive design (desktop-only, acceptable for MVP)

### Training (6 items)
- CoachMark missing aria-live announcements on step change
- MarkdownAnnotationEditor has no writing guidance or placeholder examples
- Invite management has no strategy guidance
- Brand settings have no preview of end-user experience
- No keyboard shortcut documentation for walkthrough navigation
- Session token in sessionStorage lost on tab close (should use localStorage)

---

## What's Done Well (Highlights)

### Architecture & Planning
- **Database schema** is thorough — 21 tables, good indexing, UUID PKs, UTC timestamps, GDPR audit logging decoupled from FKs
- **TypeScript types** are comprehensive — 16 files, 60+ interfaces, zero `any`, zero `@ts-ignore`, strict mode
- **API client** cleanly separates consultant auth, public, and end-user auth patterns
- **Agent-driven development** framework is well-structured for parallel implementation

### Frontend Quality
- **All four UI states** (loading, error, empty, success) handled consistently across components
- **Cancellation patterns** — every async useEffect uses `let cancelled = false`, SSE uses AbortController
- **Optimistic updates** with server reconciliation in step visibility, reorder, and progress hooks
- **CoachMark context** uses proper reducer pattern with discriminated union actions
- **MSAL integration** is correctly implemented as singleton with redirect handling
- **SSE parsing** correctly handles buffered reads, multi-line data, and event type backfilling

### UX Quality
- **State coverage** is excellent — spinners with labels, MessageBar errors, icon+heading empty states
- **Keyboard accessibility** in core components — D365SitemapNav, FormTabs, StepCardList, AppSelectionPanel
- **Hook architecture** is clean — single-purpose, well-documented, properly separated

### Training & Adoption Patterns
- **InviteErrorState** differentiates 6 error types with unique recovery guidance — best error component in the codebase
- **Returning user detection** — "Welcome back" vs "Welcome" messaging
- **Pipeline progress** breaks AI processing into 3 understandable stages with anxiety management
- **Completion celebration** — trophy icon, step count, duration, objectives checklist
- **Consent re-consent** handling with policy update detection

---

## Recommended Priority Order

### Phase 1 — Unblock Development
1. Implement `backend/main.py` with FastAPI app, CORS, health check
2. Implement `backend/app/core/database.py` with pyodbc pool + async wrapper
3. Implement `backend/app/core/auth.py` with Entra ID JWT + session token validation
4. Update `docs/api-contract.md` to include all ~23 missing endpoints and fix type mismatches

### Phase 2 — Fix Critical Bugs
5. Fix FK CASCADE gaps in `database/schema.sql` (M4)
6. Fix `walkthrough_progress.app_track_id` type mismatch (M3)
7. Add auth token to `connectPipelineSSE` in `lib/sse.ts` (F-C2)
8. Move PipelineProgress callbacks into useEffect (F-C3)
9. Reconcile TypeScript types with API contract (F-C4, F-C5)
10. Add AuthGuard to all consultant routes (F-M4)

### Phase 3 — Adoption & UX
11. Connect walkthrough progress to API (T-C4)
12. Add consultant onboarding / welcome screen (T-C1)
13. Add "next step" CTAs at each handoff point (T-C2)
14. Convert dashboard page to makeStyles (U-C1)
15. Replace D365 shell hardcoded colors with BrandConfig (U-C4)
16. Consolidate duplicate CoachMark implementations (U-C3)

### Phase 4 — Polish
17. Convert 273 inline styles to makeStyles across 54 files (F-M1)
18. Simplify consent to single checkbox with expandable policies (T-M1)
19. Add project listing to dashboard (U-M8)
20. Add pre-training orientation for end users (T-C3)
21. Make adoption dashboard actionable with benchmarks and recommendations (T-M2)

---

## Files Reviewed

All agents collectively reviewed every file under:
- `frontend/src/` (components, app pages, lib, hooks, contexts, types)
- `backend/` (app, core, config)
- `database/` (schema.sql, migrations)
- `docs/` (api-contract.md, backlog.md)
- `.github/workflows/` (deployment configs)
- Root config files (package.json, tsconfig.json, next.config.ts, .env.example, staticwebapp.config.json)
