/**
 * Client-side Dataverse solution ZIP parser.
 * Uses JSZip to extract and parse solution.xml + customizations.xml
 */

export async function parseSolutionZip(file) {
  const zip = await JSZip.loadAsync(file);

  // Find key XML files (case-insensitive)
  const entries = Object.keys(zip.files);
  const solutionXmlKey = entries.find(e => e.toLowerCase() === 'solution.xml');
  const customizationsXmlKey = entries.find(e => e.toLowerCase() === 'customizations.xml');

  if (!solutionXmlKey) {
    throw new Error('Invalid solution: solution.xml not found in ZIP');
  }

  const solutionXml = await zip.file(solutionXmlKey).async('text');
  const customizationsXml = customizationsXmlKey
    ? await zip.file(customizationsXmlKey).async('text')
    : null;

  const parser = new DOMParser();
  const solDoc = parser.parseFromString(solutionXml, 'text/xml');
  const custDoc = customizationsXml
    ? parser.parseFromString(customizationsXml, 'text/xml')
    : null;

  // Parse solution metadata
  const solution = parseSolutionMetadata(solDoc);

  // Parse entities from customizations.xml
  const entities = custDoc ? parseEntities(custDoc) : [];

  // Parse app modules
  const appModules = custDoc ? parseAppModules(custDoc, solDoc) : [];

  // Collect warnings
  const warnings = [];
  if (!customizationsXmlKey) warnings.push('customizations.xml not found — entity data may be limited');
  if (entities.length === 0) warnings.push('No entities found in solution');

  return {
    project_id: crypto.randomUUID(),
    solution_unique_name: solution.uniqueName,
    solution_display_name: solution.displayName,
    solution_version: solution.version,
    publisher: solution.publisher,
    description: solution.description,
    entity_count: entities.length,
    app_module_count: appModules.length,
    entity_summaries: entities,
    app_module_summaries: appModules,
    entities_detail: entities.map(e => e._detail),
    warnings,
  };
}

function parseSolutionMetadata(doc) {
  const getText = (parent, tag) => {
    const el = parent.getElementsByTagName(tag)[0];
    return el ? el.textContent.trim() : '';
  };

  const solManifest = doc.getElementsByTagName('SolutionManifest')[0];
  if (!solManifest) {
    return { uniqueName: 'Unknown', displayName: 'Unknown', version: '1.0.0.0', publisher: 'Unknown', description: '' };
  }

  const solNode = solManifest.getElementsByTagName('Solution')[0] || solManifest;

  // Try different locations for the unique name
  let uniqueName = getText(solNode, 'UniqueName') || getText(solManifest, 'UniqueName');
  let version = getText(solNode, 'Version') || getText(solManifest, 'Version') || '1.0.0.0';

  // LocalizedNames
  let displayName = uniqueName;
  const localizedNames = solNode.getElementsByTagName('LocalizedName');
  if (localizedNames.length > 0) {
    displayName = localizedNames[0].getAttribute('description') || uniqueName;
  }

  // Publisher
  let publisher = 'Unknown';
  const pubNode = solManifest.getElementsByTagName('Publisher')[0];
  if (pubNode) {
    const pubLocNames = pubNode.getElementsByTagName('LocalizedName');
    publisher = pubLocNames.length > 0
      ? pubLocNames[0].getAttribute('description') || getText(pubNode, 'UniqueName')
      : getText(pubNode, 'UniqueName');
  }

  // Description
  let description = '';
  const descNodes = solNode.getElementsByTagName('Description');
  if (descNodes.length > 0) {
    const descLocNames = descNodes[0].getElementsByTagName('LocalizedName');
    description = descLocNames.length > 0
      ? descLocNames[0].getAttribute('description') || ''
      : descNodes[0].textContent.trim();
  }

  return { uniqueName, displayName, version, publisher, description };
}

