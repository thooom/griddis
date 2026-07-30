import { EventBus } from '../events/EventBus';
import { CollisionEngine } from '../grid/CollisionEngine';
import { DragManager } from '../grid/DragManager';
import { GridEngine } from '../grid/GridEngine';
import { ResizeManager } from '../grid/ResizeManager';
import { PluginManager } from '../plugins/PluginManager';
import { MemoryStorage } from '../storage/MemoryStorage';
import { StorageAdapter } from '../storage/StorageAdapter';
import {
    AddWidgetFromTemplateOptions,
    DashboardDimensions,
    DashboardEvents,
    DashboardWidget,
    WidgetTemplate
} from '../types';
import { Layout } from './Layout';

export interface DashboardOptions {
  columns?: number;
  rows?: number;
  widgetTemplates?: WidgetTemplate[];
  storage?: StorageAdapter;
  eventBus?: EventBus<DashboardEvents>;
}

export class Dashboard {
  private readonly layout = new Layout();
  private readonly collisionEngine = new CollisionEngine();
  private readonly plugins = new PluginManager();
  private readonly eventBus: EventBus<DashboardEvents>;
  private readonly storage: StorageAdapter;
  private readonly gridEngine: GridEngine;
  private readonly dragManager: DragManager;
  private readonly resizeManager: ResizeManager;
  private widgetTemplates = new Map<string, WidgetTemplate>();
  private templateCounter = 0;

  constructor(options: DashboardOptions = {}) {
    const columns = Math.max(1, Math.floor(options.columns ?? 12));
    const rows = options.rows === undefined ? undefined : Math.max(1, Math.floor(options.rows));

    this.gridEngine = new GridEngine(columns, rows);
    this.dragManager = new DragManager(this.gridEngine);
    this.resizeManager = new ResizeManager(this.gridEngine);
    this.storage = options.storage ?? new MemoryStorage();
    this.eventBus = options.eventBus ?? new EventBus<DashboardEvents>();

    if (options.widgetTemplates) {
      this.setWidgetTemplates(options.widgetTemplates);
    }
  }

  private relayoutWidgets(): void {
    const widgets = this.layout
      .getAll()
      .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

    const relayout: DashboardWidget[] = [];
    for (const widget of widgets) {
      const normalized = this.gridEngine.normalize(widget);
      const resolved = this.collisionEngine.resolve(normalized, relayout, this.gridEngine.getRows());
      relayout.push(resolved);
    }

    this.layout.setAll(relayout);
  }

  registerPlugin(type: string, initialize?: (widget: DashboardWidget) => DashboardWidget): void {
    this.plugins.register({ type, initialize });
  }

  setColumns(columns: number): void {
    this.gridEngine.setColumns(columns);
    this.relayoutWidgets();
    this.eventBus.emit('layoutChanged', this.layout.getAll());
  }

  setRows(rows?: number): void {
    this.gridEngine.setRows(rows);
    this.relayoutWidgets();
    this.eventBus.emit('layoutChanged', this.layout.getAll());
  }

  setDimensions(dimensions: DashboardDimensions): void {
    this.gridEngine.setColumns(dimensions.columns);
    this.gridEngine.setRows(dimensions.rows);
    this.relayoutWidgets();
    this.eventBus.emit('layoutChanged', this.layout.getAll());
  }

  getDimensions(): DashboardDimensions {
    return {
      columns: this.gridEngine.getColumns(),
      rows: this.gridEngine.getRows()
    };
  }

  setWidgetTemplates(templates: WidgetTemplate[]): void {
    this.widgetTemplates = new Map();
    for (const template of templates) {
      this.registerWidgetTemplate(template);
    }
  }

  registerWidgetTemplate(template: WidgetTemplate): void {
    this.widgetTemplates.set(template.id, {
      ...template,
      w: Math.max(1, Math.floor(template.w)),
      h: Math.max(1, Math.floor(template.h))
    });
  }

