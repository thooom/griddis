import { DashboardWidget } from '../types';

export class Layout {
  private widgets = new Map<string, DashboardWidget>();

  private static toPositiveInt(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : null;
  }

  private static toNonNegativeInt(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    const normalized = Math.floor(value);
    return normalized >= 0 ? normalized : null;
  }

  private static sanitizeWidget(value: unknown): DashboardWidget | null {
    if (!value || typeof value !== 'object') return null;

    const candidate = value as Partial<DashboardWidget>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const type = typeof candidate.type === 'string' ? candidate.type.trim() : '';
    const x = Layout.toNonNegativeInt(candidate.x);
    const y = Layout.toNonNegativeInt(candidate.y);
    const w = Layout.toPositiveInt(candidate.w);
    const h = Layout.toPositiveInt(candidate.h);

    if (!id || !type || x === null || y === null || w === null || h === null) {
      return null;
    }

    const widget: DashboardWidget = {
      id,
      type,
      x,
      y,
      w,
      h
    };

    const minW = Layout.toPositiveInt(candidate.minW);
    const minH = Layout.toPositiveInt(candidate.minH);
    const maxW = Layout.toPositiveInt(candidate.maxW);
    const maxH = Layout.toPositiveInt(candidate.maxH);

    if (minW !== null) widget.minW = minW;
    if (minH !== null) widget.minH = minH;
    if (maxW !== null) widget.maxW = maxW;
    if (maxH !== null) widget.maxH = maxH;
    if (candidate.data !== undefined) widget.data = candidate.data;

    return widget;
  }

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
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Invalid layout JSON');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Layout JSON must be an array of widgets');
    }

    const sanitized: DashboardWidget[] = parsed
      .map((item) => Layout.sanitizeWidget(item))
      .filter((item): item is DashboardWidget => item !== null);

    if (parsed.length > 0 && sanitized.length === 0) {
      throw new Error('Layout JSON did not contain any valid widgets');
    }

    this.setAll(sanitized);
  }
}
