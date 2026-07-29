import { Dashboard } from 'griddis';

const boardEl = document.querySelector('#board');
const panelEl = document.querySelector('#panel');
const widgetListEl = document.querySelector('#widget-list');
const selectedEl = document.querySelector('#selected');
const toastEl = document.querySelector('#toast');

const openPanelBtn = document.querySelector('#open-panel');
const closePanelBtn = document.querySelector('#close-panel');
const saveBtn = document.querySelector('#save');
const restoreBtn = document.querySelector('#restore');
const resetBtn = document.querySelector('#reset');
const growBtn = document.querySelector('#grow');
const shrinkBtn = document.querySelector('#shrink');
const removeBtn = document.querySelector('#remove');

const projectWidgetTemplates = [
  { id: 'kpi-1x1', type: 'kpi', label: 'KPI 1x1', w: 1, h: 1 },
  { id: 'kpi-1x2', type: 'kpi', label: 'KPI 1x2', w: 1, h: 2 },
  { id: 'kpi-1x3', type: 'kpi', label: 'KPI 1x3', w: 1, h: 3 },
  { id: 'graph-2x2', type: 'graph', label: 'Graph 2x2', w: 2, h: 2 },
  { id: 'graph-2x3', type: 'graph', label: 'Graph 2x3', w: 2, h: 3 },
  { id: 'list-4x2', type: 'list', label: 'List 4x2', w: 4, h: 2 },
  { id: 'hero-4x6', type: 'hero', label: 'Hero 4x6', w: 4, h: 6 }
];

const dashboard = new Dashboard({ columns: 12, rows: 10, widgetTemplates: projectWidgetTemplates });
let selectedId = null;
let dragState = null;

function notify(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 1100);
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
}

function startDrag(cardEl, event) {
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
    currentY: widget.y
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

  const widgets = dashboard.getWidgets();
  boardEl.innerHTML = widgets
    .map((widget) => {
      const selectedClass = widget.id === selectedId ? ' selected' : '';
      const style = `grid-column:${widget.x + 1} / span ${widget.w}; grid-row:${widget.y + 1} / span ${widget.h};`;
      const safeTitle = widget.type.toUpperCase();
      return `<article class="widget ${selectedClass}" data-id="${widget.id}" style="${style}" title="${safeTitle}">
        <button class="remove" data-remove="${widget.id}" aria-label="Remove widget">x</button>
        ${widgetMarkup(widget)}
      </article>`;
    })
    .join('');

  for (const card of boardEl.querySelectorAll('.widget')) {
    card.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-remove]');
      if (removeButton) return;
      const id = card.getAttribute('data-id');
      if (id) setSelected(id);
    });

    card.addEventListener('pointerdown', (event) => {
      const removeButton = event.target.closest('[data-remove]');
      if (removeButton || event.button !== 0) return;
      event.preventDefault();
      setSelected(card.getAttribute('data-id'), { render: false });
      startDrag(card, event);
    });
  }

  for (const removeButton of boardEl.querySelectorAll('[data-remove]')) {
    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = removeButton.getAttribute('data-remove');
      if (!id) return;
      dashboard.removeWidget(id);
      if (selectedId === id) setSelected(null);
      notify(`Removed ${id}`);
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
      const templateId = button.getAttribute('data-add');
      if (!templateId) return;
      addWidget(templateId);
      panelEl?.classList.add('hidden');
    });
  }
}

function addWidget(templateId) {
  const template = getTemplateById(templateId);
  if (!template) return;

  const added = dashboard.addWidgetFromTemplate(templateId, {
    x: 0,
    y: 0
  });

  setSelected(added.id);
  notify(`Added ${template.label ?? template.id}`);
}

function requireSelection() {
  if (!selectedId) {
    notify('Select a widget first');
    return null;
  }
  const selected = getWidgetById(selectedId);
  if (!selected) {
    setSelected(null);
    notify('Selected widget no longer exists');
  }
  return selected;
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
  if (dragState) return;
  renderBoard();
});

openPanelBtn?.addEventListener('click', () => {
  panelEl?.classList.remove('hidden');
});

closePanelBtn?.addEventListener('click', () => {
  panelEl?.classList.add('hidden');
});

saveBtn?.addEventListener('click', async () => {
  await dashboard.saveLayout('demo-layout');
  notify('Layout saved');
});

restoreBtn?.addEventListener('click', async () => {
  await dashboard.restoreLayout('demo-layout');
  notify('Layout restored');
});

resetBtn?.addEventListener('click', () => {
  seedLayout();
  notify('Board reset');
});

growBtn?.addEventListener('click', () => {
  const selected = requireSelection();
  if (!selected) return;
  dashboard.resizeWidget(selected.id, selected.w + 1, selected.h + 1);
});

shrinkBtn?.addEventListener('click', () => {
  const selected = requireSelection();
  if (!selected) return;
  dashboard.resizeWidget(selected.id, selected.w - 1, selected.h - 1);
});

removeBtn?.addEventListener('click', () => {
  const selected = requireSelection();
  if (!selected) return;
  dashboard.removeWidget(selected.id);
  setSelected(dashboard.getWidgets()[0]?.id ?? null);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    panelEl?.classList.add('hidden');
  }
});

document.addEventListener('pointermove', (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  event.preventDefault();
  updateDragPreview(event.clientX, event.clientY);
}, true);

document.addEventListener('pointerup', (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  endDrag();
}, true);

document.addEventListener('pointercancel', (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  dragState.previewEl?.remove();
  dragState.sourceEl?.classList.remove('dragging');
  document.body.classList.remove('is-dragging');
  dragState = null;
}, true);

renderWidgetList();
seedLayout();
notify('Demo ready');
