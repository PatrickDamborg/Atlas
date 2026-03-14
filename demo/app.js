/**
 * Forge Atlas — Standalone Demo App
 * All views, state management, and mock logic in one file.
 */
import { parseSolutionZip } from './parser.js';

// ══════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════

const state = {
  currentView: 'dashboard',
  project: null,          // parsed solution data
  selectedApp: null,      // single selected app unique_name
  sitemapItems: [],       // entity logical_names chosen from sitemap
  pipelineStatus: 'idle', // idle | running | completed | failed
  pipelineStages: [],
  pipelineMessage: '',    // current background progress message
  entityFilter: {
    search: '',
    type: 'all',          // all | custom | system
    hasForms: false,
    hasViews: false,
    hasRules: false,
    filterOpen: false,
  },
  selectedEntities: new Set(), // logical_names of selected entities (entity explorer)
  workflows: [],          // proposed workflows
  confirmedWorkflows: [],
  trainingContent: null,
  currentTrackIndex: 0,
  currentStepIndex: 0,
  brand: {
    primary_color: '#0078D4',
    secondary_color: '#106EBE',
    accent_color: '#005A9E',
    header_text_color: '#FFFFFF',
    background_color: '#FAF9F8',
    logo_url: null,
  },
  invites: [],
  adoptionData: null,
  entityDetailOpen: null,
};

// ══════════════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════════════

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.view));
});

function navigate(view) {
  state.currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (active) active.classList.add('active');
  render();
}

function showProjectNav() {
  document.getElementById('project-nav').style.display = 'block';
}

// ══════════════════════════════════════════════════════════════════════
// RENDER DISPATCHER
// ══════════════════════════════════════════════════════════════════════

function render() {
  const content = document.getElementById('content');
  const views = {
    dashboard: renderDashboard,
    upload: renderUpload,
    entities: renderEntities,
    apps: renderApps,
    workflows: renderWorkflows,
    pipeline: renderPipeline,
    training: renderTraining,
    adoption: renderAdoption,
    branding: renderBranding,
    invites: renderInvites,
  };
  const viewHtml = (views[state.currentView] || renderDashboard)();
  content.innerHTML = renderPipelineBanner() + viewHtml;
  bindViewEvents();
  bindPipelineBannerEvents();
}

function bindViewEvents() {
  const handlers = {
    dashboard: bindDashboardEvents,
    upload: bindUploadEvents,
    entities: bindEntityEvents,
    apps: bindAppEvents,
    workflows: bindWorkflowEvents,
    pipeline: bindPipelineEvents,
    training: bindTrainingEvents,
    adoption: bindAdoptionEvents,
    branding: bindBrandingEvents,
    invites: bindInviteEvents,
  };
  (handlers[state.currentView] || (() => {}))();
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: DASHBOARD
// ══════════════════════════════════════════════════════════════════════

function renderDashboard() {
  if (!state.project) {
    return `
      <div class="page-header">
        <h1>Welcome to Forge Atlas</h1>
        <p>AI-powered Dynamics 365 training walkthrough generator</p>
      </div>
      <div class="card" style="max-width:640px">
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="#0078D4" opacity="0.3">
            <rect x="8" y="8" width="48" height="48" rx="8" stroke="#0078D4" stroke-width="3" fill="none"/>
            <path d="M32 20v12M26 26l6-6 6 6M20 40h24" stroke="#0078D4" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <h3>No solution loaded</h3>
          <p>Upload a Dataverse solution ZIP file to get started.</p>
          <button class="btn btn-primary mt-16" onclick="document.querySelector('[data-view=upload]').click()">
            Upload Solution
          </button>
        </div>
      </div>
      <div class="card" style="max-width:640px">
        <div class="card-title">How it works</div>
        <ol style="padding-left:20px;font-size:14px;line-height:2">
          <li><strong>Upload</strong> — Drop a Dataverse solution .zip file</li>
          <li><strong>Select App</strong> — Pick an app and choose sitemap items to train on</li>
          <li><strong>Review Workflows</strong> — Confirm the proposed training workflows</li>
          <li><strong>Training</strong> — Content is generated in the background; play it when ready</li>
          <li><strong>Share</strong> — Create invite links for end-user training</li>
          <li><strong>Track</strong> — Monitor adoption with the analytics dashboard</li>
        </ol>
      </div>`;
  }

  const p = state.project;
  return `
    <div class="page-header">
      <h1>${p.solution_display_name}</h1>
      <p>${p.publisher} &middot; v${p.solution_version}</p>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">${p.entity_count}</div><div class="stat-label">Entities</div></div>
      <div class="stat-card"><div class="stat-value">${p.app_module_count}</div><div class="stat-label">App Modules</div></div>
      <div class="stat-card"><div class="stat-value">${state.sitemapItems.length || '—'}</div><div class="stat-label">Sitemap Items</div></div>
      <div class="stat-card">
        <div class="stat-value">${state.pipelineStatus === 'completed' ? '<span style="color:#107c10">Ready</span>' : capitalize(state.pipelineStatus) || '—'}</div>
        <div class="stat-label">Training Status</div>
      </div>
    </div>
    ${p.warnings.length > 0 ? `
      <div class="card" style="border-left:4px solid #ca5010">
        <div class="card-title" style="color:#ca5010">Warnings</div>
        <ul style="padding-left:20px;font-size:14px;color:#605e5c">
          ${p.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>` : ''}
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-secondary" data-action="go-entities">View Entities</button>
          <button class="btn btn-secondary" data-action="go-apps">${state.selectedApp ? 'Change App / Sitemap' : 'Select App & Items'}</button>
          ${state.pipelineStatus === 'completed' ? '<button class="btn btn-secondary" data-action="go-training">View Training</button>' : ''}
          ${state.pipelineStatus === 'completed' ? '<button class="btn btn-secondary" data-action="go-adoption">Adoption Dashboard</button>' : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Solution Info</div>
        <table style="font-size:14px;width:100%">
          <tr><td class="text-muted" style="padding:4px 8px">Unique Name</td><td style="padding:4px 8px">${p.solution_unique_name}</td></tr>
          <tr><td class="text-muted" style="padding:4px 8px">Publisher</td><td style="padding:4px 8px">${p.publisher}</td></tr>
          <tr><td class="text-muted" style="padding:4px 8px">Version</td><td style="padding:4px 8px">${p.solution_version}</td></tr>
          <tr><td class="text-muted" style="padding:4px 8px">Description</td><td style="padding:4px 8px">${p.description || 'N/A'}</td></tr>
        </table>
      </div>
    </div>`;
}

function bindDashboardEvents() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const map = { 'go-entities': 'entities', 'go-apps': 'apps', 'go-training': 'training', 'go-adoption': 'adoption' };
      navigate(map[btn.dataset.action]);
    });
  });
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: UPLOAD
// ══════════════════════════════════════════════════════════════════════

function renderUpload() {
  return `
    <div class="page-header">
      <h1>Upload Solution</h1>
      <p>Upload a Dataverse solution ZIP file to analyse its structure</p>
    </div>
    <div class="card" style="max-width:640px">
      <div class="upload-zone" id="upload-zone">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="#0078D4" opacity="0.6">
          <path d="M24 8v20M16 18l8-10 8 10M8 36h32v4H8z"/>
        </svg>
        <h3>Drop solution.zip here</h3>
        <p>or click to browse &middot; Max 100 MB</p>
        <input type="file" id="file-input" accept=".zip">
      </div>
      <div id="upload-status" class="mt-16"></div>
    </div>
    ${state.project ? `
      <div class="card" style="max-width:640px;margin-top:16px">
        <div class="flex-between mb-16">
          <div class="card-title" style="margin:0">Previous Upload</div>
          <span class="badge badge-green">Loaded</span>
        </div>
        <p class="text-sm text-muted">${state.project.solution_display_name} (${state.project.entity_count} entities)</p>
      </div>` : ''}`;
}

function bindUploadEvents() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  const status = document.getElementById('upload-status');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
  input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });

  async function handleFile(file) {
    if (!file.name.endsWith('.zip')) {
      status.innerHTML = '<p style="color:#d13438">Please upload a .zip file</p>';
      return;
    }
    status.innerHTML = '<div class="flex gap-8" style="align-items:center"><span class="spinner"></span> Parsing solution...</div>';
    try {
      const result = await parseSolutionZip(file);

      // Assign entity counts to app modules
      result.app_module_summaries.forEach(app => {
        if (app.entity_count === 0) app.entity_count = result.entity_count;
      });

      state.project = result;
      state.selectedApp = null;
      state.sitemapItems = [];
      state.pipelineStatus = 'idle';
      state.pipelineStages = [];
      state.pipelineMessage = '';
      state.workflows = [];
      state.confirmedWorkflows = [];
      state.trainingContent = null;
      state.adoptionData = null;
      state.invites = [];
      showProjectNav();
      showToast(`Solution parsed — ${result.entity_count} entities, ${result.app_module_count} app modules`);
      navigate('apps');
    } catch (err) {
      status.innerHTML = `<p style="color:#d13438">Error: ${err.message}</p>`;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: ENTITIES
// ══════════════════════════════════════════════════════════════════════

function getFilteredEntities() {
  const { search, type, hasForms, hasViews, hasRules } = state.entityFilter;
  return state.project.entity_summaries.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      if (!e.logical_name.toLowerCase().includes(q) && !e.display_name.toLowerCase().includes(q)) return false;
    }
    if (type === 'custom' && !e.is_custom_entity) return false;
    if (type === 'system' && e.is_custom_entity) return false;
    if (hasForms && e.form_count === 0) return false;
    if (hasViews && e.view_count === 0) return false;
    if (hasRules && e.business_rule_count === 0) return false;
    return true;
  });
}

