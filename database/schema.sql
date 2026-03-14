-- =============================================================================
-- Forge Atlas - Azure SQL Database Schema
-- =============================================================================
-- AI-powered Dynamics 365 training walkthrough generator.
--
-- This schema supports the full Forge Atlas application lifecycle:
--   - Project & solution metadata import from Dataverse
--   - Entity schema storage (fields, forms, views, business rules)
--   - App module discovery and track configuration
--   - AI pipeline orchestration (3-agent walkthrough generation)
--   - End-user seat management via invite links
--   - Walkthrough delivery and progress tracking
--   - GDPR compliance (consent, audit logs, data deletion)
--   - Brand customization per project
--
-- Conventions:
--   - Primary keys: UNIQUEIDENTIFIER with NEWID() default
--   - Strings: NVARCHAR (Unicode) with explicit lengths
--   - Booleans: BIT with 0/1 defaults
--   - Timestamps: DATETIME2 with SYSUTCDATETIME() defaults where appropriate
--   - JSON columns: NVARCHAR(MAX) storing JSON payloads
--   - All tables use singular names
--
-- Target: Azure SQL Database (compatible with SQL Server 2016+)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Projects
-- ---------------------------------------------------------------------------
-- Top-level container representing one Dynamics 365 solution import.
-- Created by a consultant authenticated via Microsoft Entra ID.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[projects] (
    [id]                     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [name]                   NVARCHAR(255)    NOT NULL,
    [description]            NVARCHAR(MAX)    NULL,
    [solution_unique_name]   NVARCHAR(255)    NULL,
    [solution_display_name]  NVARCHAR(255)    NULL,
    [solution_version]       NVARCHAR(50)     NULL,
    [publisher]              NVARCHAR(255)    NULL,
    [entity_count]           INT              NOT NULL DEFAULT 0,
    [seat_limit]             INT              NOT NULL DEFAULT 50,
    [created_at]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [created_by]             NVARCHAR(255)    NOT NULL,  -- Entra ID object ID of the consultant

    CONSTRAINT [PK_projects] PRIMARY KEY ([id])
);

CREATE INDEX [IX_projects_created_by] ON [dbo].[projects] ([created_by]);
CREATE INDEX [IX_projects_created_at] ON [dbo].[projects] ([created_at] DESC);