function parseEntities(doc) {
  const entities = [];
  const entityNodes = doc.getElementsByTagName('Entity');

  for (const entityNode of entityNodes) {
    const name = getChildText(entityNode, 'Name');
    if (!name) continue;

    // Get display name from LocalizedNames
    let displayName = name;
    const localizedNames = entityNode.getElementsByTagName('LocalizedName');
    for (const ln of localizedNames) {
      // Take the first one that is a direct or near child of EntityInfo
      displayName = ln.getAttribute('description') || displayName;
      break;
    }

    // Parse fields/attributes
    const fields = parseFields(entityNode);
    const forms = parseForms(entityNode);
    const views = parseViews(entityNode);
    const businessRules = parseBusinessRules(entityNode);

    const isCustom = name.includes('_') && !name.startsWith('msdyn');

    const entity = {
      logical_name: name,
      display_name: formatDisplayName(displayName || name),
      is_custom_entity: isCustom,
      attribute_count: fields.length,
      form_count: forms.length,
      view_count: views.length,
      business_rule_count: businessRules.length,
      _detail: {
        entity_id: crypto.randomUUID(),
        logical_name: name,
        display_name: formatDisplayName(displayName || name),
        plural_name: formatDisplayName(displayName || name) + 's',
        description: `Entity ${formatDisplayName(displayName || name)} from the solution`,
        is_custom_entity: isCustom,
        primary_id_attribute: name + 'id',
        primary_name_attribute: name.replace(/^[^_]+_/, '') + '_name',
        field_count: fields.length,
        form_count: forms.length,
        view_count: views.length,
        business_rule_count: businessRules.length,
        fields,
        forms,
        views,
        business_rules: businessRules,
      },
    };

    entities.push(entity);
  }

  return entities;
}

function parseFields(entityNode) {
  const fields = [];
  const attrNodes = entityNode.getElementsByTagName('attribute');

  for (const attr of attrNodes) {
    // Only process direct children or near-children
    const physName = attr.getAttribute('PhysicalName') || '';
    const logicalName = getChildText(attr, 'LogicalName') || physName.toLowerCase();
    if (!logicalName) continue;

    let displayName = logicalName;
    const dispNames = attr.getElementsByTagName('displayname');
    if (dispNames.length > 0) {
      const desc = dispNames[0].getAttribute('description');
      if (desc) displayName = desc;
    }

    const type = getChildText(attr, 'Type') || attr.getAttribute('type') || 'string';
    const reqLevel = getChildText(attr, 'RequiredLevel') || 'none';

    fields.push({
      logical_name: logicalName,
      display_name: formatDisplayName(displayName),
      field_type: type.toLowerCase(),
      description: `${formatDisplayName(displayName)} field`,
      is_required: reqLevel.toLowerCase() !== 'none' && reqLevel.toLowerCase() !== 'recommended',
      is_primary_name: false,
      max_length: null,
      options: [],
      target_entities: [],
    });
  }

  // If no fields found from attributes, try to extract from other patterns
  if (fields.length === 0) {
    // Check for any field-like children
    const allChildren = entityNode.children;
    for (const child of allChildren) {
      if (child.tagName === 'attributes') {
        for (const attr of child.children) {
          const name = attr.getAttribute('name') || getChildText(attr, 'name');
          if (name) {
            fields.push({
              logical_name: name,
              display_name: formatDisplayName(name),
              field_type: 'string',
              description: '',
              is_required: false,
              is_primary_name: false,
              max_length: null,
              options: [],
              target_entities: [],
            });
          }
        }
      }
    }
  }

  return fields;
}

function parseForms(entityNode) {
  const forms = [];
  const formNodes = entityNode.getElementsByTagName('form');
  const systemFormNodes = entityNode.getElementsByTagName('systemform');
  const allFormNodes = [...formNodes, ...systemFormNodes];

  for (const form of allFormNodes) {
    const id = form.getAttribute('id') || crypto.randomUUID();
    const name = getChildText(form, 'LocalizedName')
      || form.getAttribute('name')
      || `Form ${forms.length + 1}`;
    const type = form.getAttribute('type') || getChildText(form, 'type') || 'main';

    forms.push({
      form_id: id,
      name: formatDisplayName(name),
      form_type: type,
      description: `${type} form`,
      tab_count: 0,
      field_count: 0,
    });
  }

  // Also check FormXml elements
  const formXmlNodes = entityNode.getElementsByTagName('FormXml');
  for (const fxNode of formXmlNodes) {
    if (forms.length > 0) break; // Already have forms
    forms.push({
      form_id: crypto.randomUUID(),
      name: 'Main Form',
      form_type: 'main',
      description: 'Main form',
      tab_count: fxNode.getElementsByTagName('tab').length,
      field_count: fxNode.getElementsByTagName('control').length,
    });
  }

  return forms;
}

