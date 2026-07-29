import { EventBus } from '../events/EventBus';
import { CollisionEngine } from '../grid/CollisionEngine';
import { DragManager } from '../grid/DragManager';
import { GridEngine } from '../grid/GridEngine';
import { ResizeManager } from '../grid/ResizeManager';
import { PluginManager } from '../plugins/PluginManager';
import { MemoryStorage } from '../storage/MemoryStorage';
import { StorageAdapter } from '../storage/StorageAdapter';
import { DashboardEvents, DashboardWidget } from '../types';
import { Layout } from './Layout';

export interface DashboardOptions {
  columns?: number;
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

  constructor(options: DashboardOptions = {}) {
    const columns = Math.max(1, Math.floor(options.columns ?? 12));
    this.gridEngine = new GridEngine(columns);
    this.dragManager = new DragManager(this.gridEngine);
    this.resizeManager = new ResizeManager(this.gridEngine);
    this.storage = options.storage ?? new MemoryStorage();
    this.eventBus = options.eventBus ?? new EventBus<DashboardEvents>();
  }

  registerPlugin(type: string, initialize?: (widget: DashboardWidget) => DashboardWidget): void {
    this.plugins.register({ type, initialize });
  }

  setColumns(columns: number): void {
    this.gridEngine.setColumns(columns);
    const normalized = this.layout.getAll().map((widget) => this.gridEngine.normalize(widget));
    this.layout.setAll(normalized);
    this.eventBus.emit('layoutChanged', this.layout.getAll());
  }

  addWidget(widget: DashboardWidget): DashboardWidget {
    if (this.layout.get(widget.id)) {
      throw new Error(`Widget with id "${widget.id}" already exists`);
    }

    const pluginApplied = this.plugins.apply(widget);
    const normalized = this.gridEngine.normalize(pluginApplied);
    const resolved = this.collisionEngine.resolve(normalized, this.layout.getAll());
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
    const resolved = this.collisionEngine.resolve(normalized, others);
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
    const normalized = this.layout.getAll().map((widget) => this.gridEngine.normalize(widget));
    this.layout.setAll(normalized);
    this.eventBus.emit('layoutChanged', this.layout.getAll());
    return this.layout.getAll();
  }
}