-- ---------------------------------------------------------------------------
-- 2. Entities
-- ---------------------------------------------------------------------------
-- Dataverse entities (tables) belonging to a project/solution.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[entities] (
    [entity_id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]             UNIQUEIDENTIFIER NOT NULL,
    [logical_name]           NVARCHAR(255)    NOT NULL,
    [display_name]           NVARCHAR(255)    NOT NULL,
    [plural_name]            NVARCHAR(255)    NOT NULL,
    [description]            NVARCHAR(MAX)    NULL,
    [is_custom_entity]       BIT              NOT NULL DEFAULT 0,
    [primary_id_attribute]   NVARCHAR(255)    NOT NULL,
    [primary_name_attribute] NVARCHAR(255)    NOT NULL,
    [field_count]            INT              NOT NULL DEFAULT 0,
    [form_count]             INT              NOT NULL DEFAULT 0,
    [view_count]             INT              NOT NULL DEFAULT 0,
    [business_rule_count]    INT              NOT NULL DEFAULT 0,

    CONSTRAINT [PK_entities] PRIMARY KEY ([entity_id]),
    CONSTRAINT [FK_entities_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_entities_project_id] ON [dbo].[entities] ([project_id]);
CREATE INDEX [IX_entities_logical_name] ON [dbo].[entities] ([project_id], [logical_name]);


-- ---------------------------------------------------------------------------
-- 3. Entity Fields
-- ---------------------------------------------------------------------------
-- Columns/attributes on a Dataverse entity.
-- Option-set values and lookup targets stored as JSON.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[entity_fields] (
    [id]                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [entity_id]           UNIQUEIDENTIFIER NOT NULL,
    [logical_name]        NVARCHAR(255)    NOT NULL,
    [display_name]        NVARCHAR(255)    NOT NULL,
    [field_type]          NVARCHAR(100)    NOT NULL,
    [description]         NVARCHAR(MAX)    NULL,
    [is_required]         BIT              NOT NULL DEFAULT 0,
    [is_primary_name]     BIT              NOT NULL DEFAULT 0,
    [max_length]          INT              NULL,
    [options_json]        NVARCHAR(MAX)    NULL,   -- JSON array of {value, label}
    [target_entities_json] NVARCHAR(MAX)   NULL,   -- JSON array of logical names for lookups

    CONSTRAINT [PK_entity_fields] PRIMARY KEY ([id]),
    CONSTRAINT [FK_entity_fields_entity] FOREIGN KEY ([entity_id])
        REFERENCES [dbo].[entities] ([entity_id]) ON DELETE CASCADE
);

CREATE INDEX [IX_entity_fields_entity_id] ON [dbo].[entity_fields] ([entity_id]);
CREATE INDEX [IX_entity_fields_logical_name] ON [dbo].[entity_fields] ([entity_id], [logical_name]);


-- ---------------------------------------------------------------------------
-- 4. Entity Forms
-- ---------------------------------------------------------------------------
-- Dataverse form definitions associated with an entity.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[entity_forms] (
    [id]          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [entity_id]   UNIQUEIDENTIFIER NOT NULL,
    [form_id]     NVARCHAR(100)    NOT NULL,   -- Form ID from Dataverse (GUID as string)
    [name]        NVARCHAR(255)    NOT NULL,
    [form_type]   NVARCHAR(100)    NOT NULL,
    [description] NVARCHAR(MAX)    NULL,
    [tab_count]   INT              NOT NULL DEFAULT 0,
    [field_count] INT              NOT NULL DEFAULT 0,

    CONSTRAINT [PK_entity_forms] PRIMARY KEY ([id]),
    CONSTRAINT [FK_entity_forms_entity] FOREIGN KEY ([entity_id])
        REFERENCES [dbo].[entities] ([entity_id]) ON DELETE CASCADE
);

CREATE INDEX [IX_entity_forms_entity_id] ON [dbo].[entity_forms] ([entity_id]);


-- ---------------------------------------------------------------------------
-- 5. Entity Views
-- ---------------------------------------------------------------------------
-- Saved queries / views defined on a Dataverse entity.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[entity_views] (
    [id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [entity_id]       UNIQUEIDENTIFIER NOT NULL,
    [saved_query_id]  NVARCHAR(100)    NOT NULL,   -- SavedQuery ID from Dataverse
    [name]            NVARCHAR(255)    NOT NULL,
    [description]     NVARCHAR(MAX)    NULL,
    [is_default]      BIT              NOT NULL DEFAULT 0,
    [column_count]    INT              NOT NULL DEFAULT 0,
    [columns_json]    NVARCHAR(MAX)    NULL,   -- JSON array of column definitions

    CONSTRAINT [PK_entity_views] PRIMARY KEY ([id]),
    CONSTRAINT [FK_entity_views_entity] FOREIGN KEY ([entity_id])
        REFERENCES [dbo].[entities] ([entity_id]) ON DELETE CASCADE
);

CREATE INDEX [IX_entity_views_entity_id] ON [dbo].[entity_views] ([entity_id]);


-- ---------------------------------------------------------------------------
-- 6. Entity Business Rules
-- ---------------------------------------------------------------------------
-- Business rules (real-time workflows) defined on a Dataverse entity.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[entity_business_rules] (
    [id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [entity_id]       UNIQUEIDENTIFIER NOT NULL,
    [workflow_id]     NVARCHAR(100)    NOT NULL,   -- Workflow ID from Dataverse
    [name]            NVARCHAR(255)    NOT NULL,
    [description]     NVARCHAR(MAX)    NULL,
    [scope]           NVARCHAR(100)    NOT NULL,
    [conditions_json] NVARCHAR(MAX)    NULL,   -- JSON array of rule conditions
    [actions_json]    NVARCHAR(MAX)    NULL,   -- JSON array of rule actions

    CONSTRAINT [PK_entity_business_rules] PRIMARY KEY ([id]),
    CONSTRAINT [FK_entity_business_rules_entity] FOREIGN KEY ([entity_id])
        REFERENCES [dbo].[entities] ([entity_id]) ON DELETE CASCADE
);

CREATE INDEX [IX_entity_business_rules_entity_id] ON [dbo].[entity_business_rules] ([entity_id]);


-- ---------------------------------------------------------------------------
-- 7. App Modules
-- ---------------------------------------------------------------------------
-- Dynamics 365 model-driven apps discovered in the solution.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[app_modules] (
    [id]               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]       UNIQUEIDENTIFIER NOT NULL,
    [app_unique_name]  NVARCHAR(255)    NOT NULL,
    [display_name]     NVARCHAR(255)    NOT NULL,
    [description]      NVARCHAR(MAX)    NULL,
    [app_id_dataverse] NVARCHAR(100)    NULL,   -- AppModule ID in Dataverse
    [entity_count]     INT              NOT NULL DEFAULT 0,
    [entities_json]    NVARCHAR(MAX)    NULL,   -- JSON array of entity logical names
    [sitemap_json]     NVARCHAR(MAX)    NULL,   -- JSON sitemap structure

    CONSTRAINT [PK_app_modules] PRIMARY KEY ([id]),
    CONSTRAINT [FK_app_modules_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_app_modules_project_id] ON [dbo].[app_modules] ([project_id]);
CREATE INDEX [IX_app_modules_project_app] ON [dbo].[app_modules] ([project_id], [app_unique_name]);


-- ---------------------------------------------------------------------------
-- 8. Pipeline Runs
-- ---------------------------------------------------------------------------
-- Tracks each execution of the 3-agent AI pipeline for an app.
-- Created before app_tracks so tracks can reference latest run.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[pipeline_runs] (
    [run_id]           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]       UNIQUEIDENTIFIER NOT NULL,
    [app_unique_name]  NVARCHAR(255)    NOT NULL,
    [stage]            NVARCHAR(100)    NOT NULL DEFAULT 'queued',
        -- Valid values: queued, agent_1_entity_analysis,
        -- agent_2_walkthrough_generation, agent_3_documentation_generation,
        -- validation, completed, failed
    [started_at]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [completed_at]     DATETIME2        NULL,
    [error_message]    NVARCHAR(MAX)    NULL,
    [result_json]      NVARCHAR(MAX)    NULL,   -- Full pipeline output on completion

    CONSTRAINT [PK_pipeline_runs] PRIMARY KEY ([run_id]),
    CONSTRAINT [FK_pipeline_runs_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_pipeline_runs_project_id] ON [dbo].[pipeline_runs] ([project_id]);
CREATE INDEX [IX_pipeline_runs_project_app] ON [dbo].[pipeline_runs] ([project_id], [app_unique_name]);
CREATE INDEX [IX_pipeline_runs_stage] ON [dbo].[pipeline_runs] ([stage]);


-- ---------------------------------------------------------------------------
-- 9. App Tracks
-- ---------------------------------------------------------------------------
-- Walkthrough tracks within an app module. Each track groups a set of
-- entities into a learning path.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[app_tracks] (
    [id]                     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]             UNIQUEIDENTIFIER NOT NULL,
    [app_module_id]          UNIQUEIDENTIFIER NOT NULL,
    [app_unique_name]        NVARCHAR(255)    NOT NULL,
    [display_name]           NVARCHAR(255)    NOT NULL,
    [description]            NVARCHAR(MAX)    NULL,
    [is_default]             BIT              NOT NULL DEFAULT 0,
    [entity_count]           INT              NOT NULL DEFAULT 0,
    [status]                 NVARCHAR(50)     NOT NULL DEFAULT 'draft',
    [entity_names_json]      NVARCHAR(MAX)    NULL,   -- JSON array of entity logical names
    [latest_pipeline_run_id] UNIQUEIDENTIFIER NULL,
    [created_at]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_app_tracks] PRIMARY KEY ([id]),
    CONSTRAINT [FK_app_tracks_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_app_tracks_app_module] FOREIGN KEY ([app_module_id])
        REFERENCES [dbo].[app_modules] ([id]),
    CONSTRAINT [FK_app_tracks_latest_run] FOREIGN KEY ([latest_pipeline_run_id])
        REFERENCES [dbo].[pipeline_runs] ([run_id])
);

CREATE INDEX [IX_app_tracks_project_id] ON [dbo].[app_tracks] ([project_id]);
CREATE INDEX [IX_app_tracks_app_module_id] ON [dbo].[app_tracks] ([app_module_id]);
CREATE INDEX [IX_app_tracks_project_app] ON [dbo].[app_tracks] ([project_id], [app_unique_name]);


-- ---------------------------------------------------------------------------
-- 10. App Selections
-- ---------------------------------------------------------------------------
-- Records which apps a consultant selected for walkthrough generation.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[app_selections] (
    [id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]      UNIQUEIDENTIFIER NOT NULL,
    [app_unique_name] NVARCHAR(255)    NOT NULL,
    [display_name]    NVARCHAR(255)    NOT NULL,
    [entity_count]    INT              NOT NULL DEFAULT 0,
    [selected_at]     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_app_selections] PRIMARY KEY ([id]),
    CONSTRAINT [FK_app_selections_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_app_selections_project_id] ON [dbo].[app_selections] ([project_id]);
CREATE INDEX [IX_app_selections_project_app] ON [dbo].[app_selections] ([project_id], [app_unique_name]);


-- ---------------------------------------------------------------------------
-- 11. Pipeline Events
-- ---------------------------------------------------------------------------
-- Granular event log for pipeline run progress and diagnostics.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[pipeline_events] (
    [id]                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [run_id]              UNIQUEIDENTIFIER NOT NULL,
    [event_type]          NVARCHAR(100)    NOT NULL,
    [stage]               NVARCHAR(100)    NOT NULL,
    [agent_number]        INT              NULL,
    [agent_name]          NVARCHAR(200)    NULL,
    [progress_json]       NVARCHAR(MAX)    NULL,   -- Structured progress data
    [error_message]       NVARCHAR(MAX)    NULL,
    [result_summary_json] NVARCHAR(MAX)    NULL,
    [timestamp]           DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_pipeline_events] PRIMARY KEY ([id]),
    CONSTRAINT [FK_pipeline_events_run] FOREIGN KEY ([run_id])
        REFERENCES [dbo].[pipeline_runs] ([run_id]) ON DELETE CASCADE
);

