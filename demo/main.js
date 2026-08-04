import { Dashboard } from 'griddis';

const sceneEl = document.querySelector('.scene');
const boardEl = document.querySelector('#board');
const panelEl = document.querySelector('#panel');
const widgetListEl = document.querySelector('#widget-list');
const selectedEl = document.querySelector('#selected');
const toastEl = document.querySelector('#toast');

const fullWidthToggleBtn = document.querySelector('#full-width-toggle');
const editModeBtn = document.querySelector('#edit-mode');
const openPanelBtn = document.querySelector('#open-panel');
const closePanelBtn = document.querySelector('#close-panel');
const saveBtn = document.querySelector('#save');
const restoreBtn = document.querySelector('#restore');
const resetBtn = document.querySelector('#reset');

const projectWidgetTemplates = [
  { id: 'kpi-1x1', type: 'kpi', label: 'KPI 1×1', w: 1, h: 1 },
  { id: 'kpi-1x2', type: 'kpi', label: 'KPI 1×2', w: 1, h: 2 },
  { id: 'kpi-1x3', type: 'kpi', label: 'KPI 1×3', w: 1, h: 3 },
  { id: 'kpi-2x1', type: 'kpi', label: 'KPI 2×1', w: 2, h: 1 },
  { id: 'kpi-2x2', type: 'kpi', label: 'KPI 2×2', w: 2, h: 2 },
  { id: 'kpi-3x1', type: 'kpi', label: 'KPI 3×1', w: 3, h: 1 },
  { id: 'graph-2x2', type: 'graph', label: 'Graph 2×2', w: 2, h: 2 },
  { id: 'graph-2x3', type: 'graph', label: 'Graph 2×3', w: 2, h: 3 },
  { id: 'graph-3x2', type: 'graph', label: 'Graph 3×2', w: 3, h: 2 },
  { id: 'graph-3x3', type: 'graph', label: 'Graph 3×3', w: 3, h: 3 },
  { id: 'list-4x2', type: 'list', label: 'List 4×2', w: 4, h: 2 },
  { id: 'list-4x3', type: 'list', label: 'List 4×3', w: 4, h: 3 },
  { id: 'hero-4x6', type: 'hero', label: 'Hero 4×6', w: 4, h: 6 }
];

const RESPONSIVE_LAYOUTS = [
  { key: 'ultraWide', minWidth: 1920, columns: 12 },
  { key: 'desktop', minWidth: 1024, columns: 9 },
  { key: 'tablet', minWidth: 640, columns: 6 },
  { key: 'mobile', minWidth: 0, columns: 3 }
];

const dashboard = new Dashboard({ columns: 12, rows: 10, widgetTemplates: projectWidgetTemplates });
let selectedId = null;
let dragState = null;
let resizeState = null;
let editMode = false;
let fullWidthMode = true;
let activeBreakpointKey = null;
let responsiveApplyTimer = null;

function notify(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 1100);
}

function updateEditModeUI() {
  if (editModeBtn) {
    editModeBtn.textContent = editMode ? 'Edit mode: on' : 'Edit mode: off';
  }

  if (openPanelBtn) {
    openPanelBtn.disabled = !editMode;
  }

  if (resetBtn) {
    resetBtn.disabled = !editMode;
  }

  if (!editMode) {
    panelEl?.classList.add('hidden');
    if (dragState) {
      dragState.previewEl?.remove();
      dragState.sourceEl?.classList.remove('dragging');
      dragState = null;
    }
    if (resizeState) {
      resizeState.previewEl?.remove();
      resizeState.sourceEl?.classList.remove('dragging');
      resizeState = null;
    }
    document.body.classList.remove('is-dragging', 'is-resizing');
  }

  renderBoard();
}