function activeFilterCount() {
  const f = state.entityFilter;
  return (f.type !== 'all' ? 1 : 0) + (f.hasForms ? 1 : 0) + (f.hasViews ? 1 : 0) + (f.hasRules ? 1 : 0);
}

function renderEntities() {
  if (!state.project) return noProjectMessage('Entities');
  const allEntities = state.project.entity_summaries;
  const filtered = getFilteredEntities();
  const f = state.entityFilter;
  const selCount = state.selectedEntities.size;
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => state.selectedEntities.has(e.logical_name));
  const someSelected = selCount > 0 && !allFilteredSelected;
  const filterCount = activeFilterCount();

  return `
    <div class="page-header">
      <h1>Entity Explorer</h1>
      <p>${allEntities.length} entities in solution${filtered.length !== allEntities.length ? ` &middot; <strong>${filtered.length}</strong> shown` : ''}</p>
    </div>

    <!-- Toolbar -->
    <div class="entity-toolbar">
      <div class="search-box" style="flex:1;max-width:360px">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"/></svg>
        <input type="text" id="entity-search" placeholder="Search by name or logical name..." value="${f.search}">
        ${f.search ? `<button id="clear-search" style="background:none;border:none;cursor:pointer;color:#605e5c;font-size:16px;line-height:1;padding:0">&times;</button>` : ''}
      </div>

      <div style="position:relative">
        <button class="btn btn-secondary ${filterCount > 0 ? 'filter-active' : ''}" id="filter-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14l-5 6v5l-4-2V8L1 2z"/></svg>
          Filters
          ${filterCount > 0 ? `<span class="filter-badge">${filterCount}</span>` : ''}
        </button>

        ${f.filterOpen ? `
          <div class="filter-panel" id="filter-panel">
            <div class="filter-section-title">Entity Type</div>
            <label class="filter-radio"><input type="radio" name="ftype" value="all" ${f.type === 'all' ? 'checked' : ''}> All types</label>
            <label class="filter-radio"><input type="radio" name="ftype" value="custom" ${f.type === 'custom' ? 'checked' : ''}> Custom only</label>
            <label class="filter-radio"><input type="radio" name="ftype" value="system" ${f.type === 'system' ? 'checked' : ''}> System only</label>

            <div class="filter-section-title" style="margin-top:12px">Has at least one...</div>
            <label class="filter-check"><input type="checkbox" id="f-forms" ${f.hasForms ? 'checked' : ''}> Form</label>
            <label class="filter-check"><input type="checkbox" id="f-views" ${f.hasViews ? 'checked' : ''}> View</label>
            <label class="filter-check"><input type="checkbox" id="f-rules" ${f.hasRules ? 'checked' : ''}> Business Rule</label>

            ${filterCount > 0 ? `<button class="btn btn-ghost btn-sm" id="clear-filters" style="margin-top:8px;width:100%">Clear all filters</button>` : ''}
          </div>` : ''}
      </div>

      ${selCount > 0 ? `
        <div class="selection-bar">
          <span>${selCount} selected</span>
          <button class="btn btn-ghost btn-sm" id="clear-selection">Clear</button>
        </div>` : ''}
    </div>

    <div class="card">
      <table class="data-table" id="entity-table">
        <thead>
          <tr>
            <th style="width:40px">
              <input type="checkbox" id="select-all-cb" style="accent-color:#0078D4;transform:scale(1.15)"
                ${allFilteredSelected ? 'checked' : ''}
                ${someSelected ? 'data-indeterminate="true"' : ''}>
            </th>
            <th>Display Name</th>
            <th>Logical Name</th>
            <th>Type</th>
            <th>Fields</th>
            <th>Forms</th>
            <th>Views</th>
            <th>Rules</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:#605e5c">No entities match the current filters</td></tr>` : ''}
          ${filtered.map(e => `
            <tr class="entity-row ${state.selectedEntities.has(e.logical_name) ? 'row-selected' : ''}" data-entity="${e.logical_name}" style="cursor:pointer">
              <td><input type="checkbox" class="row-cb" data-entity="${e.logical_name}" style="accent-color:#0078D4;transform:scale(1.15)" ${state.selectedEntities.has(e.logical_name) ? 'checked' : ''}></td>
              <td><strong>${e.display_name}</strong></td>
              <td class="text-muted text-sm">${e.logical_name}</td>
              <td>${e.is_custom_entity ? '<span class="badge badge-blue">Custom</span>' : '<span class="badge badge-gray">System</span>'}</td>
              <td>${e.attribute_count}</td>
              <td>${e.form_count}</td>
              <td>${e.view_count}</td>
              <td>${e.business_rule_count}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div id="entity-detail-panel" class="entity-detail-panel"></div>`;
}

function bindEntityEvents() {
  // Set indeterminate state on select-all checkbox
  const selectAllCb = document.getElementById('select-all-cb');
  if (selectAllCb) {
    if (selectAllCb.dataset.indeterminate === 'true') selectAllCb.indeterminate = true;

    selectAllCb.addEventListener('change', () => {
      const filtered = getFilteredEntities();
      if (selectAllCb.checked) {
        filtered.forEach(e => state.selectedEntities.add(e.logical_name));
      } else {
        filtered.forEach(e => state.selectedEntities.delete(e.logical_name));
      }
      render();
    });
  }

  // Per-row checkboxes
  document.querySelectorAll('.row-cb').forEach(cb => {
    cb.addEventListener('click', e => e.stopPropagation());
    cb.addEventListener('change', () => {
      if (cb.checked) state.selectedEntities.add(cb.dataset.entity);
      else state.selectedEntities.delete(cb.dataset.entity);
      render();
    });
  });

  // Row click → detail panel (not on checkbox)
  document.querySelectorAll('.entity-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.type === 'checkbox') return;
      openEntityDetail(row.dataset.entity);
    });
  });

  // Search input
  const search = document.getElementById('entity-search');
  if (search) {
    search.addEventListener('input', () => {
      state.entityFilter.search = search.value;
      render();
    });
    // Keep focus after re-render
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }

  const clearSearch = document.getElementById('clear-search');
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      state.entityFilter.search = '';
      render();
    });
  }

  // Filter button toggle
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', e => {
      e.stopPropagation();
      state.entityFilter.filterOpen = !state.entityFilter.filterOpen;
      render();
    });
  }

  // Close filter panel on outside click
  if (state.entityFilter.filterOpen) {
    document.addEventListener('click', function closeFilter(e) {
      const panel = document.getElementById('filter-panel');
      const btn = document.getElementById('filter-btn');
      if (panel && !panel.contains(e.target) && e.target !== btn) {
        state.entityFilter.filterOpen = false;
        document.removeEventListener('click', closeFilter);
        render();
      }
    });
  }

  // Filter panel controls
  document.querySelectorAll('input[name="ftype"]').forEach(radio => {
    radio.addEventListener('change', () => { state.entityFilter.type = radio.value; render(); });
  });
  const fForms = document.getElementById('f-forms');
  const fViews = document.getElementById('f-views');
  const fRules = document.getElementById('f-rules');
  if (fForms) fForms.addEventListener('change', () => { state.entityFilter.hasForms = fForms.checked; render(); });
  if (fViews) fViews.addEventListener('change', () => { state.entityFilter.hasViews = fViews.checked; render(); });
  if (fRules) fRules.addEventListener('change', () => { state.entityFilter.hasRules = fRules.checked; render(); });

  const clearFilters = document.getElementById('clear-filters');
  if (clearFilters) {
    clearFilters.addEventListener('click', e => {
      e.stopPropagation();
      state.entityFilter = { ...state.entityFilter, type: 'all', hasForms: false, hasViews: false, hasRules: false };
      render();
    });
  }

  const clearSel = document.getElementById('clear-selection');
  if (clearSel) {
    clearSel.addEventListener('click', () => { state.selectedEntities.clear(); render(); });
  }
}