CREATE INDEX [IX_pipeline_events_run_id] ON [dbo].[pipeline_events] ([run_id]);
CREATE INDEX [IX_pipeline_events_run_timestamp] ON [dbo].[pipeline_events] ([run_id], [timestamp]);


-- ---------------------------------------------------------------------------
-- 12. Proposed Workflows
-- ---------------------------------------------------------------------------
-- AI-generated workflow proposals for a pipeline run.
-- Consultants can select and edit these before final generation.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[proposed_workflows] (
    [id]                          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]                  UNIQUEIDENTIFIER NOT NULL,
    [run_id]                      UNIQUEIDENTIFIER NOT NULL,
    [name]                        NVARCHAR(255)    NOT NULL,
    [description]                 NVARCHAR(MAX)    NOT NULL,
    [primary_entity]              NVARCHAR(255)    NOT NULL,
    [primary_entity_display_name] NVARCHAR(255)    NOT NULL,
    [related_entities_json]       NVARCHAR(MAX)    NULL,   -- JSON array of related entity names
    [estimated_steps]             INT              NOT NULL DEFAULT 0,
    [ai_recommended]              BIT              NOT NULL DEFAULT 0,
    [sort_order]                  INT              NOT NULL DEFAULT 0,
    [tags_json]                   NVARCHAR(MAX)    NULL,   -- JSON array of tag strings
    [confidence]                  FLOAT            NOT NULL DEFAULT 0.0,
    [gap_warning]                 NVARCHAR(MAX)    NULL,
    [is_selected]                 BIT              NOT NULL DEFAULT 0,
    [edited_name]                 NVARCHAR(255)    NULL,
    [edited_description]          NVARCHAR(MAX)    NULL,

    CONSTRAINT [PK_proposed_workflows] PRIMARY KEY ([id]),
    CONSTRAINT [FK_proposed_workflows_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_proposed_workflows_run] FOREIGN KEY ([run_id])
        REFERENCES [dbo].[pipeline_runs] ([run_id])
);

