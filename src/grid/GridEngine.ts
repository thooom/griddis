import { DashboardWidget } from '../types';

export class GridEngine {
  constructor(private columns: number) {}

  setColumns(columns: number): void {
    this.columns = Math.max(1, Math.floor(columns));
  }

  normalize(widget: DashboardWidget): DashboardWidget {
    const normalized = { ...widget };

    normalized.x = Math.max(0, Math.floor(normalized.x));
    normalized.y = Math.max(0, Math.floor(normalized.y));
    normalized.w = Math.max(1, Math.floor(normalized.w));
    normalized.h = Math.max(1, Math.floor(normalized.h));

    if (normalized.minW !== undefined) normalized.w = Math.max(normalized.minW, normalized.w);
    if (normalized.minH !== undefined) normalized.h = Math.max(normalized.minH, normalized.h);
    if (normalized.maxW !== undefined) normalized.w = Math.min(normalized.maxW, normalized.w);
    if (normalized.maxH !== undefined) normalized.h = Math.min(normalized.maxH, normalized.h);

    if (normalized.w > this.columns) {
      normalized.w = this.columns;
    }

    if (normalized.x + normalized.w > this.columns) {
      normalized.x = Math.max(0, this.columns - normalized.w);
    }

    return normalized;
  }
}
