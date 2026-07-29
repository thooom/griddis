import { DashboardWidget } from '../types';

export class GridEngine {
  constructor(
    private columns: number,
    private rows?: number
  ) {}

  setColumns(columns: number): void {
    this.columns = Math.max(1, Math.floor(columns));
  }

  setRows(rows?: number): void {
    this.rows = rows === undefined ? undefined : Math.max(1, Math.floor(rows));
  }

  getColumns(): number {
    return this.columns;
  }

  getRows(): number | undefined {
    return this.rows;
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

    if (this.rows !== undefined) {
      if (normalized.h > this.rows) {
        normalized.h = this.rows;
      }

      if (normalized.y + normalized.h > this.rows) {
        normalized.y = Math.max(0, this.rows - normalized.h);
      }
    }

    return normalized;
  }
}