CREATE INDEX [IX_proposed_workflows_project_id] ON [dbo].[proposed_workflows] ([project_id]);
CREATE INDEX [IX_proposed_workflows_run_id] ON [dbo].[proposed_workflows] ([run_id]);


-- ---------------------------------------------------------------------------
-- 13. Training Content
-- ---------------------------------------------------------------------------
-- Final AI-generated training output for an app, produced by the pipeline.
-- Contains all walkthrough tracks, screens, layouts, and documentation.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[training_content] (
    [id]                        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]                UNIQUEIDENTIFIER NOT NULL,
    [app_unique_name]           NVARCHAR(255)    NOT NULL,
    [pipeline_run_id]           UNIQUEIDENTIFIER NOT NULL,
    [completed_at]              DATETIME2        NULL,
    [brand_json]                NVARCHAR(MAX)    NULL,   -- Brand settings snapshot
    [screens_json]              NVARCHAR(MAX)    NOT NULL,   -- Screen definitions
    [step_layouts_json]         NVARCHAR(MAX)    NOT NULL,   -- Step layout data
    [sitemap_structure_json]    NVARCHAR(MAX)    NOT NULL,   -- App sitemap
    [command_bar_actions_json]  NVARCHAR(MAX)    NOT NULL,   -- Command bar config
    [solution_overview]         NVARCHAR(MAX)    NOT NULL,   -- Generated overview text
    [tracks_json]               NVARCHAR(MAX)    NOT NULL,   -- Array of WalkthroughTrack
    [documentation_pages_json]  NVARCHAR(MAX)    NOT NULL,   -- Generated docs
    [warnings_json]             NVARCHAR(MAX)    NULL,   -- Validation warnings

    CONSTRAINT [PK_training_content] PRIMARY KEY ([id]),
    CONSTRAINT [FK_training_content_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_training_content_pipeline_run] FOREIGN KEY ([pipeline_run_id])
        REFERENCES [dbo].[pipeline_runs] ([run_id])
);