function updateWidthModeUI() {
  if (fullWidthToggleBtn) {
    fullWidthToggleBtn.textContent = fullWidthMode ? 'Full width: on' : 'Full width: off';
  }

  if (sceneEl) {
    sceneEl.classList.toggle('is-constrained', !fullWidthMode);
  }
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

function getTemplateById(id) {
  return dashboard.getWidgetTemplates().find((template) => template.id === id) ?? null;
}

function getResponsiveLayout() {
  const width = window.innerWidth;
  return RESPONSIVE_LAYOUTS.find((layout) => width >= layout.minWidth) ?? RESPONSIVE_LAYOUTS[RESPONSIVE_LAYOUTS.length - 1];
}

function getLayoutStorageKey(breakpointKey) {
  return `demo-layout:${breakpointKey}`;
}

async function applyResponsiveColumns() {
  const targetLayout = getResponsiveLayout();
  const targetColumns = targetLayout.columns;
  const { columns, rows } = dashboard.getDimensions();

  if (columns !== targetColumns) {
    dashboard.setDimensions({ columns: targetColumns, rows });
  }

  if (boardEl) {
    boardEl.style.gridTemplateColumns = `repeat(${targetColumns}, minmax(0, 1fr))`;
  }

  if (activeBreakpointKey !== targetLayout.key) {
    activeBreakpointKey = targetLayout.key;
    await dashboard.restoreLayout(getLayoutStorageKey(targetLayout.key));
  }
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
  resizeState.sourceEl.classList.remove('dragging');
  document.body.classList.remove('is-resizing');

  const { id, widget, currentW, currentH, currentX, currentY } = resizeState;
  resizeState = null;

  const changed = currentW !== widget.w || currentH !== widget.h || currentX !== widget.x || currentY !== widget.y;
  if (changed) {
    try {
      dashboard.updateWidget({ ...widget, x: currentX, y: currentY, w: currentW, h: currentH });
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
  const overlaps = dashboard
    .getWidgets()
    .filter((widget) => widget.id !== sourceWidget.id)
    .filter((widget) => collides(probe, widget));

  dragState.swapTargetIds = [];
  dragState.incompatibleTargetIds = [];

  if (overlaps.length === 1 && overlaps[0].w === sourceWidget.w && overlaps[0].h === sourceWidget.h) {
    dragState.swapTargetIds = [overlaps[0].id];
  } else if (overlaps.length > 0) {
    dragState.incompatibleTargetIds = overlaps.map((widget) => widget.id);
  }

  applyDragHoverIndicators();
}

function applyDragHoverIndicators() {
  if (!boardEl) return;

  for (const card of boardEl.querySelectorAll('.widget')) {
    card.classList.remove('swap-target', 'swap-incompatible');
  }

  if (!dragState) {
    document.body.classList.remove('is-swap-ready');
    return;
  }

  for (const id of dragState.swapTargetIds ?? []) {
    const target = boardEl.querySelector(`[data-id="${id}"]`);
    target?.classList.add('swap-target');
  }

  for (const id of dragState.incompatibleTargetIds ?? []) {
    const target = boardEl.querySelector(`[data-id="${id}"]`);
    target?.classList.add('swap-incompatible');
  }

  document.body.classList.toggle('is-swap-ready', (dragState.swapTargetIds ?? []).length > 0);
}

function endDrag() {
  if (!dragState) return;

  const widget = getWidgetById(dragState.widget.id);
  dragState.previewEl?.remove();
  dragState.sourceEl?.classList.remove('dragging');
  document.body.classList.remove('is-dragging');

  if (widget && Number.isFinite(dragState.currentX) && Number.isFinite(dragState.currentY)) {
    dashboard.moveWidget(widget.id, dragState.currentX, dragState.currentY);
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

  const rect = cardEl.getBoundingClientRect();
  const previewEl = cardEl.cloneNode(true);
  previewEl.classList.add('drag-preview', 'ghost');
  previewEl.classList.remove('selected');
  previewEl.removeAttribute('data-id');
  previewEl.querySelectorAll('[data-remove]').forEach((button) => button.remove());

  document.body.appendChild(previewEl);
  cardEl.classList.add('dragging');
  document.body.classList.add('is-dragging');

  dragState = {
    id,
    widget,
    sourceEl: cardEl,
    previewEl,
    pointerId: event.pointerId,
    dragOffsetX: event.clientX - rect.left,
    dragOffsetY: event.clientY - rect.top,
    currentX: widget.x,
    currentY: widget.y,
    swapTargetIds: [],
    incompatibleTargetIds: []
  };

  updateDragPreview(event.clientX, event.clientY);
  cardEl.setPointerCapture(event.pointerId);
}

function widgetMarkup(widget) {
  if (widget.type === 'kpi') {
    return '<div class="widget-orb"><div class="orb"></div><div class="hold">HOLD</div></div>';
  }

  if (widget.type === 'graph') {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const period = now.getHours() >= 12 ? 'PM' : 'AM';
    return `<div class="widget-clock"><div class="clock">${hh}:${mm} <small>${period}</small></div></div>`;
  }

  if (widget.type === 'list') {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const month = now.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    return `<div class="widget-date"><div class="weekday">${weekday}</div><div class="day">${now.getDate()}</div><div class="month">${month}</div></div>`;
  }

  if (widget.type === 'clock') {
    return '<div class="widget-dice"><div class="dice-grid"><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span></div></div>';
  }

  if (widget.type === 'hero') {
    return '<div class="widget-tarot"><div class="tarot-card"><div class="tarot-body">✶</div><div class="tarot-title">PAGE OF CUPS</div></div></div>';
  }

  return '<div>Widget</div>';
}

function renderBoard() {
  if (!boardEl) return;

  const { columns } = dashboard.getDimensions();
  boardEl.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;

  const widgets = dashboard.getWidgets();
  boardEl.innerHTML = widgets
    .map((widget) => {
      const selectedClass = widget.id === selectedId ? ' selected' : '';
      const style = `grid-column:${widget.x + 1} / span ${widget.w}; grid-row:${widget.y + 1} / span ${widget.h};`;
      const safeTitle = widget.type.toUpperCase();
      return `<article class="widget ${selectedClass}" data-id="${widget.id}" style="${style}" title="${safeTitle}">
        ${editMode ? `<button class="remove" data-remove="${widget.id}" aria-label="Remove widget">x</button>` : ''}
        ${widgetMarkup(widget)}
        ${editMode ? `<div class="resize-handle resize-n" data-resize="${widget.id}" data-dir="n"></div>` : ''}
        ${editMode ? `<div class="resize-handle resize-e" data-resize="${widget.id}" data-dir="e"></div>` : ''}
        ${editMode ? `<div class="resize-handle resize-s" data-resize="${widget.id}" data-dir="s"></div>` : ''}
        ${editMode ? `<div class="resize-handle resize-w" data-resize="${widget.id}" data-dir="w"></div>` : ''}
      </article>`;
    })
    .join('');

  for (const card of boardEl.querySelectorAll('.widget')) {
    card.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-remove]');
      if (removeButton) return;
      if (!editMode) return;
      const id = card.getAttribute('data-id');
      if (id) setSelected(id);
    });

    card.addEventListener('pointerdown', (event) => {
      if (!editMode) return;
      const removeButton = event.target.closest('[data-remove]');
      const resizeHandle = event.target.closest('.resize-handle');
      if (removeButton || resizeHandle || event.button !== 0) return;
      event.preventDefault();
      setSelected(card.getAttribute('data-id'), { render: false });
      startDrag(card, event);
    });
  }

  for (const removeButton of boardEl.querySelectorAll('[data-remove]')) {
    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!editMode) return;
      const id = removeButton.getAttribute('data-remove');
      if (!id) return;
      dashboard.removeWidget(id);
      if (selectedId === id) setSelected(null);
      notify(`Removed ${id}`);
    });
  }

  for (const handle of boardEl.querySelectorAll('.resize-handle')) {
    handle.addEventListener('pointerdown', (event) => {
      if (!editMode) return;
      if (event.button !== 0) return;
      const id = handle.getAttribute('data-resize');
      const dir = handle.getAttribute('data-dir');
      const card = id ? boardEl.querySelector(`[data-id="${id}"]`) : null;
      if (card && dir) {
        setSelected(id, { render: false });
        startResize(card, event, dir);
      }
    });
  }
}