function openEntityDetail(logicalName) {
  const detail = state.project.entities_detail.find(e => e.logical_name === logicalName);
  if (!detail) return;

  const panel = document.getElementById('entity-detail-panel');
  panel.innerHTML = `
    <div class="entity-detail-header">
      <div>
        <h2 style="font-size:18px">${detail.display_name}</h2>
        <span class="text-sm text-muted">${detail.logical_name}</span>
      </div>
      <button class="close-btn" id="close-detail">&times;</button>
    </div>
    <div class="entity-detail-body">
      <p class="text-sm text-muted mb-16">${detail.description}</p>

      <div class="tabs">
        <div class="tab active" data-tab="fields">Fields (${detail.field_count})</div>
        <div class="tab" data-tab="forms">Forms (${detail.form_count})</div>
        <div class="tab" data-tab="views">Views (${detail.view_count})</div>
        <div class="tab" data-tab="rules">Rules (${detail.business_rule_count})</div>
      </div>

      <div id="tab-fields" class="tab-content">
        ${detail.fields.length > 0 ? `
          <table class="data-table">
            <thead><tr><th>Field</th><th>Type</th><th>Required</th></tr></thead>
            <tbody>
              ${detail.fields.map(f => `
                <tr>
                  <td><strong>${f.display_name}</strong><br><span class="text-sm text-muted">${f.logical_name}</span></td>
                  <td><span class="tag">${f.field_type}</span></td>
                  <td>${f.is_required ? '<span class="badge badge-orange">Required</span>' : '<span class="text-muted">—</span>'}</td>
                </tr>`).join('')}
            </tbody>
          </table>` : '<p class="text-sm text-muted">No fields found</p>'}
      </div>
      <div id="tab-forms" class="tab-content" style="display:none">
        ${detail.forms.length > 0 ? detail.forms.map(f => `
          <div class="card" style="margin-bottom:8px">
            <div class="flex-between">
              <strong>${f.name}</strong>
              <span class="tag">${f.form_type}</span>
            </div>
            <p class="text-sm text-muted mt-8">${f.tab_count} tabs, ${f.field_count} controls</p>
          </div>`).join('') : '<p class="text-sm text-muted">No forms found</p>'}
      </div>
      <div id="tab-views" class="tab-content" style="display:none">
        ${detail.views.length > 0 ? detail.views.map(v => `
          <div class="card" style="margin-bottom:8px">
            <div class="flex-between">
              <strong>${v.name}</strong>
              ${v.is_default ? '<span class="badge badge-green">Default</span>' : ''}
            </div>
            <p class="text-sm text-muted mt-8">${v.column_count} columns${v.columns.length > 0 ? ': ' + v.columns.join(', ') : ''}</p>
          </div>`).join('') : '<p class="text-sm text-muted">No views found</p>'}
      </div>
      <div id="tab-rules" class="tab-content" style="display:none">
        ${detail.business_rules.length > 0 ? detail.business_rules.map(r => `
          <div class="card" style="margin-bottom:8px">
            <strong>${r.name}</strong>
            <p class="text-sm text-muted mt-8">${r.description}</p>
            <span class="tag">${r.scope}</span>
          </div>`).join('') : '<p class="text-sm text-muted">No business rules found</p>'}
      </div>
    </div>`;

  panel.classList.add('open');

  // Close button
  document.getElementById('close-detail').addEventListener('click', () => panel.classList.remove('open'));

  // Tab switching
  panel.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      panel.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).style.display = '';
    });
  });
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: APP SELECTION + SITEMAP ITEMS
// ══════════════════════════════════════════════════════════════════════

function getSitemapAreas() {
  // Group entities into simulated sitemap areas by name heuristics
  const entities = state.project.entity_summaries;
  const areas = {};
  const keywords = {
    'Sales': ['lead', 'opportunity', 'quote', 'order', 'invoice', 'competitor', 'forecast'],
    'Service': ['case', 'incident', 'ticket', 'knowledge', 'sla', 'entitlement'],
    'Marketing': ['campaign', 'marketing', 'list', 'segment', 'email'],
    'Field Service': ['workorder', 'work_order', 'booking', 'resource', 'schedule'],
    'Operations': [],  // catch-all
  };

  entities.forEach(e => {
    let assigned = false;
    const lname = e.logical_name.toLowerCase();
    for (const [area, terms] of Object.entries(keywords)) {
      if (area === 'Operations') continue;
      if (terms.some(t => lname.includes(t))) {
        if (!areas[area]) areas[area] = [];
        areas[area].push(e);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      if (!areas['Operations']) areas['Operations'] = [];
      areas['Operations'].push(e);
    }
  });

  // Remove empty areas
  return Object.fromEntries(Object.entries(areas).filter(([, v]) => v.length > 0));
}

function renderApps() {
  if (!state.project) return noProjectMessage('Select App');
  const apps = state.project.app_module_summaries;
  const selectedApp = state.selectedApp
    ? apps.find(a => a.unique_name === state.selectedApp)
    : null;

  const sitemapAreas = selectedApp ? getSitemapAreas() : null;
  const allSitemapEntities = sitemapAreas
    ? Object.values(sitemapAreas).flat()
    : [];
  const allSelected = allSitemapEntities.length > 0 &&
    allSitemapEntities.every(e => state.sitemapItems.includes(e.logical_name));

  return `
    <div class="page-header">
      <h1>Select App</h1>
      <p>Choose the app to generate training for, then select which areas to include</p>
    </div>

    <!-- Step 1: App cards -->
    <div class="step-label">
      <span class="step-number-badge">1</span> Choose an app
    </div>
    <div class="grid-2 mb-24">
      ${apps.map(app => `
        <div class="card app-card ${state.selectedApp === app.unique_name ? 'app-card-selected' : ''}"
             data-app="${app.unique_name}" style="cursor:pointer">
          <div class="flex-between">
            <div class="card-title" style="margin:0">${app.display_name}</div>
            <div class="app-radio-dot ${state.selectedApp === app.unique_name ? 'active' : ''}"></div>
          </div>
          <p class="text-sm text-muted mt-8">${app.description}</p>
          <div class="mt-12 flex gap-8">
            <span class="badge badge-blue">${app.entity_count} entities</span>
            ${app.is_default ? '<span class="badge badge-green">Default</span>' : ''}
          </div>
        </div>`).join('')}
    </div>

    ${selectedApp ? `
      <!-- Step 2: Sitemap items -->
      <div class="step-label">
        <span class="step-number-badge">2</span> Select sitemap items for training
        <span class="text-sm text-muted" style="margin-left:8px;font-weight:400">
          ${state.sitemapItems.length} of ${allSitemapEntities.length} selected
        </span>
      </div>

      <div class="sitemap-panel">
        <!-- Sticky toolbar -->
        <div class="sitemap-panel-toolbar">
          <span class="text-sm text-muted">
            Navigation areas from <strong>${selectedApp.display_name}</strong>
          </span>
          <div class="flex gap-8" style="align-items:center">
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;white-space:nowrap">
              <input type="checkbox" id="sitemap-select-all" style="accent-color:#0078D4;transform:scale(1.15)"
                ${allSelected ? 'checked' : ''}>
              Select all
            </label>
            <button class="btn btn-primary btn-sm" id="next-to-workflows"
              ${state.sitemapItems.length === 0 ? 'disabled' : ''}>
              Review Workflows &rarr;
            </button>
          </div>
        </div>

        <!-- Scrollable list -->
        <div class="sitemap-panel-body">
          ${Object.entries(sitemapAreas).map(([area, entities]) => `
            <div class="sitemap-area">
              <div class="sitemap-area-header">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="opacity:0.5"><path d="M2 2h10v2H2zm0 4h10v2H2zm0 4h6v2H2z"/></svg>
                ${area}
                <span class="badge badge-gray" style="margin-left:8px">${entities.length}</span>
              </div>
              <div class="sitemap-items">
                ${entities.map(e => `
                  <label class="sitemap-item ${state.sitemapItems.includes(e.logical_name) ? 'sitemap-item-selected' : ''}">
                    <input type="checkbox" class="sitemap-cb" data-entity="${e.logical_name}"
                      style="accent-color:#0078D4" ${state.sitemapItems.includes(e.logical_name) ? 'checked' : ''}>
                    <div class="sitemap-item-info">
                      <span class="sitemap-item-name">${e.display_name}</span>
                      <span class="sitemap-item-meta">${e.attribute_count} fields &middot; ${e.form_count} forms &middot; ${e.view_count} views</span>
                    </div>
                    ${e.is_custom_entity ? '<span class="badge badge-blue" style="font-size:11px">Custom</span>' : ''}
                  </label>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>
    ` : `
      <div class="card" style="max-width:480px">
        <div class="empty-state" style="padding:32px 24px">
          <p>Select an app above to see its sitemap items</p>
        </div>
      </div>
    `}`;
}

function bindAppEvents() {
  // App card selection (radio behaviour)
  document.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selectedApp = card.dataset.app;
      state.sitemapItems = []; // reset sitemap selection when app changes
      render();
    });
  });

  // Select-all sitemap checkbox
  const selectAll = document.getElementById('sitemap-select-all');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      const areas = getSitemapAreas();
      const all = Object.values(areas).flat().map(e => e.logical_name);
      state.sitemapItems = selectAll.checked ? all : [];
      render();
    });
  }

  // Individual sitemap checkboxes
  document.querySelectorAll('.sitemap-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const en = cb.dataset.entity;
      if (cb.checked) {
        if (!state.sitemapItems.includes(en)) state.sitemapItems.push(en);
      } else {
        state.sitemapItems = state.sitemapItems.filter(x => x !== en);
      }
      render();
    });
  });

  // Next step
  const nextBtn = document.getElementById('next-to-workflows');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      generateWorkflowsFromSitemap();
      navigate('workflows');
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// WORKFLOW GENERATION FROM SITEMAP ITEMS
// ══════════════════════════════════════════════════════════════════════