CREATE INDEX [IX_training_content_project_id] ON [dbo].[training_content] ([project_id]);
CREATE INDEX [IX_training_content_project_app] ON [dbo].[training_content] ([project_id], [app_unique_name]);
CREATE INDEX [IX_training_content_pipeline_run_id] ON [dbo].[training_content] ([pipeline_run_id]);


-- ---------------------------------------------------------------------------
-- 14. Invite Links
-- ---------------------------------------------------------------------------
-- Shareable links that consultants create to grant end-user access.
-- Each link can have a use limit and expiry.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[invite_links] (
    [id]          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]  UNIQUEIDENTIFIER NOT NULL,
    [token]       NVARCHAR(255)    NOT NULL,
    [invite_url]  NVARCHAR(500)    NOT NULL,
    [label]       NVARCHAR(255)    NULL,
    [status]      NVARCHAR(50)     NOT NULL DEFAULT 'active',
        -- Valid values: active, expired, revoked, exhausted
    [max_uses]    INT              NULL,
    [use_count]   INT              NOT NULL DEFAULT 0,
    [expires_at]  DATETIME2        NULL,
    [created_by]  NVARCHAR(255)    NOT NULL,
    [created_at]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [revoked_at]  DATETIME2        NULL,

    CONSTRAINT [PK_invite_links] PRIMARY KEY ([id]),
    CONSTRAINT [FK_invite_links_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [UQ_invite_links_token] UNIQUE ([token])
);