function renderWidgetList() {
  if (!widgetListEl) return;

  const templates = dashboard.getWidgetTemplates();

  widgetListEl.innerHTML = templates
    .map(
      (template) =>
        `<button class="widget-row" data-add="${template.id}"><span>${template.label ?? template.id}</span><span class="widget-size">${template.w}x${template.h}</span></button>`
    )
    .join('');

  for (const button of widgetListEl.querySelectorAll('[data-add]')) {
    button.addEventListener('click', () => {
      if (!editMode) {
        notify('Enable edit mode to add widgets');
        return;
      }
      const templateId = button.getAttribute('data-add');
      if (!templateId) return;
      addWidget(templateId);
      panelEl?.classList.add('hidden');
    });
  }
}

function addWidget(templateId) {
  if (!editMode) return;

  const template = getTemplateById(templateId);
  if (!template) return;

  const added = dashboard.addWidgetFromTemplate(templateId, {
    x: 0,
    y: 0
  });

  setSelected(added.id);
  notify(`Added ${template.label ?? template.id}`);
}

function seedLayout() {
  const existingIds = dashboard.getWidgets().map((widget) => widget.id);
  for (const id of existingIds) {
    dashboard.removeWidget(id);
  }

  const initial = [
    { templateId: 'kpi-1x2', x: 0, y: 0 },
    { templateId: 'graph-2x2', x: 0, y: 2 },
    { templateId: 'list-4x2', x: 4, y: 0 },
    { templateId: 'kpi-1x1', x: 9, y: 0 },
    { templateId: 'hero-4x6', x: 8, y: 2 }
  ];

  for (const item of initial) {
    dashboard.addWidgetFromTemplate(item.templateId, {
      x: item.x,
      y: item.y
    });
  }

  const firstId = dashboard.getWidgets()[0]?.id ?? null;
  setSelected(firstId);
}