function generateWorkflowsFromSitemap() {
  if (!state.project) return;
  const entities = state.project.entity_summaries.filter(e =>
    state.sitemapItems.includes(e.logical_name)
  );
  const workflowTypes = [
    { suffix: 'Management', desc: 'Create, view, and manage', tags: ['CRUD', 'core'], steps: [6, 10] },
    { suffix: 'Lookup & Reference', desc: 'Search, filter, and reference', tags: ['lookup', 'reference'], steps: [4, 7] },
    { suffix: 'Data Entry', desc: 'Complete data entry workflow for', tags: ['data-entry', 'form'], steps: [5, 9] },
  ];

  state.workflows = entities.map((entity, i) => {
    const wfType = workflowTypes[i % workflowTypes.length];
    return {
      id: crypto.randomUUID(),
      name: `${entity.display_name} ${wfType.suffix}`,
      description: `${wfType.desc} ${entity.display_name} records using forms and views.`,
      primary_entity: entity.logical_name,
      primary_entity_display_name: entity.display_name,
      related_entities: entities.filter((_, j) => j !== i).slice(0, 2).map(e => e.logical_name),
      estimated_steps: randomInt(wfType.steps[0], wfType.steps[1]),
      ai_recommended: true,
      sort_order: i,
      tags: wfType.tags,
      confidence: +(0.78 + Math.random() * 0.22).toFixed(2),
      gap_warning: Math.random() > 0.88 ? 'Some form components may be incomplete' : null,
      selected: true,
    };
  });
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: WORKFLOWS
// ══════════════════════════════════════════════════════════════════════

function renderWorkflows() {
  if (state.workflows.length === 0) {
    return noProjectMessage('Workflows', 'Select apps and generate workflows first');
  }

  const selected = state.workflows.filter(w => w.selected).length;

  return `
    <div class="page-header">
      <div class="flex-between">
        <div>
          <h1>Proposed Workflows</h1>
          <p>Review, edit, and select which workflows to include in training</p>
        </div>
        <button class="btn btn-primary" id="confirm-workflows">
          Confirm ${selected} Workflow${selected !== 1 ? 's' : ''} & Start Pipeline
        </button>
      </div>
    </div>
    <div class="mb-16 text-sm text-muted">${selected} of ${state.workflows.length} workflows selected</div>
    ${state.workflows.map(w => `
      <div class="workflow-card ${w.selected ? 'selected' : ''}" data-wf="${w.id}">
        <input type="checkbox" class="workflow-checkbox" ${w.selected ? 'checked' : ''} data-wf-check="${w.id}">
        <div class="workflow-content">
          <div class="flex-between">
            <div class="workflow-name">${w.name}</div>
            ${w.ai_recommended ? '<span class="badge badge-blue">AI Recommended</span>' : ''}
          </div>
          <div class="workflow-desc">${w.description}</div>
          ${w.gap_warning ? `<div class="text-sm mt-8" style="color:#ca5010">&#9888; ${w.gap_warning}</div>` : ''}
          <div class="workflow-meta">
            <span>Entity: <strong>${w.primary_entity_display_name}</strong></span>
            <span>~${w.estimated_steps} steps</span>
            <span>Confidence: <span class="confidence-bar"><span class="confidence-fill" style="width:${w.confidence * 100}%"></span></span> ${Math.round(w.confidence * 100)}%</span>
          </div>
          <div class="mt-8">${w.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      </div>`).join('')}`;
}

function bindWorkflowEvents() {
  document.querySelectorAll('[data-wf-check]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      const wf = state.workflows.find(w => w.id === cb.dataset.wfCheck);
      if (wf) wf.selected = cb.checked;
      render();
    });
  });

  document.querySelectorAll('.workflow-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.type === 'checkbox') return;
      const wf = state.workflows.find(w => w.id === card.dataset.wf);
      if (wf) { wf.selected = !wf.selected; render(); }
    });
  });

  const confirmBtn = document.getElementById('confirm-workflows');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      state.confirmedWorkflows = state.workflows.filter(w => w.selected);
      startPipelineBackground();
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: AI PIPELINE
// ══════════════════════════════════════════════════════════════════════

function renderPipeline() {
  if (state.pipelineStatus === 'idle') {
    return `
      <div class="page-header"><h1>AI Pipeline</h1><p>3-agent training content generator</p></div>
      <div class="card">
        <div class="empty-state">
          <h3>Pipeline not started</h3>
          <p>Select an app, choose sitemap items, and confirm workflows to start.</p>
          <button class="btn btn-primary mt-16"
            onclick="document.querySelector('[data-view=apps]').click()">Go to App Selection</button>
        </div>
      </div>`;
  }

  const isRunning = state.pipelineStatus === 'running';
  const isComplete = state.pipelineStatus === 'completed';
  const stages = state.pipelineStages;

  return `
    <div class="page-header">
      <div class="flex-between">
        <div><h1>AI Pipeline</h1><p>Generating training content from ${state.confirmedWorkflows.length} workflow${state.confirmedWorkflows.length !== 1 ? 's' : ''}</p></div>
        <span class="badge ${isComplete ? 'badge-green' : 'badge-blue'}">
          ${isComplete ? 'Completed' : 'Running'}
        </span>
      </div>
    </div>

    <div class="pipeline-stages">
      ${stages.map(s => `
        <div class="pipeline-stage ${s.status === 'running' ? 'active' : ''} ${s.status}">
          <div class="stage-indicator ${s.status}">
            ${s.status === 'completed'
              ? '&#10003;'
              : s.status === 'running'
                ? `<span class="spinner" style="width:20px;height:20px;border-width:2px"></span>`
                : s.agentNum}
          </div>
          <div class="stage-info">
            <div class="stage-name">Agent ${s.agentNum}: ${s.name}</div>
            <div class="stage-desc">${s.desc || ''}</div>
            ${s.status === 'running' || s.status === 'completed' ? `
              <div class="stage-progress">
                <div class="progress-bar">
                  <div class="progress-fill ${s.status === 'completed' ? 'green' : ''}"
                       style="width:${s.progress}%"></div>
                </div>
                <div class="progress-text">${s.progress}%${s.message ? ' — ' + s.message : ''}</div>
              </div>` : ''}
          </div>
        </div>`).join('')}
    </div>

    ${isComplete ? `
      <div class="mt-24">
        <button class="btn btn-primary" id="go-training-btn">View Training Content &rarr;</button>
      </div>` : ''}`;
}

function bindPipelineEvents() {
  const btn = document.getElementById('go-training-btn');
  if (btn) btn.addEventListener('click', () => navigate('training'));
}

// Banner shown on all other pages while pipeline is running / done
function renderPipelineBanner() {
  if (state.pipelineStatus === 'idle' || state.currentView === 'pipeline') return '';

  if (state.pipelineStatus === 'completed') {
    return `
      <div class="pipeline-banner pipeline-banner-done">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
        Training content ready
        <button class="btn btn-sm" id="banner-view-training"
          style="background:#fff;color:#107c10;border-color:#107c10;margin-left:12px">
          View Training &rarr;
        </button>
      </div>`;
  }

  if (state.pipelineStatus === 'running') {
    const stages = state.pipelineStages;
    const running = stages.find(s => s.status === 'running');
    const doneCount = stages.filter(s => s.status === 'completed').length;
    const overallPct = Math.round(
      stages.reduce((sum, s) => sum + (s.progress || 0), 0) / (stages.length * 100) * 100
    );
    return `
      <div class="pipeline-banner pipeline-banner-running" id="pipeline-banner">
        <span class="spinner" style="width:14px;height:14px;border-width:2px;flex-shrink:0"></span>
        <div style="flex:1;min-width:0">
          <div class="flex-between" style="margin-bottom:4px">
            <span style="font-size:13px;font-weight:600">
              ${running ? `Agent ${running.agentNum}: ${running.name}` : 'Generating…'}
            </span>
            <button class="btn btn-ghost btn-sm" id="banner-goto-pipeline"
              style="font-size:12px;padding:2px 8px">See progress</button>
          </div>
          <div class="progress-bar" style="height:4px">
            <div class="progress-fill" style="width:${overallPct}%"></div>
          </div>
          ${state.pipelineMessage ? `<div style="font-size:12px;opacity:0.75;margin-top:3px">${state.pipelineMessage}</div>` : ''}
        </div>
      </div>`;
  }

  return '';
}

function bindPipelineBannerEvents() {
  const viewBtn = document.getElementById('banner-view-training');
  if (viewBtn) viewBtn.addEventListener('click', () => navigate('training'));
  const pipeBtn = document.getElementById('banner-goto-pipeline');
  if (pipeBtn) pipeBtn.addEventListener('click', () => navigate('pipeline'));
}

function startPipelineBackground() {
  state.pipelineStatus = 'running';
  state.pipelineStages = [
    { name: 'Entity Analyser', desc: 'Analysing entities, relationships, forms, views, and business rules', status: 'running', progress: 0, agentNum: 1 },
    { name: 'Walkthrough Generator', desc: 'Generating interactive training walkthrough steps and annotations', status: 'pending', progress: 0, agentNum: 2 },
    { name: 'Documentation Generator', desc: 'Producing per-entity reference documentation pages', status: 'pending', progress: 0, agentNum: 3 },
  ];
  state.pipelineMessage = '';
  navigate('pipeline');
  simulatePipeline();
}

async function simulatePipeline() {
  const entities = state.project.entity_summaries;

  const tick = (msg) => {
    state.pipelineMessage = msg;
    try {
      if (state.currentView === 'pipeline') {
        render();
      } else {
        const bannerEl = document.getElementById('pipeline-banner');
        if (bannerEl) {
          const tmp = document.createElement('div');
          tmp.innerHTML = renderPipelineBanner();
          if (tmp.firstElementChild) {
            bannerEl.replaceWith(tmp.firstElementChild);
            bindPipelineBannerEvents();
          }
        }
      }
    } catch (e) {
      // Never let a render error kill the pipeline loop
      console.warn('Pipeline tick render error:', e);
    }
  };

  const safeIdx = (arr, pct) =>
    arr.length === 0 ? undefined : arr[Math.min(Math.floor(pct / 100 * arr.length), arr.length - 1)];
  const entityAt = pct => safeIdx(entities, pct)?.display_name || '…';
  const wfAt = pct => safeIdx(state.confirmedWorkflows, pct)?.name || '…';

  const runStage = async (stageIdx, minStep, maxStep, minDelay, maxDelay, msgFn) => {
    for (let i = 0; i <= 100; i = Math.min(i + randomInt(minStep, maxStep), 100)) {
      await delay(randomInt(minDelay, maxDelay));
      state.pipelineStages[stageIdx].progress = i;
      state.pipelineStages[stageIdx].message = msgFn(i);
      tick(state.pipelineStages[stageIdx].message);
      if (i === 100) break;
    }
    state.pipelineStages[stageIdx].status = 'completed';
  };

  try {
    await runStage(0, 3, 8, 80, 180,
      i => i < 100 ? `Analysing ${entityAt(i)}` : 'Analysis complete');
    state.pipelineStages[1].status = 'running';
    tick('');

    await runStage(1, 2, 6, 100, 230,
      i => i < 100 ? `Generating: ${wfAt(i)}` : 'Walkthroughs generated');
    state.pipelineStages[2].status = 'running';
    tick('');

    await runStage(2, 4, 10, 60, 150,
      i => i < 100 ? `Documenting ${entityAt(i)}` : 'Documentation complete');
  } catch (e) {
    console.error('Pipeline simulation error:', e);
    // Mark remaining running stage as failed but still complete overall
    state.pipelineStages.forEach(s => { if (s.status === 'running') s.status = 'completed'; });
  } finally {
    state.pipelineStatus = 'completed';
    state.pipelineMessage = '';

    try { generateTrainingContent(); } catch (e) { console.error('generateTrainingContent error:', e); }
    try { generateAdoptionData(); } catch (e) { console.error('generateAdoptionData error:', e); }

    render();
    showToast('Training content is ready');
  }
}