CREATE INDEX [IX_invite_links_project_id] ON [dbo].[invite_links] ([project_id]);
CREATE INDEX [IX_invite_links_token] ON [dbo].[invite_links] ([token]);
CREATE INDEX [IX_invite_links_status] ON [dbo].[invite_links] ([status]);


-- ---------------------------------------------------------------------------
-- 15. Seat Assignments
-- ---------------------------------------------------------------------------
-- Tracks which end users have been granted access to a project.
-- Linked to the invite link they used (if any).
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[seat_assignments] (
    [id]                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]        UNIQUEIDENTIFIER NOT NULL,
    [invite_link_id]    UNIQUEIDENTIFIER NULL,
    [user_email]        NVARCHAR(320)    NOT NULL,
    [user_display_name] NVARCHAR(255)    NULL,
    [is_active]         BIT              NOT NULL DEFAULT 1,
    [consent_given_at]  DATETIME2        NULL,
    [assigned_at]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [revoked_at]        DATETIME2        NULL,

    CONSTRAINT [PK_seat_assignments] PRIMARY KEY ([id]),
    CONSTRAINT [FK_seat_assignments_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_seat_assignments_invite_link] FOREIGN KEY ([invite_link_id])
        REFERENCES [dbo].[invite_links] ([id])
);

CREATE INDEX [IX_seat_assignments_project_id] ON [dbo].[seat_assignments] ([project_id]);
CREATE INDEX [IX_seat_assignments_user_email] ON [dbo].[seat_assignments] ([user_email]);
CREATE INDEX [IX_seat_assignments_project_email] ON [dbo].[seat_assignments] ([project_id], [user_email]);
CREATE INDEX [IX_seat_assignments_invite_link_id] ON [dbo].[seat_assignments] ([invite_link_id]);


-- ---------------------------------------------------------------------------
-- 16. End User Sessions
-- ---------------------------------------------------------------------------
-- Active sessions for end users consuming walkthrough content.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[end_user_sessions] (
    [id]                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [session_token]      NVARCHAR(255)    NOT NULL,
    [email]              NVARCHAR(320)    NOT NULL,
    [display_name]       NVARCHAR(255)    NOT NULL,
    [project_id]         UNIQUEIDENTIFIER NOT NULL,
    [seat_assignment_id] UNIQUEIDENTIFIER NOT NULL,
    [is_active]          BIT              NOT NULL DEFAULT 1,
    [last_accessed_at]   DATETIME2        NULL,
    [created_at]         DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_end_user_sessions] PRIMARY KEY ([id]),
    CONSTRAINT [FK_end_user_sessions_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_end_user_sessions_seat] FOREIGN KEY ([seat_assignment_id])
        REFERENCES [dbo].[seat_assignments] ([id]),
    CONSTRAINT [UQ_end_user_sessions_token] UNIQUE ([session_token])
);

CREATE INDEX [IX_end_user_sessions_session_token] ON [dbo].[end_user_sessions] ([session_token]);
CREATE INDEX [IX_end_user_sessions_project_id] ON [dbo].[end_user_sessions] ([project_id]);
CREATE INDEX [IX_end_user_sessions_email] ON [dbo].[end_user_sessions] ([email]);
CREATE INDEX [IX_end_user_sessions_seat_assignment_id] ON [dbo].[end_user_sessions] ([seat_assignment_id]);


-- ---------------------------------------------------------------------------
-- 17. Consent Records
-- ---------------------------------------------------------------------------
-- Immutable log of user consent events, linked to a policy version.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[consent_records] (
    [consent_id]     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [seat_id]        UNIQUEIDENTIFIER NOT NULL,
    [policy_version] NVARCHAR(50)     NOT NULL,
    [consented_at]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_consent_records] PRIMARY KEY ([consent_id]),
    CONSTRAINT [FK_consent_records_seat] FOREIGN KEY ([seat_id])
        REFERENCES [dbo].[seat_assignments] ([id])
);