dashboard.on('layoutChanged', () => {
  if (dragState || resizeState) return;
  renderBoard();
});

editModeBtn?.addEventListener('click', () => {
  editMode = !editMode;
  updateEditModeUI();
  notify(editMode ? 'Edit mode enabled' : 'Read-only mode enabled');
});

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
});

closePanelBtn?.addEventListener('click', () => {
  panelEl?.classList.add('hidden');
});

saveBtn?.addEventListener('click', async () => {
  const breakpoint = activeBreakpointKey ?? getResponsiveLayout().key;
  await dashboard.saveLayout(getLayoutStorageKey(breakpoint));
  notify(`Layout saved for ${breakpoint}`);
});

restoreBtn?.addEventListener('click', async () => {
  const breakpoint = activeBreakpointKey ?? getResponsiveLayout().key;
  await dashboard.restoreLayout(getLayoutStorageKey(breakpoint));
  notify(`Layout restored for ${breakpoint}`);
});

resetBtn?.addEventListener('click', () => {
  if (!editMode) {
    notify('Enable edit mode to reset the board');
    return;
  }
  seedLayout();
  notify('Board reset');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    panelEl?.classList.add('hidden');
  }
});

document.addEventListener('pointermove', (event) => {
  if (dragState && event.pointerId === dragState.pointerId) {
    event.preventDefault();
    updateDragPreview(event.clientX, event.clientY);
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    event.preventDefault();
    updateResizePreview(event.clientX, event.clientY);
  }
}, true);

document.addEventListener('pointerup', (event) => {
  if (dragState && event.pointerId === dragState.pointerId) {
    endDrag();
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    endResize();
  }
}, true);

document.addEventListener('pointercancel', (event) => {
  if (dragState && event.pointerId === dragState.pointerId) {
    dragState.previewEl?.remove();
    dragState.sourceEl?.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    dragState = null;
    applyDragHoverIndicators();
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    resizeState.previewEl?.remove();
    resizeState.sourceEl?.classList.remove('dragging');
    document.body.classList.remove('is-resizing');
    resizeState = null;
  }
}, true);

window.addEventListener('resize', scheduleResponsiveColumns);

renderWidgetList();
seedLayout();
void applyResponsiveColumns();
updateWidthModeUI();
updateEditModeUI();
notify('Demo ready');