  getWidgetTemplates(): WidgetTemplate[] {
    return Array.from(this.widgetTemplates.values()).map((template) => ({ ...template }));
  }

  getValidSizesForType(type: string): { w: number; h: number }[] {
    return Array.from(this.widgetTemplates.values())
      .filter((template) => template.type === type)
      .map(({ w, h }) => ({ w, h }));
  }

  addWidgetFromTemplate(templateId: string, options: AddWidgetFromTemplateOptions = {}): DashboardWidget {
    const template = this.widgetTemplates.get(templateId);
    if (!template) {
      throw new Error(`Widget template "${templateId}" is not registered`);
    }

    const id = options.id ?? `${template.id}-${++this.templateCounter}`;

    return this.addWidget({
      id,
      type: options.type ?? template.type,
      x: options.x ?? 0,
      y: options.y ?? 0,
      w: template.w,
      h: template.h,
      minW: template.minW,
      minH: template.minH,
      maxW: template.maxW,
      maxH: template.maxH,
      data: options.data
    });
  }

  addWidget(widget: DashboardWidget): DashboardWidget {
    if (this.layout.get(widget.id)) {
      throw new Error(`Widget with id "${widget.id}" already exists`);
    }

    const pluginApplied = this.plugins.apply(widget);
    const normalized = this.gridEngine.normalize(pluginApplied);
    const resolved = this.collisionEngine.resolve(normalized, this.layout.getAll(), this.gridEngine.getRows());
    this.layout.add(resolved);

    this.eventBus.emit('widgetAdded', resolved);
    this.eventBus.emit('layoutChanged', this.layout.getAll());

    return resolved;
  }

  updateWidget(widget: DashboardWidget): DashboardWidget {
    if (!this.layout.get(widget.id)) {
      throw new Error(`Widget with id "${widget.id}" does not exist`);
    }

    const normalized = this.gridEngine.normalize(widget);
    const others = this.layout.getAll().filter((item) => item.id !== widget.id);
    const resolved = this.collisionEngine.resolve(normalized, others, this.gridEngine.getRows());
    this.layout.update(resolved);

    this.eventBus.emit('widgetUpdated', resolved);
    this.eventBus.emit('layoutChanged', this.layout.getAll());

    return resolved;
  }

  moveWidget(id: string, x: number, y: number): DashboardWidget {
    const widget = this.layout.get(id);
    if (!widget) throw new Error(`Widget with id "${id}" does not exist`);

    const moved = this.dragManager.drag(widget, x, y);
    return this.updateWidget(moved);
  }

  resizeWidget(id: string, w: number, h: number): DashboardWidget {
    const widget = this.layout.get(id);
    if (!widget) throw new Error(`Widget with id "${id}" does not exist`);

    const resized = this.resizeManager.resize(widget, w, h);
    return this.updateWidget(resized);
  }

  removeWidget(id: string): DashboardWidget | undefined {
    const removed = this.layout.remove(id);
    if (!removed) return undefined;

    this.eventBus.emit('widgetRemoved', removed);
    this.eventBus.emit('layoutChanged', this.layout.getAll());

    return removed;
  }

  getWidgets(): DashboardWidget[] {
    return this.layout.getAll();
  }

  on<TKey extends keyof DashboardEvents>(
    event: TKey,
    handler: (payload: DashboardEvents[TKey]) => void
  ): () => void {
    return this.eventBus.on(event, handler);
  }

  async saveLayout(key: string): Promise<void> {
    await this.storage.save(key, this.layout.toJSON());
  }

  async restoreLayout(key: string): Promise<DashboardWidget[]> {
    const saved = await this.storage.load(key);
    if (!saved) return this.layout.getAll();

    this.layout.fromJSON(saved);
    this.relayoutWidgets();
    this.eventBus.emit('layoutChanged', this.layout.getAll());
    return this.layout.getAll();
  }
}