CREATE INDEX [IX_consent_records_seat_id] ON [dbo].[consent_records] ([seat_id]);
CREATE INDEX [IX_consent_records_policy_version] ON [dbo].[consent_records] ([policy_version]);


-- ---------------------------------------------------------------------------
-- 18. Consent Content
-- ---------------------------------------------------------------------------
-- Stores versioned policy texts (privacy, terms, cookies).
-- Only one row should have is_current = 1 at a time.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[consent_content] (
    [id]                     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [policy_version]         NVARCHAR(50)     NOT NULL,
    [privacy_policy_version] NVARCHAR(50)     NOT NULL,
    [terms_version]          NVARCHAR(50)     NOT NULL,
    [privacy_policy_title]   NVARCHAR(255)    NOT NULL,
    [privacy_policy_content] NVARCHAR(MAX)    NOT NULL,
    [terms_title]            NVARCHAR(255)    NOT NULL,
    [terms_content]          NVARCHAR(MAX)    NOT NULL,
    [cookie_policy_title]    NVARCHAR(255)    NOT NULL,
    [cookie_policy_content]  NVARCHAR(MAX)    NOT NULL,
    [consent_prompt]         NVARCHAR(MAX)    NOT NULL,
    [last_updated]           DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [is_current]             BIT              NOT NULL DEFAULT 1,

    CONSTRAINT [PK_consent_content] PRIMARY KEY ([id])
);

CREATE INDEX [IX_consent_content_is_current] ON [dbo].[consent_content] ([is_current]) WHERE [is_current] = 1;
CREATE INDEX [IX_consent_content_policy_version] ON [dbo].[consent_content] ([policy_version]);


-- ---------------------------------------------------------------------------
-- 19. Walkthrough Progress
-- ---------------------------------------------------------------------------
-- Tracks each end user's progress through a walkthrough track.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[walkthrough_progress] (
    [id]                       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [session_id]               UNIQUEIDENTIFIER NOT NULL,
    [app_track_id]             NVARCHAR(255)    NOT NULL,
    [project_id]               UNIQUEIDENTIFIER NOT NULL,
    [completed_steps_json]     NVARCHAR(MAX)    NULL,   -- JSON array of completed step IDs
    [total_steps]              INT              NOT NULL DEFAULT 0,
    [last_completed_step_index] INT             NOT NULL DEFAULT -1,
    [last_completed_step_id]   NVARCHAR(255)    NULL,
    [is_complete]              BIT              NOT NULL DEFAULT 0,
    [started_at]               DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [last_activity_at]         DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [completed_at]             DATETIME2        NULL,

    CONSTRAINT [PK_walkthrough_progress] PRIMARY KEY ([id]),
    CONSTRAINT [FK_walkthrough_progress_session] FOREIGN KEY ([session_id])
        REFERENCES [dbo].[end_user_sessions] ([id]),
    CONSTRAINT [FK_walkthrough_progress_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_walkthrough_progress_session_id] ON [dbo].[walkthrough_progress] ([session_id]);
CREATE INDEX [IX_walkthrough_progress_project_id] ON [dbo].[walkthrough_progress] ([project_id]);
CREATE INDEX [IX_walkthrough_progress_session_track] ON [dbo].[walkthrough_progress] ([session_id], [app_track_id]);


-- ---------------------------------------------------------------------------
-- 20. Brand Settings
-- ---------------------------------------------------------------------------
-- Per-project brand customization for the training portal UI.
-- One row per project (enforced by unique constraint).
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[brand_settings] (
    [id]                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [project_id]        UNIQUEIDENTIFIER NOT NULL,
    [logo_url]          NVARCHAR(500)    NULL,
    [primary_color]     NVARCHAR(20)     NOT NULL DEFAULT '#0078D4',
    [secondary_color]   NVARCHAR(20)     NOT NULL DEFAULT '#106EBE',
    [accent_color]      NVARCHAR(20)     NOT NULL DEFAULT '#005A9E',
    [header_text_color] NVARCHAR(20)     NOT NULL DEFAULT '#FFFFFF',
    [background_color]  NVARCHAR(20)     NOT NULL DEFAULT '#F3F2F1',
    [is_default]        BIT              NOT NULL DEFAULT 1,
    [updated_by]        NVARCHAR(255)    NULL,
    [created_at]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_brand_settings] PRIMARY KEY ([id]),
    CONSTRAINT [FK_brand_settings_project] FOREIGN KEY ([project_id])
        REFERENCES [dbo].[projects] ([id]) ON DELETE CASCADE,
    CONSTRAINT [UQ_brand_settings_project] UNIQUE ([project_id])
);


