import { Dashboard, deriveLayoutForBreakpoint, resolveResize } from 'griddis';

const sceneEl = document.querySelector('.scene');
const boardEl = document.querySelector('#board');
const panelEl = document.querySelector('#panel');
const widgetTypeListEl = document.querySelector('#widget-type-list');
const widgetSizeListEl = document.querySelector('#widget-size-list');
const panelTitleEl = document.querySelector('#panel-title');
const wizardStep1El = document.querySelector('#wizard-step-1');
const wizardStep2El = document.querySelector('#wizard-step-2');
const wizardSizeHintEl = document.querySelector('#wizard-size-hint');
const wizardBackBtn = document.querySelector('#wizard-back');
const selectedEl = document.querySelector('#selected');
const toastEl = document.querySelector('#toast');

const fullWidthToggleBtn = document.querySelector('#full-width-toggle');
const editModeBtn = document.querySelector('#edit-mode');
const openPanelBtn = document.querySelector('#open-panel');
const closePanelBtn = document.querySelector('#close-panel');
const resetBtn = document.querySelector('#reset');
const layoutSharedEl = document.querySelector('#layout-shared');
const layoutPickerEl = document.querySelector('#layout-picker');
const layoutStatusEl = document.querySelector('#layout-status');
const saveCurrentLayoutBtn = document.querySelector('#save-current-layout');
const saveLayoutBtn = document.querySelector('#save-layout');
const renameLayoutBtn = document.querySelector('#rename-layout');
const deleteLayoutBtn = document.querySelector('#delete-layout');
const editPanelEl = document.querySelector('#edit-panel');
const closeEditPanelBtn = document.querySelector('#close-edit-panel');
const addCollapsibleAreaBtn = document.querySelector('#add-collapsible-area');
const confirmCollapsibleAreaBtn = document.querySelector('#confirm-collapsible-area');
const cancelCollapsibleAreaBtn = document.querySelector('#cancel-collapsible-area');
const collapsibleAreaListEl = document.querySelector('#collapsible-area-list');
const collapsibleAreaNameEl = document.querySelector('#collapsible-area-name');
const collapseEdgeOptionsEl = document.querySelector('#collapse-edge-options');
const collapseEdgeButtons = [...document.querySelectorAll('[data-collapse-edge]')];

const LAYOUT_LIBRARY_KEY = 'griddis-demo-layout-library-v1';
const CURRENT_USER_KEY = 'griddis-demo-current-user-v1';
const CURRENT_USER_DEFAULT = 'user-1';
const CUSTOM_LAYOUT_ACCESS_DEFAULT = 'personal';

function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY) ?? CURRENT_USER_DEFAULT;
}

