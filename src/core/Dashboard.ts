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
    LayoutScope,
    ResponsiveBreakpoint,
    WidgetTemplate
} from '../types';
import { resolveResponsiveBreakpoint } from '../utils/responsive';
import { Layout } from './Layout';

export interface DashboardOptions {
  columns?: number;
  rows?: number;
  swapEnabled?: boolean;
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
  private swapEnabled: boolean;
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
    this.swapEnabled = options.swapEnabled ?? true;

    if (options.widgetTemplates) {
      this.setWidgetTemplates(options.widgetTemplates);
    }
  }

  private relayoutWidgets(): void {
    const widgets = this.layout
      .getAll()
      .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

    // Locked widgets are pinned first as immovable anchors.
    const relayout: DashboardWidget[] = [];
    for (const widget of widgets) {
      if (widget.locked) {
        relayout.push(this.gridEngine.normalize(widget));
      }
    }
    for (const widget of widgets) {
      if (!widget.locked) {
        const normalized = this.gridEngine.normalize(widget);
        const resolved = this.collisionEngine.resolve(normalized, relayout, this.gridEngine.getRows());
        relayout.push(resolved);
      }
    }

    this.layout.setAll(relayout);
  }

  private normalizeAndResolveWidgets(widgets: DashboardWidget[]): DashboardWidget[] {
    const ordered = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
    const resolvedWidgets: DashboardWidget[] = [];

    // Pin locked widgets first so others resolve around them.
    for (const widget of ordered) {
      if (widget.locked) {
        resolvedWidgets.push(this.gridEngine.normalize(widget));
      }
    }
    for (const widget of ordered) {
      if (!widget.locked) {
        const normalized = this.gridEngine.normalize(widget);
        const resolved = this.collisionEngine.resolve(normalized, resolvedWidgets, this.gridEngine.getRows());
        resolvedWidgets.push(resolved);
      }
    }

    return resolvedWidgets;
  }

  private areWidgetsSameSize(a: DashboardWidget, b: DashboardWidget): boolean {
    return a.w === b.w && a.h === b.h;
  }

  private canPlaceWidgetAtExactPosition(widget: DashboardWidget, others: DashboardWidget[]): boolean {
    return !others.some((other) => this.collisionEngine.collides(widget, other));
  }

  private createLayoutStorageKey(scope: LayoutScope): string {
    const namespace = scope.namespace ?? 'layout';
    const breakpointKey = scope.breakpointKey ?? 'default';
    const layoutId = scope.layoutId ?? 'default';
    return `${namespace}:${scope.appId}:${scope.userId}:${breakpointKey}:${layoutId}`;
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

  setSwapEnabled(enabled: boolean): void {
    this.swapEnabled = enabled;
  }

  isSwapEnabled(): boolean {
    return this.swapEnabled;
  }

  applyResponsiveDimensions(width: number, breakpoints: ResponsiveBreakpoint[]): ResponsiveBreakpoint {
    const selected = resolveResponsiveBreakpoint(width, breakpoints);
    this.setDimensions({ columns: selected.columns, rows: selected.rows });
    return selected;
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
      locked: template.locked,
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
    const existing = this.layout.get(widget.id);
    if (!existing) {
      throw new Error(`Widget with id "${widget.id}" does not exist`);
    }

    if (existing.locked) {
      throw new Error(`Widget with id "${widget.id}" is locked and cannot be modified`);
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
    if (widget.locked) throw new Error(`Widget with id "${id}" is locked and cannot be moved`);

    const moved = this.dragManager.drag(widget, x, y);

    const others = this.layout.getAll().filter((item) => item.id !== id);
    const overlapping = others.filter((other) => this.collisionEngine.collides(moved, other));

    if (this.swapEnabled && overlapping.length === 1) {
      const target = overlapping[0];
      if (!target.locked && this.areWidgetsSameSize(moved, target)) {
        const swappedTarget = this.gridEngine.normalize({ ...target, x: widget.x, y: widget.y });
        const remaining = others.filter((item) => item.id !== target.id);

        if (this.canPlaceWidgetAtExactPosition(swappedTarget, remaining)) {
          this.layout.update(swappedTarget);
          this.layout.update(moved);

          this.eventBus.emit('widgetUpdated', moved);
          this.eventBus.emit('widgetUpdated', swappedTarget);
          this.eventBus.emit('layoutChanged', this.layout.getAll());

          return moved;
        }
      }
    }

    return this.updateWidget(moved);
  }

  resizeWidget(id: string, w: number, h: number): DashboardWidget {
    const widget = this.layout.get(id);
    if (!widget) throw new Error(`Widget with id "${id}" does not exist`);
    if (widget.locked) throw new Error(`Widget with id "${id}" is locked and cannot be resized`);

    const resized = this.resizeManager.resize(widget, w, h);
    return this.updateWidget(resized);
  }

  removeWidget(id: string): DashboardWidget | undefined {
    const widget = this.layout.get(id);
    if (widget?.locked) throw new Error(`Widget with id "${id}" is locked and cannot be removed`);

    const removed = this.layout.remove(id);
    if (!removed) return undefined;

    this.eventBus.emit('widgetRemoved', removed);
    this.eventBus.emit('layoutChanged', this.layout.getAll());

    return removed;
  }

  getWidgets(): DashboardWidget[] {
    return this.layout.getAll();
  }

  setLayout(widgets: DashboardWidget[]): DashboardWidget[] {
    const resolved = this.normalizeAndResolveWidgets(widgets);
    this.layout.setAll(resolved);
    this.eventBus.emit('layoutChanged', this.layout.getAll());
    return this.layout.getAll();
  }

  clearLayout(): void {
    this.layout.setAll([]);
    this.eventBus.emit('layoutChanged', this.layout.getAll());
  }

  applyDefaultLayout(widgets: DashboardWidget[], options: { onlyIfEmpty?: boolean } = {}): DashboardWidget[] {
    if (options.onlyIfEmpty && this.layout.getAll().length > 0) {
      return this.layout.getAll();
    }

    return this.setLayout(widgets);
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

  async saveScopedLayout(scope: LayoutScope): Promise<string> {
    const key = this.createLayoutStorageKey(scope);
    await this.saveLayout(key);
    return key;
  }

  async restoreLayout(key: string): Promise<DashboardWidget[]> {
    const saved = await this.storage.load(key);
    if (!saved) return this.layout.getAll();

    const previous = this.layout.getAll();
    try {
      this.layout.fromJSON(saved);
      this.relayoutWidgets();
    } catch {
      this.layout.setAll(previous);
      return this.layout.getAll();
    }

    this.eventBus.emit('layoutChanged', this.layout.getAll());
    return this.layout.getAll();
  }

  async restoreScopedLayout(scope: LayoutScope): Promise<DashboardWidget[]> {
    const key = this.createLayoutStorageKey(scope);
    return this.restoreLayout(key);
  }

  async hasScopedLayout(scope: LayoutScope): Promise<boolean> {
    const key = this.createLayoutStorageKey(scope);
    const saved = await this.storage.load(key);
    return saved !== null;
  }

  async restoreScopedLayoutOrDefault(
    scope: LayoutScope,
    defaultWidgets: DashboardWidget[]
  ): Promise<{ source: 'saved' | 'default'; widgets: DashboardWidget[] }> {
    const hasSaved = await this.hasScopedLayout(scope);
    if (hasSaved) {
      const widgets = await this.restoreScopedLayout(scope);
      return { source: 'saved', widgets };
    }

    const widgets = this.applyDefaultLayout(defaultWidgets, { onlyIfEmpty: false });
    return { source: 'default', widgets };
  }
}