// ══════════════════════════════════════════════════════════════════════
// TRAINING CONTENT GENERATION (MOCK)
// ══════════════════════════════════════════════════════════════════════

function generateTrainingContent() {
  const tracks = state.confirmedWorkflows.map(wf => {
    // Always prefer the full detail object (has fields/views/business_rules arrays)
    const entity = state.project.entities_detail.find(e => e.logical_name === wf.primary_entity);
    const fields = (entity?.fields ?? []).slice(0, 8);
    const views = entity?.views ?? [];
    const businessRules = entity?.business_rules ?? [];
    const stepCount = wf.estimated_steps;

    const annotations = [];
    const stepTemplates = [
      { title: 'Navigate to {entity}', instruction: 'Open the {entity} area from the sitemap navigation.', detail: 'The sitemap provides quick access to all entities in the app. Click on {entity} under the main menu.', tips: ['Use keyboard shortcut Ctrl+/ to search', 'Pin frequently used areas to favourites'], type: 'interactive', ui_type: 'sitemap' },
      { title: 'Create New Record', instruction: 'Click the "+ New" button in the command bar to create a new {entity} record.', detail: 'The command bar at the top of the view provides actions like New, Delete, and Refresh.', tips: ['You can also use Ctrl+N', 'The form will open with required fields highlighted'], type: 'interactive', ui_type: 'command_bar' },
      { title: 'Fill in {field}', instruction: 'Enter the {field} value in the form field.', detail: 'This field is {req} and accepts {type} data. It helps identify and categorize the record.', tips: ['Tab to move to the next field', 'Required fields are marked with a red asterisk'], type: 'interactive', ui_type: 'form' },
      { title: 'Review Related Records', instruction: 'Scroll down to the Related section to view associated records.', detail: 'Related records show connections between entities. This helps maintain data integrity across the system.', tips: ['Click "+" to add new related records inline', 'Use the filter to narrow down related records'], type: 'interactive', ui_type: 'related' },
      { title: 'Save the Record', instruction: 'Click Save or press Ctrl+S to save your changes.', detail: 'Saving commits your changes to the database. Business rules will validate the data before saving.', tips: ['Save frequently to avoid losing work', 'Check for validation errors at the top of the form'], type: 'interactive', ui_type: 'save' },
      { title: 'Use the View', instruction: 'Switch to the "{view}" view to see filtered records.', detail: 'Views provide pre-configured filters and column layouts to help you find records quickly.', tips: ['Click column headers to sort', 'Use the search bar to filter within the view'], type: 'interactive', ui_type: 'view' },
    ];

    // Add business rule observations
    businessRules.forEach(rule => {
      annotations.push({
        step_id: crypto.randomUUID(),
        title: `Business Rule: ${rule.name}`,
        step_type: 'text',
        instruction: `This entity has an automated business rule: "${rule.name}".`,
        tooltip_text: rule.description || '',
        detail_text: `${rule.description || 'This rule runs automatically when you interact with the form.'}. Business rules enforce data consistency and logic in real-time.`,
        tips: ['Business rules run in real-time as you edit', 'They can show/hide fields, set values, or show notifications'],
        business_rule_name: rule.name,
      });
    });

    for (let i = 0; i < stepCount && i < stepTemplates.length; i++) {
      const tpl = stepTemplates[i];
      // Safe field access — fall back to a placeholder when fields array is empty
      const field = fields.length > 0 ? fields[i % fields.length] : { display_name: 'Name', is_required: false, field_type: 'text', logical_name: 'name' };
      const view = views[0];
      annotations.push({
        step_id: crypto.randomUUID(),
        title: tpl.title.replace('{entity}', wf.primary_entity_display_name).replace('{field}', field?.display_name || 'Name'),
        step_type: tpl.type,
        ui_type: tpl.ui_type,
        highlight_field: field,
        highlight_view: view,
        instruction: tpl.instruction
          .replace('{entity}', wf.primary_entity_display_name)
          .replace('{field}', field?.display_name || 'Name')
          .replace('{view}', view?.name || 'Active Records'),
        tooltip_text: `Step ${i + 1} of ${stepCount}`,
        detail_text: tpl.detail
          .replace('{entity}', wf.primary_entity_display_name)
          .replace('{field}', field?.display_name || 'Name')
          .replace('{req}', field?.is_required ? 'required' : 'optional')
          .replace('{type}', field?.field_type || 'text')
          .replace('{view}', view?.name || 'Active Records'),
        tips: tpl.tips,
      });
    }

    return {
      track_id: crypto.randomUUID(),
      workflow_id: wf.id,
      title: wf.name,
      description: wf.description,
      estimated_duration_minutes: stepCount * 2,
      step_count: annotations.length,
      annotations,
      learning_objectives: [
        `Understand how to navigate to ${wf.primary_entity_display_name}`,
        `Create and manage ${wf.primary_entity_display_name} records`,
        `Use views to find and filter data`,
        `Understand related records and data relationships`,
      ],
      disabled_step_ids: [],
    };
  });

  state.trainingContent = {
    project_id: state.project.project_id,
    app_unique_name: state.selectedApp || 'default_app',
    app_display_name: state.project.app_module_summaries[0]?.display_name || 'Application',
    pipeline_run_id: crypto.randomUUID(),
    completed_at: new Date().toISOString(),
    brand: { ...state.brand },
    screens: [],
    step_layouts: [],
    sitemap_structure: {},
    command_bar_actions: {},
    solution_overview: `This solution contains ${state.project.entity_count} entities across ${state.project.app_module_count} app modules. The training covers ${tracks.length} workflows with interactive walkthroughs.`,
    tracks,
    documentation_pages: [],
    warnings: [],
  };

  state.currentTrackIndex = 0;
  state.currentStepIndex = 0;
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: TRAINING / WALKTHROUGH PLAYER
// ══════════════════════════════════════════════════════════════════════

function renderTraining() {
  if (!state.trainingContent) {
    if (state.pipelineStatus === 'running') {
      return `
        <div class="page-header"><h1>Training</h1></div>
        <div class="card">
          <div class="empty-state">
            <span class="spinner" style="width:32px;height:32px;border-width:3px;margin-bottom:16px"></span>
            <h3>Generating training content…</h3>
            <p>The AI pipeline is running. Content will appear here when complete.</p>
            <button class="btn btn-secondary mt-16"
              onclick="document.querySelector('[data-view=pipeline]').click()">Watch pipeline progress</button>
          </div>
        </div>`;
    }
    return noProjectMessage('Training', 'Run the AI pipeline first to generate training content');
  }

  const tc = state.trainingContent;
  const tracks = tc.tracks;
  const track = tracks[state.currentTrackIndex];
  if (!track) return '<p>No tracks available</p>';

  const step = track.annotations[state.currentStepIndex];
  const entity = state.project.entities_detail.find(e =>
    e.logical_name === state.confirmedWorkflows[state.currentTrackIndex]?.primary_entity
  );
  const fields = (entity?.fields ?? []).slice(0, 6);

  return `
    <div class="page-header">
      <div class="flex-between">
        <div>
          <h1>Training Player</h1>
          <p>${tc.app_display_name} &middot; ${tc.solution_overview.substring(0, 80)}...</p>
        </div>
        <div class="flex gap-8">
          <select id="track-select" class="btn btn-secondary" style="font-size:14px">
            ${tracks.map((t, i) => `<option value="${i}" ${i === state.currentTrackIndex ? 'selected' : ''}>${t.title}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="flex-between">
        <div>
          <strong>${track.title}</strong>
          <p class="text-sm text-muted mt-8">${track.description}</p>
        </div>
        <div class="text-sm text-muted">
          ~${track.estimated_duration_minutes} min &middot; ${track.step_count} steps
        </div>
      </div>
      <div class="mt-8">
        <div class="progress-bar" style="height:8px">
          <div class="progress-fill green" style="width:${((state.currentStepIndex + 1) / track.annotations.length * 100).toFixed(0)}%"></div>
        </div>
        <div class="progress-text">Step ${state.currentStepIndex + 1} of ${track.annotations.length}</div>
      </div>
      ${track.learning_objectives.length > 0 ? `
        <details class="mt-16" style="font-size:13px">
          <summary style="cursor:pointer;font-weight:600;color:#605e5c">Learning Objectives</summary>
          <ul style="padding-left:20px;margin-top:8px;line-height:1.8">
            ${track.learning_objectives.map(o => `<li>${o}</li>`).join('')}
          </ul>
        </details>` : ''}
    </div>

    <div class="walkthrough-container">
      <div class="walkthrough-sidebar">
        <div class="walkthrough-sidebar-header">Steps</div>
        <ul class="step-list">
          ${track.annotations.map((a, i) => `
            <li class="step-item ${i === state.currentStepIndex ? 'active' : ''} ${i < state.currentStepIndex ? 'completed' : ''}"
                data-step="${i}">
              <span class="step-number">${i < state.currentStepIndex ? '&#10003;' : i + 1}</span>
              <span style="flex:1">${a.title}</span>
              ${a.step_type === 'text' ? '<span class="tag" style="font-size:10px">Info</span>' : ''}
            </li>`).join('')}
        </ul>
      </div>

      <div class="walkthrough-main">
        ${step ? renderStepContent(step, fields, entity) : '<p>No step selected</p>'}

        <div class="walkthrough-nav">
          <button class="btn btn-secondary" id="prev-step" ${state.currentStepIndex === 0 ? 'disabled' : ''}>
            &larr; Previous
          </button>
          <span class="walkthrough-progress-text">
            Step ${state.currentStepIndex + 1} of ${track.annotations.length}
          </span>
          <button class="btn btn-primary" id="next-step">
            ${state.currentStepIndex >= track.annotations.length - 1 ? 'Complete &#10003;' : 'Next &rarr;'}
          </button>
        </div>
      </div>
    </div>`;
}

function renderStepContent(step, fields, entity) {
  if (step.step_type === 'text') {
    return `
      <div class="walkthrough-content-area">
        <div class="step-header">
          <span class="badge badge-blue" style="margin-bottom:8px">Information</span>
          <div class="step-title">${step.title}</div>
        </div>
        <div class="step-instruction">${step.instruction}</div>
        <div class="step-detail">${step.detail_text}</div>
        ${step.tips.length > 0 ? `
          <div class="step-tips">
            <h4>Tips</h4>
            <ul>${step.tips.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>` : ''}
      </div>`;
  }

  const mockupFns = {
    sitemap:     () => renderMockupSitemap(step, entity),
    command_bar: () => renderMockupCommandBar(step, entity),
    form:        () => renderMockupForm(step, fields, entity),
    related:     () => renderMockupRelated(step, entity),
    save:        () => renderMockupSave(step, fields, entity),
    view:        () => renderMockupView(step, entity),
  };
  const mockupHtml = (mockupFns[step.ui_type] || mockupFns.form)();

  return `
    <div class="walkthrough-content-area">
      <div class="step-header">
        <div class="step-title">${step.title}</div>
      </div>
      <div class="step-instruction">${step.instruction}</div>
      ${mockupHtml}
      ${step.tips.length > 0 ? `
        <div class="step-tips">
          <h4>Tips</h4>
          <ul>${step.tips.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>` : ''}
    </div>`;
}

function renderMockupSitemap(step, entity) {
  const entityName = entity?.display_name || 'Records';
  const relatedAreas = (state.sitemapItems || [])
    .map(logicalName => {
      const e = state.project?.entities_detail?.find(x => x.logical_name === logicalName);
      return e?.display_name || logicalName;
    })
    .filter(Boolean)
    .slice(0, 6);
  if (relatedAreas.length === 0) relatedAreas.push(entityName);

  return `
    <div class="mock-d365-shell">
      <div class="mock-d365-sitemap">
        <div class="mock-sitemap-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff"><rect width="16" height="16" rx="3" fill="#0078D4"/><path d="M3 4h10v1.5H3zm0 3h10v1.5H3zm0 3h7v1.5H3z" fill="#fff"/></svg>
          <span>Navigation</span>
        </div>
        <div class="mock-sitemap-items">
          ${relatedAreas.map(name => `
            <div class="mock-sitemap-item ${name === entityName ? 'active' : ''}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M2 2h10v2H2zm0 4h10v2H2zm0 4h7v2H2z"/></svg>
              <span>${name}</span>
              ${name === entityName ? '<div class="mock-coach-dot"></div>' : ''}
            </div>`).join('')}
        </div>
      </div>
      <div class="mock-d365-main">
        <div class="mock-d365-breadcrumb">${entityName}</div>
        <div class="mock-d365-content-placeholder">
          <div class="mock-placeholder-row wide"></div>
          <div class="mock-placeholder-row medium"></div>
          <div class="mock-placeholder-row short"></div>
        </div>
      </div>
      <div class="mock-coach-bubble left">
        <div class="mock-coach-arrow-left"></div>
        <strong>Click here</strong><br>Select <em>${entityName}</em> from the sitemap to open the list of records.
      </div>
    </div>`;
}

function renderMockupCommandBar(step, entity) {
  const entityName = entity?.display_name || 'Records';
  return `
    <div class="mock-d365-shell" style="flex-direction:column">
      <div class="mock-command-bar">
        <button class="mock-cmd-btn primary highlighted">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2"/></svg>
          + New
          <div class="mock-coach-bubble top">
            <div class="mock-coach-arrow-up"></div>
            <strong>Click "+ New"</strong><br>Opens a blank ${entityName} form ready to fill in.
          </div>
        </button>
        <button class="mock-cmd-btn">Delete</button>
        <button class="mock-cmd-btn">Refresh</button>
        <button class="mock-cmd-btn">Export to Excel</button>
      </div>
      <div class="mock-d365-view-area">
        <div class="mock-view-header">${entityName} — Active ${entityName}s</div>
        <div class="mock-view-grid-empty">
          <div class="mock-placeholder-row wide"></div>
          <div class="mock-placeholder-row medium"></div>
          <div class="mock-placeholder-row short"></div>
        </div>
      </div>
    </div>`;
}

function renderMockupForm(step, fields, entity) {
  const entityName = entity?.display_name || 'Record';
  const highlightField = step.highlight_field || (fields.length > 0 ? fields[0] : null);
  const displayFields = fields.length > 0 ? fields.slice(0, 6) : [
    { display_name: 'Name', is_required: true, field_type: 'text', logical_name: 'name' },
    { display_name: 'Status', is_required: false, field_type: 'text', logical_name: 'status' },
  ];

  return `
    <div class="d365-form-preview">
      <div class="d365-form-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0078D4"><path d="M3 3h14v14H3z" opacity="0.2"/><path d="M3 3h14v2H3zm0 4h6v2H3zm0 4h6v2H3zm8-4h6v6h-6z" fill="#0078D4"/></svg>
        <span class="d365-form-title">${entityName}: New Record</span>
      </div>
      <div class="d365-form-body">
        <div class="d365-form-section">
          <div class="d365-form-section-title">General</div>
          <div class="d365-field-row">
            ${displayFields.map(f => {
              const isHighlighted = highlightField && f.logical_name === highlightField.logical_name;
              return `
                <div class="d365-field ${isHighlighted ? 'highlighted' : ''}">
                  <label>${f.display_name} ${f.is_required ? '<span style="color:#d13438">*</span>' : ''}</label>
                  <input class="field-input" type="text" placeholder="${f.field_type === 'datetime' ? 'mm/dd/yyyy' : f.field_type === 'int' || f.field_type === 'decimal' ? '0' : ''}" readonly>
                  ${isHighlighted ? `
                    <div class="coach-mark">
                      <div class="coach-mark-title">Enter ${f.display_name}</div>
                      <div class="coach-mark-text">${step.detail_text.substring(0, 120)}${step.detail_text.length > 120 ? '…' : ''}</div>
                    </div>` : ''}
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function renderMockupRelated(step, entity) {
  const entityName = entity?.display_name || 'Record';
  // Pick a few related entity names from the workflow's sitemapItems
  const relatedEntities = (state.sitemapItems || [])
    .filter(n => n !== entity?.logical_name)
    .map(logicalName => {
      const e = state.project?.entities_detail?.find(x => x.logical_name === logicalName);
      return e?.display_name || logicalName;
    })
    .slice(0, 3);
  if (relatedEntities.length === 0) relatedEntities.push('Activities', 'Notes');

  return `
    <div class="d365-form-preview">
      <div class="d365-form-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0078D4"><path d="M3 3h14v14H3z" opacity="0.2"/><path d="M3 3h14v2H3zm0 4h6v2H3zm0 4h6v2H3zm8-4h6v6h-6z" fill="#0078D4"/></svg>
        <span class="d365-form-title">${entityName}: Sample Record</span>
      </div>
      <div class="d365-form-body">
        <div class="mock-related-tabs">
          ${relatedEntities.map((name, i) => `
            <div class="mock-related-tab ${i === 0 ? 'active' : ''}">${name}</div>`).join('')}
        </div>
        <div class="mock-subgrid">
          <div class="mock-subgrid-toolbar">
            <span class="text-sm text-muted">${relatedEntities[0]} (0)</span>
            <button class="mock-cmd-btn small primary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5"/></svg>
              Add Existing
            </button>
          </div>
          <div class="mock-subgrid-header">
            <div class="mock-subgrid-cell header">Name</div>
            <div class="mock-subgrid-cell header">Created On</div>
            <div class="mock-subgrid-cell header">Status</div>
          </div>
          <div class="mock-subgrid-empty">
            <span class="text-muted text-sm">No records found. Click "+ Add Existing" to associate records.</span>
          </div>
        </div>
        <div class="coach-mark" style="margin-top:0">
          <div class="coach-mark-title">Related Records</div>
          <div class="coach-mark-text">This section shows ${relatedEntities[0]} records linked to this ${entityName}. Use the tabs above to switch between related entity types.</div>
        </div>
      </div>
    </div>`;
}

function renderMockupSave(step, fields, entity) {
  const entityName = entity?.display_name || 'Record';
  const displayFields = fields.length > 0 ? fields.slice(0, 4) : [
    { display_name: 'Name', is_required: true, field_type: 'text', logical_name: 'name' },
    { display_name: 'Status', is_required: false, field_type: 'text', logical_name: 'status' },
  ];

  return `
    <div class="d365-form-preview">
      <div class="mock-unsaved-banner">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#8a5700"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4v4M8 11v1"/></svg>
        Unsaved changes — click Save or press Ctrl+S
      </div>
      <div class="d365-form-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0078D4"><path d="M3 3h14v14H3z" opacity="0.2"/><path d="M3 3h14v2H3zm0 4h6v2H3zm0 4h6v2H3zm8-4h6v6h-6z" fill="#0078D4"/></svg>
        <span class="d365-form-title">${entityName}: New Record *</span>
        <div class="mock-save-actions">
          <button class="mock-cmd-btn primary highlighted" style="position:relative">
            Save
            <div class="mock-coach-bubble top" style="white-space:nowrap">
              <div class="mock-coach-arrow-up"></div>
              <strong>Save</strong> — Ctrl+S
            </div>
          </button>
          <button class="mock-cmd-btn">Discard</button>
        </div>
      </div>
      <div class="d365-form-body">
        <div class="d365-form-section">
          <div class="d365-form-section-title">General</div>
          <div class="d365-field-row">
            ${displayFields.map(f => `
              <div class="d365-field">
                <label>${f.display_name} ${f.is_required ? '<span style="color:#d13438">*</span>' : ''}</label>
                <input class="field-input" type="text" placeholder="(entered)" readonly style="background:#f3f2f1">
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function renderMockupView(step, entity) {
  const entityName = entity?.display_name || 'Records';
  const viewName = step.highlight_view?.name || 'Active Records';
  const columns = step.highlight_view?.columns?.slice(0, 5) || [];
  // Fallback columns from entity fields
  const fieldCols = (entity?.fields ?? []).slice(0, 5).map(f => f.display_name);
  const displayCols = columns.length > 0
    ? columns.map(c => c.replace(/^[a-z]+\d*_/, '').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase()))
    : (fieldCols.length > 0 ? fieldCols : ['Name', 'Status', 'Created On']);

  const mockRows = [
    ['Sample Record 1', 'Active', '01/10/2025'],
    ['Sample Record 2', 'Active', '01/11/2025'],
    ['Sample Record 3', 'Inactive', '01/12/2025'],
  ];

  return `
    <div class="d365-form-preview">
      <div class="mock-command-bar" style="border-bottom:1px solid #e1dfdd">
        <button class="mock-cmd-btn primary">+ New</button>
        <button class="mock-cmd-btn">Delete</button>
        <button class="mock-cmd-btn">Refresh</button>
        <div class="mock-view-selector">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="#0078D4"><path d="M2 4h10v1H2zm0 3h10v1H2zm0 3h7v1H2z"/></svg>
          <span style="color:#0078D4;font-weight:600">${viewName}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#605e5c"><path d="M2 3l3 4 3-4"/></svg>
        </div>
      </div>
      <div class="mock-view-grid">
        <div class="mock-view-grid-header">
          <div class="mock-view-col-check"><input type="checkbox" disabled></div>
          ${displayCols.map(col => `<div class="mock-view-col-head">${col}</div>`).join('')}
        </div>
        ${mockRows.map(row => `
          <div class="mock-view-grid-row">
            <div class="mock-view-col-check"><input type="checkbox" disabled></div>
            ${displayCols.map((col, i) => `<div class="mock-view-col">${i < row.length ? row[i] : ''}</div>`).join('')}
          </div>`).join('')}
      </div>
      <div class="mock-view-footer">
        <span class="text-sm text-muted">3 records — sorted by Created On (desc)</span>
      </div>
    </div>`;
}

function bindTrainingEvents() {
  const trackSelect = document.getElementById('track-select');
  if (trackSelect) {
    trackSelect.addEventListener('change', () => {
      state.currentTrackIndex = parseInt(trackSelect.value);
      state.currentStepIndex = 0;
      render();
    });
  }

  document.querySelectorAll('.step-item').forEach(item => {
    item.addEventListener('click', () => {
      state.currentStepIndex = parseInt(item.dataset.step);
      render();
    });
  });

  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  if (prevBtn) prevBtn.addEventListener('click', () => { state.currentStepIndex--; render(); });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const track = state.trainingContent.tracks[state.currentTrackIndex];
    if (state.currentStepIndex < track.annotations.length - 1) {
      state.currentStepIndex++;
      render();
    } else {
      showToast('Walkthrough completed!');
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: ADOPTION DASHBOARD
// ══════════════════════════════════════════════════════════════════════

function generateAdoptionData() {
  const tracks = state.confirmedWorkflows.map(wf => {
    const users = [
      { name: 'Alice Jensen', email: 'alice@contoso.com' },
      { name: 'Bob Smith', email: 'bob@contoso.com' },
      { name: 'Carol Chen', email: 'carol@contoso.com' },
      { name: 'David Park', email: 'david@contoso.com' },
      { name: 'Eve Taylor', email: 'eve@contoso.com' },
    ];

    return {
      app_track_id: crypto.randomUUID(),
      app_name: wf.name,
      total_steps: wf.estimated_steps,
      enrolled_users: users.length,
      completed_users: randomInt(1, 3),
      average_completion_percentage: randomInt(35, 85),
      user_progress: users.map(u => ({
        user_email: u.email,
        user_display_name: u.name,
        seat_id: crypto.randomUUID(),
        completed_count: randomInt(0, wf.estimated_steps),
        total_steps: wf.estimated_steps,
        completion_percentage: randomInt(0, 100),
        is_complete: Math.random() > 0.7,
        started_at: new Date(Date.now() - randomInt(1, 14) * 86400000).toISOString(),
        last_activity_at: new Date(Date.now() - randomInt(0, 3) * 86400000).toISOString(),
        completed_at: Math.random() > 0.7 ? new Date().toISOString() : null,
      })),
    };
  });

  state.adoptionData = {
    project_id: state.project.project_id,
    total_enrolled_users: 5,
    total_tracks: tracks.length,
    overall_completion_percentage: Math.round(tracks.reduce((s, t) => s + t.average_completion_percentage, 0) / tracks.length),
    tracks,
  };
}

function renderAdoption() {
  if (!state.adoptionData) {
    return noProjectMessage('Adoption Dashboard', 'Run the pipeline first to generate training data');
  }

  const data = state.adoptionData;

  return `
    <div class="page-header">
      <h1>Adoption Dashboard</h1>
      <p>Monitor training progress across all users</p>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">${data.total_enrolled_users}</div><div class="stat-label">Enrolled Users</div></div>
      <div class="stat-card"><div class="stat-value">${data.total_tracks}</div><div class="stat-label">Training Tracks</div></div>
      <div class="stat-card"><div class="stat-value">${data.overall_completion_percentage}%</div><div class="stat-label">Overall Completion</div></div>
      <div class="stat-card"><div class="stat-value">${data.tracks.reduce((s, t) => s + t.completed_users, 0)}</div><div class="stat-label">Completed Users</div></div>
    </div>

    <div class="chart-grid">
      <div class="card">
        <div class="card-title">Completion by Track</div>
        <div class="chart-container"><canvas id="track-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">User Progress Overview</div>
        <div class="chart-container"><canvas id="user-chart"></canvas></div>
      </div>
    </div>

    <div class="card mt-24">
      <div class="card-title">User Progress Details</div>
      ${data.tracks.map(track => `
        <div class="mb-24">
          <div class="flex-between mb-16">
            <strong>${track.app_name}</strong>
            <span class="badge ${track.average_completion_percentage > 70 ? 'badge-green' : track.average_completion_percentage > 40 ? 'badge-orange' : 'badge-red'}">
              ${track.average_completion_percentage}% avg
            </span>
          </div>
          <table class="data-table">
            <thead><tr><th>User</th><th>Progress</th><th>Status</th><th>Last Activity</th></tr></thead>
            <tbody>
              ${track.user_progress.map(u => `
                <tr>
                  <td>
                    <strong>${u.user_display_name}</strong>
                    <br><span class="text-sm text-muted">${u.user_email}</span>
                  </td>
                  <td style="width:200px">
                    <div class="progress-bar"><div class="progress-fill ${u.is_complete ? 'green' : ''}" style="width:${u.completion_percentage}%"></div></div>
                    <span class="text-sm text-muted">${u.completed_count}/${u.total_steps} steps (${u.completion_percentage}%)</span>
                  </td>
                  <td>${u.is_complete ? '<span class="badge badge-green">Complete</span>' : '<span class="badge badge-blue">In Progress</span>'}</td>
                  <td class="text-sm text-muted">${formatDate(u.last_activity_at)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`).join('')}
    </div>`;
}

function bindAdoptionEvents() {
  if (!state.adoptionData) return;
  const data = state.adoptionData;

  // Track completion chart
  const trackCtx = document.getElementById('track-chart');
  if (trackCtx) {
    new Chart(trackCtx, {
      type: 'bar',
      data: {
        labels: data.tracks.map(t => t.app_name.length > 25 ? t.app_name.substring(0, 25) + '...' : t.app_name),
        datasets: [{
          label: 'Completion %',
          data: data.tracks.map(t => t.average_completion_percentage),
          backgroundColor: '#0078D4',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } },
      },
    });
  }

  // User progress doughnut
  const userCtx = document.getElementById('user-chart');
  if (userCtx) {
    const allUsers = data.tracks.flatMap(t => t.user_progress);
    const completed = allUsers.filter(u => u.is_complete).length;
    const inProgress = allUsers.length - completed;

    new Chart(userCtx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress'],
        datasets: [{
          data: [completed, inProgress],
          backgroundColor: ['#107c10', '#0078D4'],
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: BRANDING
// ══════════════════════════════════════════════════════════════════════

function renderBranding() {
  if (!state.project) return noProjectMessage('Branding');
  const b = state.brand;

  return `
    <div class="page-header">
      <h1>Branding</h1>
      <p>Customize the look and feel of your training portal</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Logo</div>
        <div class="flex gap-16" style="align-items:flex-start">
          <div class="logo-preview" id="logo-preview">
            ${b.logo_url ? `<img src="${b.logo_url}" alt="Logo">` : '<span class="text-muted text-sm">No logo</span>'}
          </div>
          <div>
            <input type="file" id="logo-input" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none">
            <button class="btn btn-secondary" id="upload-logo-btn">Upload Logo</button>
            <p class="text-sm text-muted mt-8">PNG, JPG, SVG, WebP &middot; Max 2 MB</p>
            ${b.logo_url ? '<button class="btn btn-ghost btn-sm mt-8" id="remove-logo-btn">Remove</button>' : ''}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Colours</div>
        <div class="color-picker-row">
          <label>Primary</label>
          <input type="color" value="${b.primary_color}" data-color="primary_color">
          <span class="color-hex">${b.primary_color}</span>
        </div>
        <div class="color-picker-row">
          <label>Secondary</label>
          <input type="color" value="${b.secondary_color}" data-color="secondary_color">
          <span class="color-hex">${b.secondary_color}</span>
        </div>
        <div class="color-picker-row">
          <label>Accent</label>
          <input type="color" value="${b.accent_color}" data-color="accent_color">
          <span class="color-hex">${b.accent_color}</span>
        </div>
        <div class="color-picker-row">
          <label>Header Text</label>
          <input type="color" value="${b.header_text_color}" data-color="header_text_color">
          <span class="color-hex">${b.header_text_color}</span>
        </div>
        <div class="color-picker-row">
          <label>Background</label>
          <input type="color" value="${b.background_color}" data-color="background_color">
          <span class="color-hex">${b.background_color}</span>
        </div>
        <button class="btn btn-ghost btn-sm mt-8" id="reset-brand">Reset to Default</button>
      </div>
    </div>

    <div class="card mt-24">
      <div class="card-title">Preview</div>
      <div class="brand-preview">
        <div style="background:${b.primary_color};color:${b.header_text_color};padding:12px 16px;display:flex;align-items:center;gap:10px">
          ${b.logo_url ? `<img src="${b.logo_url}" style="height:28px" alt="Logo">` : '<div style="width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:6px"></div>'}
          <strong>Training Portal</strong>
        </div>
        <div style="background:${b.background_color};padding:20px">
          <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #edebe9">
            <div style="color:${b.primary_color};font-weight:600;font-size:16px;margin-bottom:8px">Sample Training Track</div>
            <p style="font-size:14px;color:#605e5c">This is how your training content will look to end users.</p>
            <button style="background:${b.primary_color};color:${b.header_text_color};border:none;padding:8px 16px;border-radius:6px;margin-top:12px;font-size:14px;cursor:pointer">Start Training</button>
          </div>
        </div>
      </div>
    </div>`;
}

function bindBrandingEvents() {
  // Color pickers
  document.querySelectorAll('[data-color]').forEach(input => {
    input.addEventListener('input', () => {
      state.brand[input.dataset.color] = input.value;
      applyBrand();
      render();
    });
  });

  // Logo upload
  const logoBtn = document.getElementById('upload-logo-btn');
  const logoInput = document.getElementById('logo-input');
  if (logoBtn && logoInput) {
    logoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', () => {
      const file = logoInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { showToast('Logo must be under 2 MB'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        state.brand.logo_url = reader.result;
        applyBrand();
        render();
        showToast('Logo updated');
      };
      reader.readAsDataURL(file);
    });
  }

  // Remove logo
  const removeBtn = document.getElementById('remove-logo-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      state.brand.logo_url = null;
      applyBrand();
      render();
    });
  }

  // Reset
  const resetBtn = document.getElementById('reset-brand');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.brand = {
        primary_color: '#0078D4',
        secondary_color: '#106EBE',
        accent_color: '#005A9E',
        header_text_color: '#FFFFFF',
        background_color: '#FAF9F8',
        logo_url: state.brand.logo_url,
      };
      applyBrand();
      render();
      showToast('Colours reset to default');
    });
  }
}

function applyBrand() {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', state.brand.primary_color);
  root.style.setProperty('--brand-header-text', state.brand.header_text_color);
  root.style.setProperty('--brand-background', state.brand.background_color);

  // Update header logo
  const logoContainer = document.getElementById('header-logo-container');
  if (state.brand.logo_url) {
    logoContainer.innerHTML = `<img src="${state.brand.logo_url}" style="height:28px;border-radius:4px" alt="Logo">`;
  }
}

// ══════════════════════════════════════════════════════════════════════
// VIEW: INVITES
// ══════════════════════════════════════════════════════════════════════

function renderInvites() {
  if (!state.project) return noProjectMessage('Invites');

  return `
    <div class="page-header">
      <div class="flex-between">
        <div>
          <h1>Invite Links</h1>
          <p>Create and manage invite links for end-user training access</p>
        </div>
        <button class="btn btn-primary" id="create-invite">Create Invite Link</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">${state.invites.length}</div><div class="stat-label">Total Invites</div></div>
      <div class="stat-card"><div class="stat-value">${state.invites.filter(i => i.status === 'active').length}</div><div class="stat-label">Active</div></div>
      <div class="stat-card"><div class="stat-value">${state.invites.reduce((s, i) => s + i.use_count, 0)}</div><div class="stat-label">Total Uses</div></div>
    </div>

    ${state.invites.length === 0 ? `
      <div class="card">
        <div class="empty-state">
          <h3>No invite links yet</h3>
          <p>Create an invite link to share training access with end users.</p>
        </div>
      </div>` : `
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Label</th><th>Link</th><th>Status</th><th>Uses</th><th>Expires</th><th>Created</th><th></th></tr></thead>
          <tbody>
            ${state.invites.map(inv => `
              <tr>
                <td><strong>${inv.label || 'Untitled'}</strong></td>
                <td>
                  <div class="invite-url-box">
                    <span class="url-text">${inv.invite_url}</span>
                    <button class="btn btn-ghost btn-sm copy-url" data-url="${inv.invite_url}">Copy</button>
                  </div>
                </td>
                <td><span class="badge ${inv.status === 'active' ? 'badge-green' : inv.status === 'expired' ? 'badge-orange' : 'badge-red'}">${capitalize(inv.status)}</span></td>
                <td>${inv.use_count}${inv.max_uses ? '/' + inv.max_uses : ''}</td>
                <td class="text-sm text-muted">${inv.expires_at ? formatDate(inv.expires_at) : 'Never'}</td>
                <td class="text-sm text-muted">${formatDate(inv.created_at)}</td>
                <td>
                  ${inv.status === 'active' ? `<button class="btn btn-danger btn-sm revoke-btn" data-id="${inv.id}">Revoke</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}

    <!-- Consent Preview -->
    <div class="card mt-24">
      <div class="card-title">End-User Experience Preview</div>
      <div class="card-subtitle">This is what end users see when they click an invite link</div>
      <div class="consent-card" style="border:1px solid #edebe9">
        <div style="background:${state.brand.primary_color};color:${state.brand.header_text_color};padding:16px;border-radius:8px 8px 0 0;margin:-24px -24px 20px">
          <h2 style="font-size:18px">${state.project.solution_display_name} Training</h2>
        </div>
        <p>Before accessing training, please review and accept the following:</p>
        <div class="consent-checks">
          <label><input type="checkbox" checked disabled> I accept the <a href="#">Privacy Policy</a></label>
          <label><input type="checkbox" checked disabled> I accept the <a href="#">Terms of Service</a></label>
          <label><input type="checkbox" checked disabled> I accept the <a href="#">Cookie Policy</a></label>
        </div>
        <button class="btn btn-primary" disabled>Accept & Continue</button>
        <p class="text-sm text-muted mt-16">Your progress will be tracked for adoption reporting.</p>
      </div>
    </div>`;
}

function bindInviteEvents() {
  const createBtn = document.getElementById('create-invite');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const token = crypto.randomUUID().substring(0, 12);
      state.invites.push({
        id: crypto.randomUUID(),
        project_id: state.project.project_id,
        token,
        invite_url: `${window.location.origin}/invite/${token}`,
        label: `Training Invite ${state.invites.length + 1}`,
        status: 'active',
        max_uses: 25,
        use_count: 0,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_by: 'demo@contoso.com',
        created_at: new Date().toISOString(),
        revoked_at: null,
      });
      render();
      showToast('Invite link created');
    });
  }

  document.querySelectorAll('.copy-url').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.url);
        showToast('Link copied to clipboard');
      } catch {
        showToast('Could not copy — check clipboard permissions');
      }
    });
  });

  document.querySelectorAll('.revoke-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inv = state.invites.find(i => i.id === btn.dataset.id);
      if (inv) { inv.status = 'revoked'; inv.revoked_at = new Date().toISOString(); }
      render();
      showToast('Invite revoked');
    });
  });
}

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════

function noProjectMessage(section, extra) {
  return `
    <div class="page-header"><h1>${section}</h1></div>
    <div class="card">
      <div class="empty-state">
        <h3>No solution loaded</h3>
        <p>${extra || 'Upload a Dataverse solution ZIP file to get started.'}</p>
        <button class="btn btn-primary mt-16" onclick="document.querySelector('[data-view=upload]').click()">Upload Solution</button>
      </div>
    </div>`;
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ══════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════

render();
