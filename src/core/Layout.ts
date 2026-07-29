import { DashboardWidget } from '../types';

export class Layout {
  private widgets = new Map<string, DashboardWidget>();

  getAll(): DashboardWidget[] {
    return Array.from(this.widgets.values()).map((widget) => ({ ...widget }));
  }

  get(id: string): DashboardWidget | undefined {
    const widget = this.widgets.get(id);
    return widget ? { ...widget } : undefined;
  }

  setAll(widgets: DashboardWidget[]): void {
    this.widgets = new Map(widgets.map((widget) => [widget.id, { ...widget }]));
  }

  add(widget: DashboardWidget): void {
    this.widgets.set(widget.id, { ...widget });
  }

  update(widget: DashboardWidget): void {
    this.widgets.set(widget.id, { ...widget });
  }

  remove(id: string): DashboardWidget | undefined {
    const widget = this.widgets.get(id);
    if (!widget) return undefined;
    this.widgets.delete(id);
    return { ...widget };
  }

  toJSON(): string {
    return JSON.stringify(this.getAll());
  }

  fromJSON(json: string): void {
    const parsed = JSON.parse(json) as DashboardWidget[];
    this.setAll(parsed);
  }
}