const projectWidgetTemplates = [
  {
    id: 'kpi-2x4', type: 'kpi', label: 'KPI', w: 2, h: 4,
    breakpointSizes: {
      ultraWide: [{ w: 2, h: 4 }, { w: 2, h: 3 }, { w: 2, h: 2 }],
      desktop:   [{ w: 2, h: 4 }, { w: 2, h: 3 }, { w: 2, h: 2 }],
      tablet:    [{ w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      mobile:    [{ w: 3, h: 2 }, { w: 3, h: 1 }]
    }
  },
  {
    id: 'kpi-2x3', type: 'kpi', label: 'KPI', w: 2, h: 3,
    breakpointSizes: {
      ultraWide: [{ w: 2, h: 4 }, { w: 2, h: 3 }, { w: 2, h: 2 }],
      desktop:   [{ w: 2, h: 4 }, { w: 2, h: 3 }, { w: 2, h: 2 }],
      tablet:    [{ w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      mobile:    [{ w: 3, h: 2 }, { w: 3, h: 1 }]
    }
  },
  {
    id: 'kpi-2x2', type: 'kpi', label: 'KPI', w: 2, h: 2,
    breakpointSizes: {
      ultraWide: [{ w: 2, h: 4 }, { w: 2, h: 3 }, { w: 2, h: 2 }],
      desktop:   [{ w: 2, h: 4 }, { w: 2, h: 3 }, { w: 2, h: 2 }],
      tablet:    [{ w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      mobile:    [{ w: 3, h: 2 }, { w: 3, h: 1 }]
    }
  },
  {
    id: 'graph-2x2', type: 'graph', label: 'Graph', w: 2, h: 2,
    breakpointSizes: {
      ultraWide: [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      desktop:   [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      tablet:    [{ w: 6, h: 3 }, { w: 6, h: 2 }, { w: 4, h: 3 }, { w: 3, h: 2 }],
      mobile:    [{ w: 3, h: 3 }, { w: 3, h: 2 }]
    }
  },
  {
    id: 'graph-2x3', type: 'graph', label: 'Graph', w: 2, h: 3,
    breakpointSizes: {
      ultraWide: [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      desktop:   [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      tablet:    [{ w: 6, h: 3 }, { w: 6, h: 2 }, { w: 4, h: 3 }, { w: 3, h: 2 }],
      mobile:    [{ w: 3, h: 3 }, { w: 3, h: 2 }]
    }
  },
  {
    id: 'graph-3x2', type: 'graph', label: 'Graph', w: 3, h: 2,
    breakpointSizes: {
      ultraWide: [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      desktop:   [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      tablet:    [{ w: 6, h: 3 }, { w: 6, h: 2 }, { w: 4, h: 3 }, { w: 3, h: 2 }],
      mobile:    [{ w: 3, h: 3 }, { w: 3, h: 2 }]
    }
  },
  {
    id: 'graph-3x3', type: 'graph', label: 'Graph', w: 3, h: 3,
    breakpointSizes: {
      ultraWide: [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      desktop:   [{ w: 5, h: 3 }, { w: 4, h: 3 }, { w: 3, h: 3 }, { w: 3, h: 2 }, { w: 2, h: 2 }],
      tablet:    [{ w: 6, h: 3 }, { w: 6, h: 2 }, { w: 4, h: 3 }, { w: 3, h: 2 }],
      mobile:    [{ w: 3, h: 3 }, { w: 3, h: 2 }]
    }
  },
  {
    id: 'list-4x2', type: 'list', label: 'List', w: 4, h: 2,
    breakpointSizes: {
      ultraWide: [{ w: 4, h: 3 }, { w: 4, h: 2 }],
      desktop:   [{ w: 4, h: 3 }, { w: 4, h: 2 }],
      tablet:    [{ w: 6, h: 2 }, { w: 4, h: 2 }],
      mobile:    [{ w: 3, h: 3 }, { w: 3, h: 2 }]
    }
  },
  {
    id: 'list-4x3', type: 'list', label: 'List', w: 4, h: 3,
    breakpointSizes: {
      ultraWide: [{ w: 4, h: 3 }, { w: 4, h: 2 }],
      desktop:   [{ w: 4, h: 3 }, { w: 4, h: 2 }],
      tablet:    [{ w: 6, h: 2 }, { w: 4, h: 2 }],
      mobile:    [{ w: 3, h: 3 }, { w: 3, h: 2 }]
    }
  }
];

const RESPONSIVE_LAYOUTS = [
  { key: 'ultraWide', minWidth: 1920, columns: 12 },
  { key: 'desktop', minWidth: 1024, columns: 9 },
  { key: 'tablet', minWidth: 640, columns: 6 },
  { key: 'mobile', minWidth: 0, columns: 3 }
];

const dashboard = new Dashboard({
  columns: 12,
  rows: 10,
  widgetTemplates: projectWidgetTemplates,
  customLayoutAccess: CUSTOM_LAYOUT_ACCESS_DEFAULT
});
let selectedId = null;
let dragState = null;
let resizeState = null;
let editMode = false;
let fullWidthMode = true;
let activeBreakpointKey = null;
let responsiveApplyTimer = null;
let dragMoveFrame = null;
let pendingDragPointer = null;
let collapsibleAreas = [];
let collapsibleAreaDraft = null;
let collapsibleAreaResizeState = null;
let activeNamedLayoutKey = '';
let sharedScopeOverride = null;

function notify(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 1100);
}

function updateEditModeUI() {
  if (editModeBtn) {
    editModeBtn.textContent = editMode ? 'Editing' : 'Edit';
    editModeBtn.classList.toggle('is-editing', editMode);
  }

  if (editPanelEl) {
    editPanelEl.classList.toggle('is-open', editMode);
  }

  if (!editMode) {
    panelEl?.classList.add('hidden');
    cancelCollapsibleArea();
    if (dragState) {
      cleanupDragArtifacts();
      dragState = null;
    }
    if (resizeState) {
      resizeState.previewEl?.remove();
      resizeState.sourceEl?.classList.remove('dragging', 'resize-blocked');
      resizeState = null;
    }
    document.body.classList.remove('is-dragging', 'is-resizing');
  }

  updateNamedLayoutState();
  renderBoard();
}

function cleanupDragArtifacts() {
  if (!dragState) return;

  dragState.previewEl?.remove();
  dragState.sourceEl?.classList.remove('dragging', 'drag-origin-ghost');

  if (dragMoveFrame !== null) {
    cancelAnimationFrame(dragMoveFrame);
    dragMoveFrame = null;
  }
  pendingDragPointer = null;
  document.body.classList.remove('is-dragging', 'is-swap-ready');
}

function updateWidthModeUI() {
  if (fullWidthToggleBtn) {
    fullWidthToggleBtn.textContent = fullWidthMode ? 'Full width: on' : 'Full width: off';
  }

  if (sceneEl) {
    sceneEl.classList.toggle('is-constrained', !fullWidthMode);
  }

  scheduleResponsiveColumns();
}

function setSelected(id, options = {}) {
  selectedId = id;
  if (selectedEl) {
    selectedEl.textContent = id ?? 'none';
  }

  if (options.render !== false) {
    renderBoard();
  }
}

function getWidgetById(id) {
  return dashboard.getWidgets().find((widget) => widget.id === id) ?? null;
}

function getResponsiveViewportWidth() {
  const boardShellEl = boardEl?.closest('.board-shell');
  if (boardShellEl instanceof HTMLElement) {
    return boardShellEl.clientWidth;
  }

  if (sceneEl instanceof HTMLElement) {
    return sceneEl.clientWidth;
  }

  return window.innerWidth;
}

function getResponsiveLayout() {
  const width = getResponsiveViewportWidth();
  return RESPONSIVE_LAYOUTS.find((layout) => width >= layout.minWidth) ?? RESPONSIVE_LAYOUTS[RESPONSIVE_LAYOUTS.length - 1];
}

function getLayoutStorageKey(breakpointKey) {
  return `demo-layout:${breakpointKey}`;
}

function getCurrentBreakpointKey() {
  // Use the live viewport breakpoint so picker filtering/loading
  // always reflects the actual current view.
  return getResponsiveLayout().key;
}

function getLayoutStorageState() {
  try {
    const raw = localStorage.getItem(LAYOUT_LIBRARY_KEY);
    if (!raw) return { version: 1, layouts: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { version: 1, layouts: parsed };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.layouts)) {
      return { version: parsed.version ?? 1, layouts: parsed.layouts };
    }
    if (parsed && typeof parsed === 'object') {
      const ownerId = getCurrentUserId();
      const legacyLayouts = Object.entries(parsed)
        .filter(([, value]) => typeof value === 'string')
        .map(([name, value]) => {
          try {
            return {
              name,
              breakpointKey: 'desktop',
              scope: 'personal',
              ownerId,
              widgets: JSON.parse(value)
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (legacyLayouts.length > 0) {
        return { version: 1, layouts: legacyLayouts };
      }
    }
    return { version: 1, layouts: [] };
  } catch {
    return { version: 1, layouts: [] };
  }
}

function persistNamedLayouts(state) {
  localStorage.setItem(LAYOUT_LIBRARY_KEY, JSON.stringify(state));
}

function getEffectiveCustomLayoutAccess() {
  return 'either';
}

function getEffectiveCustomLayoutScope() {
  return layoutSharedEl?.checked ? 'shared' : 'personal';
}

function getLayoutRecordKey(record) {
  if (record.scope === 'shared') {
    return `${record.breakpointKey}::shared::${record.name}`;
  }

  return `${record.breakpointKey}::personal::${record.ownerId ?? getCurrentUserId()}::${record.name}`;
}

function canCurrentUserModifyRecord(record) {
  return record.ownerId === getCurrentUserId();
}

function isVisibleLayoutForCurrentUser(record) {
  const access = getEffectiveCustomLayoutAccess();
  const currentUserId = getCurrentUserId();

  if (access === 'personal') {
    return record.scope === 'personal' && record.ownerId === currentUserId;
  }

  if (access === 'shared') {
    return record.scope === 'shared';
  }

  return (record.scope === 'personal' && record.ownerId === currentUserId) || record.scope === 'shared';
}

function describeLayoutRecord(record) {
  const ownerLabel = record.scope === 'shared' ? ` · ${record.ownerId ?? 'shared'}` : '';
  return `${record.name} · ${record.breakpointKey} · ${record.scope}${ownerLabel}`;
}

function getVisibleLayoutRecords() {
  const state = getLayoutStorageState();
  const breakpointKey = getCurrentBreakpointKey();
  return state.layouts
    .filter((record) => record.breakpointKey === breakpointKey)
    .filter((record) => isVisibleLayoutForCurrentUser(record))
    .sort((a, b) => a.name.localeCompare(b.name) || a.scope.localeCompare(b.scope));
}

function getComparableWidgets(widgets) {
  return [...widgets]
    .map((widget) => ({
      id: widget.id,
      type: widget.type,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      locked: Boolean(widget.locked)
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
}

function getComparableCollapsibleAreas(areas = []) {
  return areas
    .map((area) => ({
      edge: area.edge,
      depth: area.depth,
      name: area.name,
      collapsed: Boolean(area.collapsed)
    }))
    .sort((a, b) => a.edge.localeCompare(b.edge) || a.depth - b.depth || a.name.localeCompare(b.name));
}

function getCurrentLayoutSnapshot() {
  return {
    widgets: dashboard.getWidgets(),
    collapsibleAreas
  };
}

function layoutsMatch(left, right) {
  return JSON.stringify(getComparableWidgets(left.widgets ?? left)) === JSON.stringify(getComparableWidgets(right.widgets ?? right))
    && JSON.stringify(getComparableCollapsibleAreas(left.collapsibleAreas)) === JSON.stringify(getComparableCollapsibleAreas(right.collapsibleAreas));
}

function recordMatchesCurrentState(record) {
  return record.scope === getEffectiveCustomLayoutScope() && layoutsMatch(record, getCurrentLayoutSnapshot());
}

function getActiveNamedLayoutRecord() {
  if (!activeNamedLayoutKey) return null;
  return getVisibleLayoutRecords().find((record) => getLayoutRecordKey(record) === activeNamedLayoutKey) ?? null;
}

function updateNamedLayoutState() {
  const visibleLayouts = getVisibleLayoutRecords();
  let selectedRecord = visibleLayouts.find((record) => getLayoutRecordKey(record) === activeNamedLayoutKey) ?? null;

  if (layoutSharedEl) {
    if (sharedScopeOverride !== null) {
      layoutSharedEl.checked = sharedScopeOverride;
    } else if (selectedRecord) {
      layoutSharedEl.checked = selectedRecord.scope === 'shared';
    }
  }

  const matchingRecord = visibleLayouts.find((record) => recordMatchesCurrentState(record)) ?? null;
  if (matchingRecord) {
    selectedRecord = matchingRecord;
    activeNamedLayoutKey = getLayoutRecordKey(matchingRecord);
    sharedScopeOverride = null;
    if (layoutSharedEl) {
      layoutSharedEl.checked = matchingRecord.scope === 'shared';
    }
  }

  if (layoutPickerEl) {
    layoutPickerEl.value = activeNamedLayoutKey && visibleLayouts.some((record) => getLayoutRecordKey(record) === activeNamedLayoutKey)
      ? activeNamedLayoutKey
      : '';
  }

  if (saveCurrentLayoutBtn) {
    saveCurrentLayoutBtn.disabled = !selectedRecord || !canCurrentUserModifyRecord(selectedRecord);
  }

  if (renameLayoutBtn) {
    renameLayoutBtn.disabled = !selectedRecord || !canCurrentUserModifyRecord(selectedRecord);
  }

  if (deleteLayoutBtn) {
    deleteLayoutBtn.disabled = !selectedRecord || !canCurrentUserModifyRecord(selectedRecord);
  }

  if (!layoutStatusEl) {
    return;
  }

  layoutStatusEl.classList.remove('is-saved', 'is-dirty');

  if (matchingRecord) {
    layoutStatusEl.textContent = `Saved: ${matchingRecord.name}`;
    layoutStatusEl.classList.add('is-saved');
    return;
  }

  if (selectedRecord) {
    layoutStatusEl.textContent = `Unsaved changes: ${selectedRecord.name}`;
    layoutStatusEl.classList.add('is-dirty');
    return;
  }

  layoutStatusEl.textContent = 'Not on a saved layout';
}

function reloadLayoutPicker() {
  if (!layoutPickerEl) return;

  const layouts = getVisibleLayoutRecords();

  layoutPickerEl.innerHTML = '<option value="">Saved layouts</option>' + layouts
    .map((record) => {
      const key = getLayoutRecordKey(record);
      const label = describeLayoutRecord(record);
      return `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`;
    })
    .join('');

  updateNamedLayoutState();
}

function saveCurrentNamedLayout(name) {
  if (!name) return;

  sharedScopeOverride = null;

  const state = getLayoutStorageState();
  const record = {
    name,
    breakpointKey: getCurrentBreakpointKey(),
    scope: getEffectiveCustomLayoutScope(),
    ownerId: getCurrentUserId(),
    ...getCurrentLayoutSnapshot()
  };

  const existing = state.layouts.find((item) => getLayoutRecordKey(item) === getLayoutRecordKey(record));
  if (existing && !canCurrentUserModifyRecord(existing)) {
    notify('You cannot overwrite another user\'s layout');
    return;
  }

  state.layouts = state.layouts.filter((item) => getLayoutRecordKey(item) !== getLayoutRecordKey(record));
  state.layouts.push(record);
  persistNamedLayouts(state);
  activeNamedLayoutKey = getLayoutRecordKey(record);
  reloadLayoutPicker();
  layoutPickerEl.value = getLayoutRecordKey(record);
  notify(`Saved layout “${name}” (${record.breakpointKey}, ${record.scope})`);
}

function saveSelectedNamedLayout() {
  if (!editMode) {
    notify('Enable edit mode to save a layout');
    return;
  }

  const record = getActiveNamedLayoutRecord();
  if (!record) {
    notify('Choose a saved layout first or use Save as');
    return;
  }

  if (!canCurrentUserModifyRecord(record)) {
    notify('You can only save your own layouts');
    return;
  }

  sharedScopeOverride = null;

  const updatedRecord = {
    ...record,
    scope: getEffectiveCustomLayoutScope(),
    ...getCurrentLayoutSnapshot()
  };
  const nextKey = getLayoutRecordKey(updatedRecord);
  const state = getLayoutStorageState();
  const conflict = state.layouts.find((item) => getLayoutRecordKey(item) === nextKey && getLayoutRecordKey(item) !== activeNamedLayoutKey);
  if (conflict && !canCurrentUserModifyRecord(conflict)) {
    notify('That layout name is already taken by another user');
    return;
  }

  state.layouts = state.layouts.filter((item) => getLayoutRecordKey(item) !== activeNamedLayoutKey && getLayoutRecordKey(item) !== nextKey);
  state.layouts.push(updatedRecord);
  persistNamedLayouts(state);
  activeNamedLayoutKey = nextKey;
  reloadLayoutPicker();
  notify(`Saved layout “${updatedRecord.name}”`);
}

function loadNamedLayout(recordKey) {
  const state = getLayoutStorageState();
  const saved = state.layouts.find((item) => getLayoutRecordKey(item) === recordKey);
  if (!saved) {
    notify('No such saved layout');
    return;
  }

  if (saved.breakpointKey !== getCurrentBreakpointKey()) {
    notify(`This layout is only available on ${saved.breakpointKey}`);
    return;
  }

  try {
    activeNamedLayoutKey = recordKey;
    sharedScopeOverride = null;
    dashboard.setLayout(saved.widgets);
    collapsibleAreas = Array.isArray(saved.collapsibleAreas)
      ? saved.collapsibleAreas.map((area) => ({ ...area, name: area.name || 'Collapsable area' }))
      : [];
    renderCollapsibleAreaList();
    updateCollapsibleAreaEditor();
    renderBoard();
    if (layoutSharedEl) {
      layoutSharedEl.checked = saved.scope === 'shared';
    }
    updateNamedLayoutState();
    notify(`Loaded layout “${saved.name}” (${saved.breakpointKey}, ${saved.scope})`);
  } catch {
    notify('Could not load saved layout');
  }
}

function renameSelectedLayout() {
  if (!editMode) {
    notify('Enable edit mode to rename a layout');
    return;
  }

  const selected = layoutPickerEl?.value;
  if (!selected) {
    notify('Choose a saved layout first');
    return;
  }

  const state = getLayoutStorageState();
  const record = state.layouts.find((item) => getLayoutRecordKey(item) === selected);
  if (!record) {
    notify('No such saved layout');
    return;
  }

  if (!canCurrentUserModifyRecord(record)) {
    notify('You can only rename your own layouts');
    return;
  }

  const nextName = window.prompt('Rename layout to:', record.name)?.trim();
  if (!nextName || nextName === record.name) return;

  const nextRecord = { ...record, name: nextName };
  const nextKey = getLayoutRecordKey(nextRecord);
  const conflict = state.layouts.find((item) => getLayoutRecordKey(item) === nextKey && item !== record);
  if (conflict && !canCurrentUserModifyRecord(conflict)) {
    notify('That layout name is already taken by another user');
    return;
  }

  record.name = nextName;
  persistNamedLayouts(state);
  activeNamedLayoutKey = nextKey;
  reloadLayoutPicker();
  layoutPickerEl.value = nextKey;
  notify(`Renamed layout to “${nextName}”`);
}

function deleteSelectedLayout() {
  if (!editMode) {
    notify('Enable edit mode to delete a layout');
    return;
  }

  const selected = layoutPickerEl?.value;
  if (!selected) {
    notify('Choose a saved layout first');
    return;
  }

  const state = getLayoutStorageState();
  const record = state.layouts.find((item) => getLayoutRecordKey(item) === selected);
  if (!record) {
    notify('No such saved layout');
    return;
  }

  if (!canCurrentUserModifyRecord(record)) {
    notify('You can only delete your own layouts');
    return;
  }

  const confirmed = window.confirm(`Delete layout “${record.name}”?`);
  if (!confirmed) return;

  state.layouts = state.layouts.filter((item) => getLayoutRecordKey(item) !== selected);
  persistNamedLayouts(state);
  activeNamedLayoutKey = '';
  reloadLayoutPicker();
  layoutPickerEl.value = '';
  notify(`Deleted layout “${record.name}”`);
}

function syncCustomLayoutControls() {
  reloadLayoutPicker();
}

function shouldRepackLockedWidgets(breakpointKey) {
  return breakpointKey === 'tablet' || breakpointKey === 'mobile';
}

function applyResponsiveColumnCount(targetColumns) {
  const { columns, rows } = dashboard.getDimensions();

  if (columns === targetColumns) {
    return;
  }

  try {
    dashboard.setDimensions({ columns: targetColumns, rows });
  } catch {
    // If row bounds block a narrow layout, prefer adapting columns so the
    // viewport still shifts to the expected responsive breakpoint.
    dashboard.setDimensions({ columns: targetColumns, rows: undefined });
  }
}

async function applySavedOrDerivedLayout(targetLayout, targetColumns) {
  const key = getLayoutStorageKey(targetLayout.key);
  const hasSaved = await dashboard.hasLayout(key);

  if (hasSaved) {
    await dashboard.restoreLayout(key);
    return;
  }

  if (targetLayout.key === 'desktop') {
    seedLayout();
    return;
  }

  const sourceWidgets = dashboard.getWidgets();
  if (sourceWidgets.length === 0) {
    return;
  }

  const derived = deriveLayoutForBreakpoint(
    sourceWidgets,
    targetLayout.key,
    dashboard.getWidgetTemplates(),
    targetColumns,
    { repackLocked: shouldRepackLockedWidgets(targetLayout.key) }
  );

  try {
    dashboard.setLayout(derived);
  } catch {
    // Derived layout exceeds row bounds — auto-reflow from setDimensions above
    // already produced a valid fallback, so nothing more to do.
  }
}

async function applyResponsiveColumns() {
  const targetLayout = getResponsiveLayout();
  const targetColumns = targetLayout.columns;

  applyResponsiveColumnCount(targetColumns);

  if (boardEl) {
    boardEl.style.gridTemplateColumns = `repeat(${targetColumns}, minmax(0, 1fr))`;
  }

  if (activeBreakpointKey !== targetLayout.key) {
    activeBreakpointKey = targetLayout.key;
    await applySavedOrDerivedLayout(targetLayout, targetColumns);
    reloadLayoutPicker();
    return;
  }

  updateNamedLayoutState();
}

function scheduleResponsiveColumns() {
  if (responsiveApplyTimer) {
    clearTimeout(responsiveApplyTimer);
  }

  responsiveApplyTimer = setTimeout(() => {
    void applyResponsiveColumns();
  }, 120);
}

function nearestValid(value, sorted) {
  if (!sorted.length) return null;
  return sorted.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

function startResize(cardEl, event, direction) {
  if (!editMode) return;

  const id = cardEl.getAttribute('data-id');
  if (!id) return;

  const widget = getWidgetById(id);
  if (!widget) return;
  if (widget.locked) return;

  event.stopPropagation();
  event.preventDefault();

  const validSizes = dashboard.getValidSizesForType(widget.type);
  const metrics = getBoardMetrics();
  const size = widgetPixelSize(widget, metrics);
  const boardLeft = metrics.boardRect.left + widget.x * (metrics.columnWidth + metrics.gap);
  const boardTop = metrics.boardRect.top + widget.y * (metrics.rowHeight + metrics.gap);

  const previewEl = document.createElement('div');
  previewEl.classList.add('resize-preview');
  previewEl.style.left = `${boardLeft}px`;
  previewEl.style.top = `${boardTop}px`;
  previewEl.style.width = `${size.width}px`;
  previewEl.style.height = `${size.height}px`;
  document.body.appendChild(previewEl);

  cardEl.classList.add('dragging');
  document.body.classList.add('is-resizing');

  resizeState = {
    id,
    widget,
    widgets: dashboard.getWidgets().map((item) => ({ ...item })),
    direction,
    sourceEl: cardEl,
    previewEl,
    pointerId: event.pointerId,
    currentW: widget.w,
    currentH: widget.h,
    currentX: widget.x,
    currentY: widget.y,
    validSizes,
    metrics,
    boardLeft,
    boardTop,
    originalRight: widget.x + widget.w,
    originalBottom: widget.y + widget.h
  };

  cardEl.setPointerCapture(event.pointerId);
}

function updateResizePreview(clientX, clientY) {
  if (!resizeState) return;

  const { widget, direction, validSizes, metrics, boardLeft, boardTop, originalRight, originalBottom } = resizeState;

  let newW = widget.w;
  let newH = widget.h;
  let newX = widget.x;
  let newY = widget.y;

  if (direction === 'e') {
    // Right edge: left position fixed, width grows toward cursor
    const rawW = Math.max(1, Math.round((clientX - boardLeft + metrics.gap / 2) / (metrics.columnWidth + metrics.gap)));
    const validWidths = validSizes.filter((s) => s.h === widget.h).map((s) => s.w);
    newW = nearestValid(rawW, validWidths) ?? widget.w;
  }

  if (direction === 's') {
    // Bottom edge: top position fixed, height grows toward cursor
    const rawH = Math.max(1, Math.round((clientY - boardTop + metrics.gap / 2) / (metrics.rowHeight + metrics.gap)));
    const validHeights = validSizes.filter((s) => s.w === widget.w).map((s) => s.h);
    newH = nearestValid(rawH, validHeights) ?? widget.h;
  }

  if (direction === 'w') {
    // Left edge: right boundary fixed, width grows toward cursor (x shifts left)
    const rawX = Math.round((clientX - metrics.boardRect.left) / (metrics.columnWidth + metrics.gap));
    const rawW = Math.max(1, originalRight - rawX);
    const validWidths = validSizes.filter((s) => s.h === widget.h).map((s) => s.w);
    newW = nearestValid(rawW, validWidths) ?? widget.w;
    newX = Math.max(0, originalRight - newW);
  }

  if (direction === 'n') {
    // Top edge: bottom boundary fixed, height grows toward cursor (y shifts up)
    const rawY = Math.round((clientY - metrics.boardRect.top) / (metrics.rowHeight + metrics.gap));
    const rawH = Math.max(1, originalBottom - rawY);
    const validHeights = validSizes.filter((s) => s.w === widget.w).map((s) => s.h);
    newH = nearestValid(rawH, validHeights) ?? widget.h;
    newY = Math.max(0, originalBottom - newH);
  }

  resizeState.currentW = newW;
  resizeState.currentH = newH;
  resizeState.currentX = newX;
  resizeState.currentY = newY;

  const rect = { x: newX, y: newY, w: newW, h: newH };
  const result = resolveResize(widget, rect, resizeState.widgets, {
    ...dashboard.getDimensions()
  });
  const resolved = result.success ? new Map(result.widgets.map((item) => [item.id, item])) : null;
  for (const original of resizeState.widgets) {
    if (original.id === widget.id) continue;
    const card = queryWidgetCardById(original.id);
    if (!card) continue;

    const preview = resolved?.get(original.id) ?? original;
    card.style.gridColumn = `${preview.x + 1} / span ${preview.w}`;
    card.style.gridRow = `${preview.y + 1} / span ${preview.h}`;
    card.classList.toggle('resize-yield-preview', Boolean(resolved) && (
      preview.x !== original.x || preview.y !== original.y ||
      preview.w !== original.w || preview.h !== original.h
    ));
  }

  const blocked = !result.success;
  resizeState.sourceEl.classList.toggle('resize-blocked', blocked);
  resizeState.previewEl.classList.toggle('resize-blocked', blocked);

  const previewWidth = newW * metrics.columnWidth + Math.max(0, newW - 1) * metrics.gap;
  const previewHeight = newH * metrics.rowHeight + Math.max(0, newH - 1) * metrics.gap;
  const previewLeft = metrics.boardRect.left + newX * (metrics.columnWidth + metrics.gap);
  const previewTop = metrics.boardRect.top + newY * (metrics.rowHeight + metrics.gap);
  resizeState.previewEl.style.left = `${previewLeft}px`;
  resizeState.previewEl.style.top = `${previewTop}px`;
  resizeState.previewEl.style.width = `${previewWidth}px`;
  resizeState.previewEl.style.height = `${previewHeight}px`;
}

function endResize() {
  if (!resizeState) return;

  resizeState.previewEl.remove();
  resizeState.sourceEl.classList.remove('dragging', 'resize-blocked');
  document.body.classList.remove('is-resizing');

  const { id, widget, currentW, currentH, currentX, currentY } = resizeState;
  resizeState = null;

  const changed = currentW !== widget.w || currentH !== widget.h || currentX !== widget.x || currentY !== widget.y;
  if (changed) {
    try {
      const result = dashboard.resizeWidget(id, { x: currentX, y: currentY, w: currentW, h: currentH });
      if (!result.success) {
        notify('Cannot resize here');
        renderBoard();
        return;
      }
      setSelected(id);
    } catch {
      notify('Cannot resize here');
      renderBoard();
    }
  }
}

function getBoardMetrics() {
  if (!boardEl) {
    return {
      columns: 12,
      columnWidth: 1,
      rowHeight: 74,
      gap: 12,
      boardRect: new DOMRect()
    };
  }

  const styles = window.getComputedStyle(boardEl);
  const columns = styles.gridTemplateColumns.split(' ').filter(Boolean).length || 12;
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '12') || 12;
  const rowHeight = Number.parseFloat(styles.gridAutoRows || '74') || 74;
  const boardRect = boardEl.getBoundingClientRect();
  const columnWidth = (boardRect.width - gap * (columns - 1)) / columns;

  return { columns, columnWidth, rowHeight, gap, boardRect };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function snapPosition(widget, clientX, clientY, dragOffsetX, dragOffsetY) {
  const metrics = getBoardMetrics();
  const x = Math.round((clientX - metrics.boardRect.left - dragOffsetX) / (metrics.columnWidth + metrics.gap));
  const y = Math.round((clientY - metrics.boardRect.top - dragOffsetY) / (metrics.rowHeight + metrics.gap));

  return {
    x: clamp(x, 0, Math.max(0, metrics.columns - widget.w)),
    y: Math.max(0, y),
    metrics
  };
}

function widgetPixelSize(widget, metrics) {
  return {
    width: widget.w * metrics.columnWidth + Math.max(0, widget.w - 1) * metrics.gap,
    height: widget.h * metrics.rowHeight + Math.max(0, widget.h - 1) * metrics.gap
  };
}

function updateSwapLogoSize(metrics) {
  const oneByOne = Math.min(metrics.columnWidth, metrics.rowHeight);
  const size = Math.max(28, Math.round(oneByOne * 0.8));
  document.body.style.setProperty('--swap-logo-size', `${size}px`);
}

function sameIds(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function updateDragPreview(clientX, clientY) {
  if (!dragState?.previewEl || !dragState.widget) return;

  const { x, y, metrics } = snapPosition(
    dragState.widget,
    clientX,
    clientY,
    dragState.dragOffsetX,
    dragState.dragOffsetY
  );

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }

  if (dragState.currentX === x && dragState.currentY === y) {
    return;
  }

  const size = widgetPixelSize(dragState.widget, metrics);
  const left = metrics.boardRect.left + x * (metrics.columnWidth + metrics.gap);
  const top = metrics.boardRect.top + y * (metrics.rowHeight + metrics.gap);

  dragState.currentX = x;
  dragState.currentY = y;
  dragState.previewEl.style.left = `${left}px`;
  dragState.previewEl.style.top = `${top}px`;
  dragState.previewEl.style.width = `${size.width}px`;
  dragState.previewEl.style.height = `${size.height}px`;
  updateSwapLogoSize(metrics);

  updateDragHoverState(dragState.widget, x, y);
}

function collides(a, b) {
  if (a.id === b.id) return false;
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function updateDragHoverState(sourceWidget, x, y) {
  if (!dragState) return;

  const probe = { ...sourceWidget, x, y };
  const overlaps = (dragState.otherWidgets ?? dashboard
    .getWidgets()
    .filter((widget) => widget.id !== sourceWidget.id))
    .filter((widget) => collides(probe, widget));

  const nextSwapTargetIds = [];
  const nextIncompatibleTargetIds = [];

  if (
    overlaps.length === 1
    && !overlaps[0].locked
    && overlaps[0].w === sourceWidget.w
    && overlaps[0].h === sourceWidget.h
  ) {
    nextSwapTargetIds.push(overlaps[0].id);
  } else if (overlaps.length > 0) {
    nextIncompatibleTargetIds.push(...overlaps.map((widget) => widget.id));
  }

  nextSwapTargetIds.sort();
  nextIncompatibleTargetIds.sort();

  if (
    sameIds(nextSwapTargetIds, dragState.swapTargetIds ?? [])
    && sameIds(nextIncompatibleTargetIds, dragState.incompatibleTargetIds ?? [])
  ) {
    return;
  }

  dragState.swapTargetIds = nextSwapTargetIds;
  dragState.incompatibleTargetIds = nextIncompatibleTargetIds;

  applyDragHoverIndicators();
}

function applyDragHoverIndicators() {
  if (!boardEl) return;

  const nextSwapTargetIds = (dragState?.swapTargetIds ?? []).slice().sort();
  const nextIncompatibleTargetIds = (dragState?.incompatibleTargetIds ?? []).slice().sort();

  if (
    sameIds(nextSwapTargetIds, hoverIndicatorState.swapTargetIds)
    && sameIds(nextIncompatibleTargetIds, hoverIndicatorState.incompatibleTargetIds)
  ) {
    document.body.classList.toggle('is-swap-ready', nextSwapTargetIds.length > 0);
    return;
  }

  for (const id of hoverIndicatorState.swapTargetIds) {
    if (!nextSwapTargetIds.includes(id)) {
      const card = queryWidgetCardById(id);
      card?.classList.remove('swap-target');
    }
  }

  for (const id of hoverIndicatorState.incompatibleTargetIds) {
    if (!nextIncompatibleTargetIds.includes(id)) {
      const card = queryWidgetCardById(id);
      card?.classList.remove('swap-incompatible');
    }
  }

  for (const id of nextSwapTargetIds) {
    if (!hoverIndicatorState.swapTargetIds.includes(id)) {
      const card = queryWidgetCardById(id);
      card?.classList.add('swap-target');
    }
  }

  for (const id of nextIncompatibleTargetIds) {
    if (!hoverIndicatorState.incompatibleTargetIds.includes(id)) {
      const card = queryWidgetCardById(id);
      card?.classList.add('swap-incompatible');
    }
  }

  hoverIndicatorState = {
    swapTargetIds: nextSwapTargetIds,
    incompatibleTargetIds: nextIncompatibleTargetIds
  };

  document.body.classList.toggle('is-swap-ready', nextSwapTargetIds.length > 0);
}

function endDrag() {
  if (!dragState) return;

  const finalizedDragState = dragState;
  const widget = getWidgetById(dragState.widget.id);
  cleanupDragArtifacts();

  if (widget && Number.isFinite(finalizedDragState.currentX) && Number.isFinite(finalizedDragState.currentY)) {
    const probe = { ...widget, x: finalizedDragState.currentX, y: finalizedDragState.currentY };
    const overlaps = (finalizedDragState.otherWidgets ?? dashboard
      .getWidgets()
      .filter((item) => item.id !== widget.id))
      .filter((item) => collides(probe, item));
    const isLockedSwapShape = overlaps.length === 1
      && overlaps[0].locked
      && overlaps[0].w === widget.w
      && overlaps[0].h === widget.h;

    if (isLockedSwapShape && dashboard.isSwapEnabled()) {
      dashboard.setSwapEnabled(false);
      try {
        dashboard.moveWidget(widget.id, finalizedDragState.currentX, finalizedDragState.currentY);
      } finally {
        dashboard.setSwapEnabled(true);
      }
    } else {
      dashboard.moveWidget(widget.id, finalizedDragState.currentX, finalizedDragState.currentY);
    }

    setSelected(widget.id);
  }

  dragState = null;
  applyDragHoverIndicators();
}

function startDrag(cardEl, event) {
  if (!editMode) return;

  const id = cardEl.getAttribute('data-id');
  if (!id) return;

  const widget = getWidgetById(id);
  if (!widget) return;
  if (widget.locked) return;

  const rect = cardEl.getBoundingClientRect();
  const previewEl = cardEl.cloneNode(true);
  previewEl.classList.add('drag-preview', 'ghost');
  previewEl.classList.remove('selected');
  previewEl.removeAttribute('data-id');
  previewEl.querySelectorAll('[data-remove]').forEach((button) => button.remove());

  document.body.appendChild(previewEl);
  cardEl.classList.add('dragging');
  cardEl.classList.add('drag-origin-ghost');
  document.body.classList.add('is-dragging');

  dragState = {
    id,
    widget,
    sourceEl: cardEl,
    previewEl,
    otherWidgets: dashboard.getWidgets().filter((item) => item.id !== id),
    pointerId: event.pointerId,
    dragOffsetX: event.clientX - rect.left,
    dragOffsetY: event.clientY - rect.top,
    currentX: Number.NaN,
    currentY: Number.NaN,
    swapTargetIds: [],
    incompatibleTargetIds: []
  };

  updateDragPreview(event.clientX, event.clientY);
  cardEl.setPointerCapture(event.pointerId);
}

const KPI_PRESETS = [
  { label: 'Active users', value: '12.4k', delta: 4.2 },
  { label: 'Conversion', value: '3.8%', delta: 0.9 },
  { label: 'Avg. order', value: '$74.20', delta: -1.4 },
  { label: 'MRR', value: '$128k', delta: 6.1 },
  { label: 'Churn', value: '1.7%', delta: -0.5 }
];

const GRAPH_PRESETS = [
  {
    title: 'Revenue trend',
    delta: '+12.4%',
    points: [28, 34, 31, 46, 52, 49, 58],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    title: 'Orders trend',
    delta: '+6.8%',
    points: [16, 24, 22, 26, 33, 29, 37],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    title: 'Sessions trend',
    delta: '-2.1%',
    points: [44, 41, 39, 36, 40, 38, 35],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }
];

const LIST_PRESETS = [
  {
    title: 'Today',
    items: [
      { label: 'Review partner leads', status: 'In progress', tone: 'warn' },
      { label: 'Ship KPI export', status: 'Done', tone: 'ok' },
      { label: 'Finalize Q3 goals', status: 'Blocked', tone: 'bad' }
    ]
  },
  {
    title: 'Backlog',
    items: [
      { label: 'Design retention report', status: 'Open', tone: 'warn' },
      { label: 'Migrate auth hooks', status: 'Open', tone: 'warn' },
      { label: 'Clean stale accounts', status: 'Done', tone: 'ok' }
    ]
  }
];

function hashKey(value) {
  let acc = 0;
  for (let i = 0; i < value.length; i += 1) {
    acc = (acc * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return acc;
}

function pickByWidget(widget, list) {
  return list[hashKey(`${widget.id}:${widget.type}:${widget.w}x${widget.h}`) % list.length];
}

function kpiSparkBars(seed) {
  const bars = [];
  for (let i = 0; i < 9; i += 1) {
    const height = 28 + ((seed + i * 17) % 56);
    bars.push(`<span class="kpi-bar" style="height:${height}%"></span>`);
  }
  return bars.join('');
}

function graphPolyline(points) {
  const w = 240;
  const h = 90;
  const pad = 8;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const step = (w - pad * 2) / Math.max(1, points.length - 1);
  const coords = points
    .map((point, i) => {
      const x = pad + i * step;
      const y = h - pad - ((point - min) / span) * (h - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return coords;
}

function widgetMarkup(widget) {
  if (widget.type === 'kpi') {
    const metric = pickByWidget(widget, KPI_PRESETS) ?? {};
    const label = metric.label ?? 'Metric';
    const value = metric.value ?? '0';
    const trendText = typeof metric.trend === 'string'
      ? metric.trend
      : `${Number(metric.delta ?? 0) >= 0 ? '+' : ''}${Number(metric.delta ?? 0).toFixed(1)}%`;
    const period = metric.period ?? 'vs previous period';
    const trendClass = String(trendText).startsWith('-') ? 'down' : 'up';
    const seed = hashKey(`${widget.id}:${label}`);
    return `<div class="widget-kpi">
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="kpi-value">${escapeHtml(value)}</div>
      <div class="kpi-foot">
        <span class="kpi-trend ${trendClass}">${escapeHtml(trendText)}</span>
        <span class="kpi-period">${escapeHtml(period)}</span>
      </div>
      <div class="kpi-spark">${kpiSparkBars(seed)}</div>
    </div>`;
  }

  if (widget.type === 'graph') {
    const series = pickByWidget(widget, GRAPH_PRESETS);
    const deltaClass = series.delta.startsWith('-') ? 'down' : 'up';
    return `<div class="widget-graph">
      <div class="graph-head">
        <span class="graph-title">${escapeHtml(series.title)}</span>
        <span class="graph-delta ${deltaClass}">${escapeHtml(series.delta)}</span>
      </div>
      <svg class="graph-chart" viewBox="0 0 240 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <polyline class="graph-line" points="${graphPolyline(series.points)}"></polyline>
      </svg>
      <div class="graph-axis">${series.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('')}</div>
    </div>`;
  }

  if (widget.type === 'list') {
    const list = pickByWidget(widget, LIST_PRESETS);
    const rows = list.items
      .map((item) => {
        const tone = sanitizeToken(item.tone, 'warn');
        return `<li class="checklist-row">
          <span class="checklist-label">${escapeHtml(item.label)}</span>
          <span class="checklist-state ${tone}">${escapeHtml(item.status)}</span>
        </li>`;
      })
      .join('');
    return `<div class="widget-checklist">
      <div class="checklist-head">
        <span class="checklist-title">${escapeHtml(list.title)}</span>
        <span class="checklist-count">${list.items.length} items</span>
      </div>
      <ul class="checklist-items">${rows}</ul>
    </div>`;
  }

  if (widget.type === 'clock') {
    return '<div class="widget-dice"><div class="dice-grid"><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span></div></div>';
  }

  return `<div>${escapeHtml(widget.type)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCollapsibleAreaName(name, edge, collapsed) {
  const safeName = escapeHtml(name);
  if (!collapsed || edge === 'top') return safeName;
  return [...String(name)].map((character) => `<span>${escapeHtml(character)}</span>`).join('');
}

function sanitizeToken(value, fallback = 'default') {
  const token = String(value).trim().toLowerCase();
  return /^[a-z0-9_-]+$/.test(token) ? token : fallback;
}

function queryWidgetCardById(id) {
  if (!boardEl || !id) return null;
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return boardEl.querySelector(`[data-id="${CSS.escape(id)}"]`);
  }
  return boardEl.querySelector(`[data-id="${escapeHtml(id)}"]`);
}

function isInteractiveTarget(value) {
  if (!(value instanceof Element)) return false;
  return Boolean(value.closest('input, textarea, select, button, [contenteditable="true"]'));
}

function getBoardRowCount() {
  const dimensions = dashboard.getDimensions();
  if (dimensions.rows) return dimensions.rows;
  return Math.max(1, ...dashboard.getWidgets().map((widget) => widget.y + widget.h));
}

function getValidCollapsibleDepths(edge) {
  const { columns } = dashboard.getDimensions();
  const limit = edge === 'top' ? getBoardRowCount() : columns;
  const depths = [];
  const widgets = dashboard.getWidgets();

  for (let depth = 1; depth < limit; depth += 1) {
    const boundary = edge === 'right' ? columns - depth : depth;
    const crossesBoundary = widgets.some((widget) => {
      const start = edge === 'top' ? widget.y : widget.x;
      const end = start + (edge === 'top' ? widget.h : widget.w);
      return start < boundary && end > boundary;
    });

    if (!crossesBoundary) depths.push(depth);
  }

  return depths;
}

function isWidgetInsideCollapsibleArea(widget, area) {
  if (area.edge === 'left') return widget.x + widget.w <= area.depth;
  if (area.edge === 'right') return widget.x >= dashboard.getDimensions().columns - area.depth;
  return widget.y + widget.h <= area.depth;
}

function getCollapsedWidget(widget, area) {
  if (!area || !area.collapsed) return widget;
  if (area.edge === 'left') return { ...widget, x: widget.x - area.depth };
  if (area.edge === 'top') return { ...widget, y: widget.y - area.depth };
  return widget;
}

function getAreaGridStyle(area, columns, rows) {
  if (area.collapsed) return '';

  if (area.edge === 'left') return `grid-column:1 / span ${area.depth}; grid-row:1 / span ${rows};`;
  if (area.edge === 'right') return `grid-column:${columns - area.depth + 1} / span ${area.depth}; grid-row:1 / span ${rows};`;
  return `grid-column:1 / span ${columns}; grid-row:1 / span ${area.depth};`;
}

function getCollapsibleAreaStyle(area, metrics, columns) {
  const boardWidth = metrics.boardRect.width;
  const boardHeight = metrics.boardRect.height;
  const edgeInset = 14;
  const collapsedBarSize = 24;
  if (area.collapsed) {
    if (area.edge === 'left') return `left:${edgeInset}px; top:${edgeInset}px; width:${collapsedBarSize}px; height:${Math.max(collapsedBarSize, boardHeight - edgeInset * 2)}px;`;
    if (area.edge === 'right') return `right:${edgeInset}px; top:${edgeInset}px; width:${collapsedBarSize}px; height:${Math.max(collapsedBarSize, boardHeight - edgeInset * 2)}px;`;
    return `left:${edgeInset}px; top:${edgeInset}px; width:${Math.max(collapsedBarSize, boardWidth - edgeInset * 2)}px; height:${collapsedBarSize}px;`;
  }

  const boundary = area.edge === 'right' ? columns - area.depth : area.depth;
  const boundaryOffset = area.edge === 'top'
    ? boundary * metrics.rowHeight + (boundary - 0.5) * metrics.gap
    : boundary * metrics.columnWidth + (boundary - 0.5) * metrics.gap;

  if (area.edge === 'top') return `left:0; top:${boundaryOffset - 6}px; width:${boardWidth}px; height:12px;`;
  if (area.edge === 'left') return `left:${boundaryOffset - 6}px; top:0; width:12px; height:${boardHeight}px;`;
  return `left:${boundaryOffset - 6}px; top:0; width:12px; height:${boardHeight}px;`;
}

function renderCollapsibleAreaList() {
  if (!collapsibleAreaListEl) return;

  collapsibleAreaListEl.innerHTML = collapsibleAreas.length === 0
    ? '<span>No collapsable areas yet.</span>'
    : collapsibleAreas.map((area) => `<div class="collapsible-area-row">
        <span>${escapeHtml(area.name)} · ${area.edge} · ${area.depth} ${area.edge === 'top' ? 'row(s)' : 'column(s)'}</span>
        <button class="btn ghost" data-remove-area="${escapeHtml(area.id)}">Remove</button>
      </div>`).join('');

  for (const button of collapsibleAreaListEl.querySelectorAll('[data-remove-area]')) {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-remove-area');
      collapsibleAreas = collapsibleAreas.filter((area) => area.id !== id);
      renderBoard();
      renderCollapsibleAreaList();
      updateNamedLayoutState();
    });
  }
}

function updateCollapsibleAreaEditor() {
  const draft = collapsibleAreaDraft;
  if (collapseEdgeOptionsEl) collapseEdgeOptionsEl.hidden = !draft;
  for (const button of collapseEdgeButtons) {
    button.classList.toggle('is-selected', button.getAttribute('data-collapse-edge') === draft?.edge);
  }

  if (addCollapsibleAreaBtn) addCollapsibleAreaBtn.disabled = Boolean(draft) || collapsibleAreas.length > 0;
  if (confirmCollapsibleAreaBtn) confirmCollapsibleAreaBtn.disabled = !draft;
  if (cancelCollapsibleAreaBtn) cancelCollapsibleAreaBtn.hidden = !draft;
}

function startCollapsibleAreaPlacement(edge) {
  if (!editMode || collapsibleAreas.length > 0) return;

  const depths = getValidCollapsibleDepths(edge);
  if (depths.length === 0) {
    notify('No edge boundary is clear of widget lines');
    return;
  }

  collapsibleAreaDraft = { edge, depth: depths[0], name: collapsibleAreaNameEl?.value.trim() ?? '' };
  updateCollapsibleAreaEditor();
  renderBoard();
  notify('Drag the ghost edge, then confirm placement');
}

function startCollapsibleAreaResize(event) {
  if (!collapsibleAreaDraft) return;
  event.preventDefault();
  event.stopPropagation();
  collapsibleAreaResizeState = { pointerId: event.pointerId };
  document.body.classList.add('is-resizing');
  boardEl?.setPointerCapture?.(event.pointerId);
}

function updateCollapsibleAreaPreview(clientX, clientY) {
  if (!collapsibleAreaDraft || !collapsibleAreaResizeState) return;

  const metrics = getBoardMetrics();
  const { columns } = dashboard.getDimensions();
  const maxDepth = collapsibleAreaDraft.edge === 'top' ? getBoardRowCount() - 1 : columns - 1;
  const step = collapsibleAreaDraft.edge === 'top'
    ? metrics.rowHeight + metrics.gap
    : metrics.columnWidth + metrics.gap;
  let rawDepth;

  if (collapsibleAreaDraft.edge === 'left') rawDepth = Math.round((clientX - metrics.boardRect.left) / step);
  else if (collapsibleAreaDraft.edge === 'right') rawDepth = Math.round((metrics.boardRect.right - clientX) / step);
  else rawDepth = Math.round((clientY - metrics.boardRect.top) / step);

  const validDepths = getValidCollapsibleDepths(collapsibleAreaDraft.edge);
  const boundedDepth = clamp(rawDepth, 1, Math.max(1, maxDepth));
  collapsibleAreaDraft.depth = nearestValid(boundedDepth, validDepths) ?? collapsibleAreaDraft.depth;
  renderBoard();
}

function endCollapsibleAreaResize() {
  if (!collapsibleAreaResizeState) return;
  collapsibleAreaResizeState = null;
  document.body.classList.remove('is-resizing');
}

function confirmCollapsibleArea() {
  if (!collapsibleAreaDraft) return;
  const { edge, depth } = collapsibleAreaDraft;
  if (!getValidCollapsibleDepths(edge).includes(depth)) {
    notify('The area boundary must follow widget lines');
    return;
  }

  const name = collapsibleAreaNameEl?.value.trim() || 'Collapsable area';
  collapsibleAreas = [{ id: `collapse-${Date.now()}`, edge, depth, name, collapsed: false }];
  collapsibleAreaDraft = null;
  updateCollapsibleAreaEditor();
  renderCollapsibleAreaList();
  renderBoard();
  notify('Collapsable area placed');
}

function cancelCollapsibleArea() {
  collapsibleAreaDraft = null;
  endCollapsibleAreaResize();
  updateCollapsibleAreaEditor();
  renderBoard();
}

function applyKeyboardMove(id, dx, dy) {
  const widget = getWidgetById(id);
  if (!widget) return;
  if (widget.locked) { notify('Widget is locked'); return; }

  try {
    dashboard.moveWidget(widget.id, widget.x + dx, widget.y + dy);
  } catch {
    notify('Unable to move widget');
  }
}

function renderBoard() {
  if (!boardEl) return;

  const { columns } = dashboard.getDimensions();
  const rows = getBoardRowCount();
  const area = collapsibleAreas[0] ?? null;
  const collapsedArea = area?.collapsed ? area : null;
  const renderedColumns = collapsedArea?.edge === 'left' || collapsedArea?.edge === 'right'
    ? columns - collapsedArea.depth
    : columns;
  const renderedRows = collapsedArea?.edge === 'top' ? rows - collapsedArea.depth : rows;
  boardEl.style.gridTemplateColumns = `repeat(${Math.max(1, renderedColumns)}, minmax(0, 1fr))`;
  boardEl.style.gridTemplateRows = collapsedArea?.edge === 'top'
    ? `repeat(${Math.max(1, renderedRows)}, 74px)`
    : '';
  boardEl.classList.toggle('has-collapsed-area', Boolean(collapsedArea));
  boardEl.classList.toggle('has-collapsed-side-left', collapsedArea?.edge === 'left');
  boardEl.classList.toggle('has-collapsed-side-right', collapsedArea?.edge === 'right');

  const widgets = dashboard.getWidgets()
    .filter((widget) => !collapsedArea || !isWidgetInsideCollapsibleArea(widget, collapsedArea))
    .map((widget) => getCollapsedWidget(widget, collapsedArea));
  const widgetMarkupHtml = widgets
    .map((widget) => {
      const selectedClass = widget.id === selectedId ? ' selected' : '';
      const lockedClass = widget.locked ? ' locked' : '';
      const lockedAttr = widget.locked ? ' data-locked="true"' : '';
      const style = `grid-column:${widget.x + 1} / span ${widget.w}; grid-row:${widget.y + 1} / span ${widget.h};`;
      const safeTitle = escapeHtml(widget.type.toUpperCase());
      const safeId = escapeHtml(widget.id);
      const canEdit = editMode && !widget.locked;
      return `<article class="widget${selectedClass}${lockedClass}" data-id="${safeId}"${lockedAttr} style="${style}" title="${safeTitle}" tabindex="${editMode ? '0' : '-1'}" role="group" aria-label="${safeTitle} widget ${safeId}${widget.locked ? ' (locked)' : ''}">
        ${canEdit ? `<button class="remove" data-remove="${safeId}" aria-label="Remove widget">x</button>` : ''}
        ${widgetMarkup(widget)}
        ${canEdit ? `<button type="button" class="resize-handle resize-n" data-resize="${safeId}" data-dir="n" aria-label="Resize ${safeTitle} widget north"></button>` : ''}
        ${canEdit ? `<button type="button" class="resize-handle resize-e" data-resize="${safeId}" data-dir="e" aria-label="Resize ${safeTitle} widget east"></button>` : ''}
        ${canEdit ? `<button type="button" class="resize-handle resize-s" data-resize="${safeId}" data-dir="s" aria-label="Resize ${safeTitle} widget south"></button>` : ''}
        ${canEdit ? `<button type="button" class="resize-handle resize-w" data-resize="${safeId}" data-dir="w" aria-label="Resize ${safeTitle} widget west"></button>` : ''}
      </article>`;
    })
    .join('');

  const draft = collapsibleAreaDraft;
  const ghostMarkup = draft
    ? `<div class="collapsible-ghost edge-${draft.edge}" style="${getAreaGridStyle(draft, columns, rows)}" aria-label="Collapsable area placement preview">
        <span class="collapsible-area-label">Place ${draft.edge} area · ${draft.depth}</span>
        <button class="collapsible-area-handle" data-collapse-resize aria-label="Resize collapsable area"></button>
      </div>`
    : '';
  const areaMarkup = area
    ? `<button class="collapsible-area edge-${area.edge}${area.collapsed ? ' is-collapsed' : ''}" data-area-id="${escapeHtml(area.id)}" style="${getCollapsibleAreaStyle(area, getBoardMetrics(), columns)}" type="button" aria-label="${area.collapsed ? 'Expand' : 'Collapse'} ${escapeHtml(area.name)}">
        <span class="collapsible-area-name">${area.collapsed ? formatCollapsibleAreaName(area.name, area.edge, area.collapsed) : ''}</span>
      </button>`
    : '';

  boardEl.innerHTML = widgetMarkupHtml + areaMarkup + ghostMarkup;
}

function openWizardStep1() {
  if (!wizardStep1El || !wizardStep2El || !panelTitleEl) return;

  panelTitleEl.textContent = 'Add widget — choose type';
  wizardStep1El.classList.remove('hidden');
  wizardStep2El.classList.add('hidden');
  renderWizardStep1();
}

function openWizardStep2(type) {
  if (!wizardStep1El || !wizardStep2El || !panelTitleEl || !wizardSizeHintEl) return;

  panelTitleEl.textContent = `Add widget — choose size`;
  wizardSizeHintEl.textContent = `Pick a size for ${type} on ${activeBreakpointKey ?? 'this breakpoint'}.`;
  wizardStep1El.classList.add('hidden');
  wizardStep2El.classList.remove('hidden');
  renderWizardStep2(type);
}

function renderWizardStep1() {
  if (!widgetTypeListEl) return;

  const types = dashboard.getWidgetTypes();

  widgetTypeListEl.innerHTML = types
    .map(
      (type) => `<button class="widget-row" data-type="${escapeHtml(type)}">
        <span>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</span>
        <span class="widget-size">&#8250;</span>
      </button>`
    )
    .join('');

  for (const button of widgetTypeListEl.querySelectorAll('[data-type]')) {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-type');
      if (type) openWizardStep2(type);
    });
  }
}

function renderWizardStep2(type) {
  if (!widgetSizeListEl) return;

  const breakpointKey = activeBreakpointKey ?? getResponsiveLayout().key;
  const sizes = dashboard.getValidSizesForTypeAtBreakpoint(type, breakpointKey);

  widgetSizeListEl.innerHTML = sizes
    .map(
      (size) => `<button class="widget-row" data-type="${escapeHtml(type)}" data-w="${size.w}" data-h="${size.h}">
        <span>${size.w} &times; ${size.h}</span>
      </button>`
    )
    .join('');

  for (const button of widgetSizeListEl.querySelectorAll('[data-w]')) {
    button.addEventListener('click', () => {
      const t = button.getAttribute('data-type');
      const w = Number(button.getAttribute('data-w'));
      const h = Number(button.getAttribute('data-h'));
      if (!t) return;
      addWidgetByTypeAndSize(t, w, h);
      panelEl?.classList.add('hidden');
    });
  }
}

function addWidgetByTypeAndSize(type, w, h) {
  if (!editMode) return;

  // Find a template whose type matches; we only need any template as the size
  // is supplied explicitly.
  const templates = dashboard.getWidgetTemplates().filter((t) => t.type === type);
  const template = templates.find((t) => t.w === w && t.h === h) ?? templates[0];
  if (!template) return;

  const id = `${type}-${Date.now()}`;
  try {
    const added = dashboard.addWidget({ id, type, x: 0, y: 0, w, h });
    setSelected(added.id);
    notify(`Added ${type} ${w}\xd7${h}`);
  } catch {
    notify('No space left on the board');
  }
}

function seedLayout() {
  // Only remove unlocked widgets; locked ones are permanent fixtures.
  for (const widget of dashboard.getWidgets()) {
    if (!widget.locked) {
      dashboard.removeWidget(widget.id);
    }
  }

  const initial = [
    { templateId: 'kpi-2x2', x: 0, y: 0 },
    { templateId: 'graph-2x2', x: 0, y: 2 },
    { templateId: 'list-4x2', x: 4, y: 0 },
    { templateId: 'kpi-2x3', x: 9, y: 0 }
  ];

  for (const item of initial) {
    dashboard.addWidgetFromTemplate(item.templateId, {
      x: item.x,
      y: item.y
    });
  }

  // Locked anchor widget — pinned, immovable, and not removable via the UI.
  if (!dashboard.getWidgets().find((w) => w.id === 'hero')) {
    dashboard.addWidget({ id: 'hero', type: 'kpi', x: 2, y: 0, w: 2, h: 2, locked: true });
  }

  const firstId = dashboard.getWidgets()[0]?.id ?? null;
  setSelected(firstId);
}

dashboard.on('layoutChanged', () => {
  if (dragState || resizeState) return;
  renderBoard();
  updateNamedLayoutState();
});

editModeBtn?.addEventListener('click', () => {
  editMode = !editMode;
  updateEditModeUI();
  notify(editMode ? 'Edit mode enabled' : 'Read-only mode enabled');
});

for (const button of collapseEdgeButtons) {
  button.addEventListener('click', () => {
    if (!collapsibleAreaDraft) return;
    startCollapsibleAreaPlacement(button.getAttribute('data-collapse-edge'));
  });
}

addCollapsibleAreaBtn?.addEventListener('click', () => {
  const selectedEdge = collapseEdgeButtons.find((button) => button.classList.contains('is-selected'))
    ?.getAttribute('data-collapse-edge');
  const firstValidEdge = ['left', 'right', 'top'].find((edge) => getValidCollapsibleDepths(edge).length > 0);
  startCollapsibleAreaPlacement(selectedEdge && getValidCollapsibleDepths(selectedEdge).length > 0
    ? selectedEdge
    : firstValidEdge);
});

confirmCollapsibleAreaBtn?.addEventListener('click', confirmCollapsibleArea);
cancelCollapsibleAreaBtn?.addEventListener('click', cancelCollapsibleArea);

fullWidthToggleBtn?.addEventListener('click', () => {
  fullWidthMode = !fullWidthMode;
  updateWidthModeUI();
  notify(fullWidthMode ? 'Full width enabled' : 'Constrained width enabled');
});

openPanelBtn?.addEventListener('click', () => {
  if (!editMode) {
    notify('Enable edit mode to add widgets');
    return;
  }
  panelEl?.classList.remove('hidden');
  openWizardStep1();
});

wizardBackBtn?.addEventListener('click', () => {
  openWizardStep1();
});

closePanelBtn?.addEventListener('click', () => {
  panelEl?.classList.add('hidden');
});

saveLayoutBtn?.addEventListener('click', () => {
  if (!editMode) {
    notify('Enable edit mode to save a layout');
    return;
  }

  const state = getLayoutStorageState();
  const name = window.prompt('Save current dashboard as:', `layout-${state.layouts.length + 1}`);
  if (!name) return;
  saveCurrentNamedLayout(name.trim());
});

saveCurrentLayoutBtn?.addEventListener('click', () => {
  saveSelectedNamedLayout();
});

layoutPickerEl?.addEventListener('change', () => {
  if (!layoutPickerEl) return;
  if (!layoutPickerEl.value) {
    activeNamedLayoutKey = '';
    updateNamedLayoutState();
    return;
  }
  loadNamedLayout(layoutPickerEl.value);
});

layoutSharedEl?.addEventListener('change', () => {
  sharedScopeOverride = layoutSharedEl.checked;
  updateNamedLayoutState();
});

closeEditPanelBtn?.addEventListener('click', () => {
  editMode = false;
  updateEditModeUI();
});

renameLayoutBtn?.addEventListener('click', () => {
  renameSelectedLayout();
});

deleteLayoutBtn?.addEventListener('click', () => {
  deleteSelectedLayout();
});

resetBtn?.addEventListener('click', () => {
  if (!editMode) {
    notify('Enable edit mode to reset the board');
    return;
  }
  collapsibleAreas = [];
  cancelCollapsibleArea();
  renderCollapsibleAreaList();
  seedLayout();
  notify('Board reset');
});

document.addEventListener('keydown', (event) => {
  if (isInteractiveTarget(event.target)) {
    if (event.key === 'Escape') {
      panelEl?.classList.add('hidden');
    }
    return;
  }

  if (event.key === 'Escape') {
    panelEl?.classList.add('hidden');
    return;
  }

  if (!editMode || !selectedId || dragState || resizeState) {
    return;
  }

  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    return;
  }

  event.preventDefault();

  if (event.shiftKey) {
    if (event.key === 'ArrowRight') {
      applyKeyboardResize(selectedId, 'w', 1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      applyKeyboardResize(selectedId, 'w', -1);
      return;
    }
    if (event.key === 'ArrowDown') {
      applyKeyboardResize(selectedId, 'h', 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      applyKeyboardResize(selectedId, 'h', -1);
      return;
    }
  }

  if (event.key === 'ArrowRight') {
    applyKeyboardMove(selectedId, 1, 0);
    return;
  }
  if (event.key === 'ArrowLeft') {
    applyKeyboardMove(selectedId, -1, 0);
    return;
  }
  if (event.key === 'ArrowDown') {
    applyKeyboardMove(selectedId, 0, 1);
    return;
  }
  applyKeyboardMove(selectedId, 0, -1);
});

document.addEventListener('pointermove', (event) => {
  if (collapsibleAreaResizeState && event.pointerId === collapsibleAreaResizeState.pointerId) {
    event.preventDefault();
    updateCollapsibleAreaPreview(event.clientX, event.clientY);
  } else if (dragState && event.pointerId === dragState.pointerId) {
    event.preventDefault();
    pendingDragPointer = { x: event.clientX, y: event.clientY };
    if (dragMoveFrame === null) {
      dragMoveFrame = requestAnimationFrame(() => {
        dragMoveFrame = null;
        if (!pendingDragPointer) return;
        updateDragPreview(pendingDragPointer.x, pendingDragPointer.y);
        pendingDragPointer = null;
      });
    }
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    event.preventDefault();
    updateResizePreview(event.clientX, event.clientY);
  }
}, true);

document.addEventListener('pointerup', (event) => {
  if (collapsibleAreaResizeState && event.pointerId === collapsibleAreaResizeState.pointerId) {
    endCollapsibleAreaResize();
  } else if (dragState && event.pointerId === dragState.pointerId) {
    endDrag();
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    endResize();
  }
}, true);

document.addEventListener('pointercancel', (event) => {
  if (collapsibleAreaResizeState && event.pointerId === collapsibleAreaResizeState.pointerId) {
    endCollapsibleAreaResize();
  } else if (dragState && event.pointerId === dragState.pointerId) {
    cleanupDragArtifacts();
    dragState = null;
    applyDragHoverIndicators();
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    resizeState.previewEl?.remove();
    resizeState.sourceEl?.classList.remove('dragging', 'resize-blocked');
    document.body.classList.remove('is-resizing');
    resizeState = null;
  }
}, true);

boardEl?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const removeButton = target.closest('[data-remove]');
  if (removeButton) {
    event.stopPropagation();
    if (!editMode) return;
    const id = removeButton.getAttribute('data-remove');
    if (!id) return;
    dashboard.removeWidget(id);
    if (selectedId === id) setSelected(null);
    notify(`Removed ${id}`);
    return;
  }

  const area = target.closest('[data-area-id]');
  if (area) {
    const id = area.getAttribute('data-area-id');
    const selectedArea = collapsibleAreas.find((item) => item.id === id);
    if (selectedArea) {
      selectedArea.collapsed = !selectedArea.collapsed;
      renderBoard();
      updateNamedLayoutState();
      notify(selectedArea.collapsed ? 'Area collapsed' : 'Area expanded');
    }
    return;
  }

  const card = target.closest('.widget');
  if (!card || !editMode) return;
  const id = card.getAttribute('data-id');
  if (id) setSelected(id);
});

boardEl?.addEventListener('keydown', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const card = target.closest('.widget');
  if (!card || !editMode) return;

  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const id = card.getAttribute('data-id');
  if (id) setSelected(id);
});

boardEl?.addEventListener('pointerdown', (event) => {
  if (!editMode || event.button !== 0) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest('[data-remove]')) {
    return;
  }

  if (target.closest('[data-collapse-resize]')) {
    startCollapsibleAreaResize(event);
    return;
  }

  const resizeHandle = target.closest('.resize-handle');
  if (resizeHandle) {
    const id = resizeHandle.getAttribute('data-resize');
    const dir = resizeHandle.getAttribute('data-dir');
    const card = queryWidgetCardById(id);
    if (card && dir) {
      setSelected(id, { render: false });
      startResize(card, event, dir);
    }
    return;
  }

  const card = target.closest('.widget');
  if (!card) return;
  event.preventDefault();
  setSelected(card.getAttribute('data-id'), { render: false });
  startDrag(card, event);
});

window.addEventListener('resize', scheduleResponsiveColumns);

syncCustomLayoutControls();
seedLayout();
renderCollapsibleAreaList();
updateCollapsibleAreaEditor();
void applyResponsiveColumns();
updateWidthModeUI();
updateEditModeUI();
notify('Demo ready');
