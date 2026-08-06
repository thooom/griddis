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
  { id: 'kpi-2x4', type: 'kpi', label: 'KPI 1×2', w: 2, h: 4 },
  { id: 'kpi-2x3', type: 'kpi', label: 'KPI 1×3', w: 2, h: 3 },
  { id: 'kpi-2x2', type: 'kpi', label: 'KPI 2×2', w: 2, h: 2 },
  { id: 'graph-2x2', type: 'graph', label: 'Graph 2×2', w: 2, h: 2 },
  { id: 'graph-2x3', type: 'graph', label: 'Graph 2×3', w: 2, h: 3 },
  { id: 'graph-3x2', type: 'graph', label: 'Graph 3×2', w: 3, h: 2 },
  { id: 'graph-3x3', type: 'graph', label: 'Graph 3×3', w: 3, h: 3 },
  { id: 'list-4x2', type: 'list', label: 'List 4×2', w: 4, h: 2 },
  { id: 'list-4x3', type: 'list', label: 'List 4×3', w: 4, h: 3 }
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
let dragMoveFrame = null;
let pendingDragPointer = null;
let hoverIndicatorState = { swapTargetIds: [], incompatibleTargetIds: [] };

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

function nearestStep(current, sorted, direction) {
  if (!sorted.length) return current;
  const unique = [...new Set(sorted)].sort((a, b) => a - b);

  if (direction > 0) {
    return unique.find((value) => value > current) ?? current;
  }

  if (direction < 0) {
    for (let i = unique.length - 1; i >= 0; i -= 1) {
      if (unique[i] < current) return unique[i];
    }
  }

  return current;
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
    otherWidgets: dashboard.getWidgets().filter((item) => item.id !== id),
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
    originalBottom: widget.y + widget.h,
    isBlocked: false
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

  const candidate = { id: widget.id, x: newX, y: newY, w: newW, h: newH };
  const others = resizeState.otherWidgets ?? dashboard.getWidgets().filter((item) => item.id !== widget.id);
  const blocked = others.some((item) => collides(candidate, item));

  resizeState.isBlocked = blocked;
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

  const { id, widget, currentW, currentH, currentX, currentY, isBlocked } = resizeState;
  resizeState = null;

  const changed = currentW !== widget.w || currentH !== widget.h || currentX !== widget.x || currentY !== widget.y;
  if (changed) {
    if (isBlocked) {
      notify('Cannot resize here');
      renderBoard();
      return;
    }

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

  if (overlaps.length === 1 && overlaps[0].w === sourceWidget.w && overlaps[0].h === sourceWidget.h) {
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

  const widget = getWidgetById(dragState.widget.id);
  cleanupDragArtifacts();

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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function applyKeyboardMove(id, dx, dy) {
  const widget = getWidgetById(id);
  if (!widget) return;

  try {
    dashboard.moveWidget(widget.id, widget.x + dx, widget.y + dy);
  } catch {
    notify('Cannot move here');
  }
}

function applyKeyboardResize(id, axis, direction) {
  const widget = getWidgetById(id);
  if (!widget) return;

  const validSizes = dashboard.getValidSizesForType(widget.type);
  if (!validSizes.length) return;

  let newW = widget.w;
  let newH = widget.h;

  if (axis === 'w') {
    const widths = validSizes.filter((size) => size.h === widget.h).map((size) => size.w);
    newW = nearestStep(widget.w, widths, direction);
  } else {
    const heights = validSizes.filter((size) => size.w === widget.w).map((size) => size.h);
    newH = nearestStep(widget.h, heights, direction);
  }

  if (newW === widget.w && newH === widget.h) return;

  try {
    dashboard.updateWidget({ ...widget, w: newW, h: newH });
  } catch {
    notify('Cannot resize here');
  }
}

function widgetMarkup(widget) {
  if (widget.type === 'kpi') {
    const kpi = pickByWidget(widget, KPI_PRESETS);
    const trendClass = kpi.delta >= 0 ? 'up' : 'down';
    const trendText = `${kpi.delta >= 0 ? '+' : ''}${kpi.delta.toFixed(1)}%`;
    const spark = kpiSparkBars(hashKey(widget.id));
    return `<div class="widget-kpi">
      <div class="kpi-label">${escapeHtml(kpi.label)}</div>
      <div class="kpi-value">${escapeHtml(kpi.value)}</div>
      <div class="kpi-foot">
        <span class="kpi-trend ${trendClass}">${trendText}</span>
        <span class="kpi-period">vs last week</span>
      </div>
      <div class="kpi-spark">${spark}</div>
    </div>`;
  }

  if (widget.type === 'graph') {
    const graph = pickByWidget(widget, GRAPH_PRESETS);
    const points = graphPolyline(graph.points);
    const tone = graph.delta.startsWith('-') ? 'down' : 'up';
    const xLabels = graph.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('');
    return `<div class="widget-graph">
      <div class="graph-head">
        <span class="graph-title">${escapeHtml(graph.title)}</span>
        <span class="graph-delta ${tone}">${escapeHtml(graph.delta)}</span>
      </div>
      <svg class="graph-chart" viewBox="0 0 240 90" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(79, 128, 255, 0.38)" />
            <stop offset="100%" stop-color="rgba(79, 128, 255, 0.04)" />
          </linearGradient>
        </defs>
        <polyline class="graph-line" points="${points}" />
      </svg>
      <div class="graph-axis">${xLabels}</div>
    </div>`;
  }

  if (widget.type === 'list') {
    const list = pickByWidget(widget, LIST_PRESETS);
    const rows = list.items
      .map(
        (item) => `<li class="checklist-row">
          <span class="checklist-label">${escapeHtml(item.label)}</span>
          <span class="checklist-state ${sanitizeToken(item.tone, 'warn')}">${escapeHtml(item.status)}</span>
        </li>`
      )
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
      const safeTitle = escapeHtml(widget.type.toUpperCase());
      const safeId = escapeHtml(widget.id);
      return `<article class="widget ${selectedClass}" data-id="${safeId}" style="${style}" title="${safeTitle}" tabindex="${editMode ? '0' : '-1'}" role="group" aria-label="${safeTitle} widget ${safeId}">
        ${editMode ? `<button class="remove" data-remove="${safeId}" aria-label="Remove widget">x</button>` : ''}
        ${widgetMarkup(widget)}
        ${editMode ? `<button type="button" class="resize-handle resize-n" data-resize="${safeId}" data-dir="n" aria-label="Resize ${safeTitle} widget north"></button>` : ''}
        ${editMode ? `<button type="button" class="resize-handle resize-e" data-resize="${safeId}" data-dir="e" aria-label="Resize ${safeTitle} widget east"></button>` : ''}
        ${editMode ? `<button type="button" class="resize-handle resize-s" data-resize="${safeId}" data-dir="s" aria-label="Resize ${safeTitle} widget south"></button>` : ''}
        ${editMode ? `<button type="button" class="resize-handle resize-w" data-resize="${safeId}" data-dir="w" aria-label="Resize ${safeTitle} widget west"></button>` : ''}
      </article>`;
    })
    .join('');
}

function renderWidgetList() {
  if (!widgetListEl) return;

  const templates = dashboard.getWidgetTemplates();

  widgetListEl.innerHTML = templates
    .map(
      (template) =>
        `<button class="widget-row" data-add="${escapeHtml(template.id)}"><span>${escapeHtml(template.label ?? template.id)}</span><span class="widget-size">${template.w}x${template.h}</span></button>`
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
  if (dragState && event.pointerId === dragState.pointerId) {
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
  if (dragState && event.pointerId === dragState.pointerId) {
    endDrag();
  } else if (resizeState && event.pointerId === resizeState.pointerId) {
    endResize();
  }
}, true);

document.addEventListener('pointercancel', (event) => {
  if (dragState && event.pointerId === dragState.pointerId) {
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

renderWidgetList();
seedLayout();
void applyResponsiveColumns();
updateWidthModeUI();
updateEditModeUI();
notify('Demo ready');