-- ---------------------------------------------------------------------------
-- 21. GDPR Audit Logs
-- ---------------------------------------------------------------------------
-- Immutable record of data deletion operations for GDPR compliance.
-- No foreign keys to allow logging even after related data is purged.
-- ---------------------------------------------------------------------------
CREATE TABLE [dbo].[gdpr_audit_logs] (
    [id]                       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [requested_by_id]          NVARCHAR(255)    NOT NULL,
    [requested_by_email]       NVARCHAR(320)    NOT NULL,
    [project_id]               UNIQUEIDENTIFIER NULL,
    [scope]                    NVARCHAR(50)     NOT NULL,
        -- Valid values: project_bulk, single_user
    [sessions_deleted]         INT              NOT NULL DEFAULT 0,
    [consent_records_deleted]  INT              NOT NULL DEFAULT 0,
    [seat_assignments_deleted] INT              NOT NULL DEFAULT 0,
    [invite_links_deleted]     INT              NOT NULL DEFAULT 0,
    [progress_records_deleted] INT              NOT NULL DEFAULT 0,
    [total_records_deleted]    INT              NOT NULL DEFAULT 0,
    [reason]                   NVARCHAR(MAX)    NULL,
    [extra_metadata_json]      NVARCHAR(MAX)    NULL,
    [executed_at]              DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_gdpr_audit_logs] PRIMARY KEY ([id])
);

CREATE INDEX [IX_gdpr_audit_logs_project_id] ON [dbo].[gdpr_audit_logs] ([project_id]);
CREATE INDEX [IX_gdpr_audit_logs_requested_by] ON [dbo].[gdpr_audit_logs] ([requested_by_id]);
CREATE INDEX [IX_gdpr_audit_logs_executed_at] ON [dbo].[gdpr_audit_logs] ([executed_at] DESC);


-- =============================================================================
-- SEED DATA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Default Consent Content (placeholder text - replace before production)
-- ---------------------------------------------------------------------------
INSERT INTO [dbo].[consent_content] (
    [id],
    [policy_version],
    [privacy_policy_version],
    [terms_version],
    [privacy_policy_title],
    [privacy_policy_content],
    [terms_title],
    [terms_content],
    [cookie_policy_title],
    [cookie_policy_content],
    [consent_prompt],
    [last_updated],
    [is_current]
) VALUES (
    NEWID(),
    '1.0.0',
    '1.0.0',
    '1.0.0',
    'Privacy Policy',
    'This training platform collects your name and email address solely to provide personalized walkthrough experiences for Dynamics 365 applications. Your data is stored securely in Azure SQL Database and is not shared with third parties. You may request deletion of your data at any time by contacting your organization''s administrator. Data is retained only for the duration of your active training access.',
    'Terms of Use',
    'By accessing this training platform, you agree to use it solely for its intended purpose: learning and practicing Dynamics 365 application workflows. You acknowledge that the walkthrough content is AI-generated and should be validated against your organization''s actual business processes. Unauthorized distribution of training content is prohibited. Your access may be revoked at any time by the project administrator.',
    'Cookie Policy',
    'This platform uses essential cookies to maintain your session and track walkthrough progress. No advertising or third-party tracking cookies are used. Session cookies expire when you close your browser. Progress data cookies are stored locally to provide a seamless learning experience across sessions.',
    'To access this training platform, please review and accept our Privacy Policy and Terms of Use. We collect your name and email to personalize your experience. You can withdraw consent at any time.',
    SYSUTCDATETIME(),
    1
);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