function parseViews(entityNode) {
  const views = [];
  const savedQueryNodes = entityNode.getElementsByTagName('savedquery');
  const savedQueries = entityNode.getElementsByTagName('SavedQuery');
  const allViewNodes = [...savedQueryNodes, ...savedQueries];

  for (const view of allViewNodes) {
    const id = view.getAttribute('id') || getChildText(view, 'savedqueryid') || crypto.randomUUID();
    const name = getChildText(view, 'name') || `View ${views.length + 1}`;
    const isDefault = getChildText(view, 'isdefault') === '1';

    // Count columns from layoutxml or fetchxml
    const layoutXml = getChildText(view, 'layoutxml');
    let columnCount = 0;
    const columns = [];
    if (layoutXml) {
      const cellMatches = layoutXml.match(/name="([^"]+)"/g);
      if (cellMatches) {
        columnCount = cellMatches.length;
        cellMatches.forEach(m => {
          const col = m.replace('name="', '').replace('"', '');
          columns.push(col);
        });
      }
    }

    views.push({
      saved_query_id: id,
      name,
      description: isDefault ? 'Default view' : 'Custom view',
      is_default: isDefault,
      column_count: columnCount,
      columns: columns.slice(0, 8),
    });
  }

  return views;
}

function parseBusinessRules(entityNode) {
  const rules = [];
  const workflowNodes = entityNode.getElementsByTagName('Workflow');

  for (const wf of workflowNodes) {
    const category = wf.getAttribute('Category') || getChildText(wf, 'Category');
    // Business rules have category 2
    if (category === '2' || !category) {
      const id = wf.getAttribute('WorkflowId') || crypto.randomUUID();
      const name = getChildText(wf, 'Name') || wf.getAttribute('Name') || `Rule ${rules.length + 1}`;

      rules.push({
        workflow_id: id,
        name,
        description: `Business rule: ${name}`,
        scope: 'Entity',
        conditions: [],
        actions: [],
      });
    }
  }

  return rules;
}

function parseAppModules(custDoc, solDoc) {
  const modules = [];

  // Try to find AppModule components in solution.xml
  const rootComponents = solDoc.getElementsByTagName('RootComponent');
  for (const rc of rootComponents) {
    const type = rc.getAttribute('type');
    const schemaName = rc.getAttribute('schemaName') || rc.getAttribute('id') || '';

    // Type 80 = AppModule in Dataverse
    if (type === '80') {
      modules.push({
        unique_name: schemaName,
        display_name: formatDisplayName(schemaName),
        description: `Model-driven app: ${formatDisplayName(schemaName)}`,
        entity_count: 0,
        is_default: modules.length === 0,
      });
    }
  }

  // Also check customizations.xml for AppModule elements
  const appModuleNodes = custDoc.getElementsByTagName('AppModule');
  for (const am of appModuleNodes) {
    const uniqueName = getChildText(am, 'UniqueName') || am.getAttribute('UniqueName');
    if (!uniqueName) continue;

    // Skip if already found
    if (modules.some(m => m.unique_name === uniqueName)) continue;

    let displayName = uniqueName;
    const localizedNames = am.getElementsByTagName('LocalizedName');
    if (localizedNames.length > 0) {
      displayName = localizedNames[0].getAttribute('description') || uniqueName;
    }

    modules.push({
      unique_name: uniqueName,
      display_name: formatDisplayName(displayName),
      description: getChildText(am, 'Description') || `Model-driven app: ${formatDisplayName(displayName)}`,
      entity_count: am.getElementsByTagName('Entity').length || 0,
      is_default: modules.length === 0,
    });
  }

  // If no app modules found, create a default one
  if (modules.length === 0) {
    modules.push({
      unique_name: 'default_app',
      display_name: 'Default Application',
      description: 'Auto-generated app module for all entities',
      entity_count: 0,
      is_default: true,
    });
  }

  return modules;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getChildText(parent, tagName) {
  const el = parent.getElementsByTagName(tagName)[0];
  return el ? el.textContent.trim() : '';
}

function formatDisplayName(name) {
  if (!name) return '';
  // If already has spaces, return as-is
  if (name.includes(' ')) return name;
  // Remove prefix (e.g., "new_" or "cr123_")
  let clean = name.replace(/^[a-z]+\d*_/, '');
  // Split camelCase or underscores
  clean = clean.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  // Title case
  return clean.replace(/\b\w/g, c => c.toUpperCase());
}
