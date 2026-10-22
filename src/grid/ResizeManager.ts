import { DashboardWidget, GridRect } from '../types';
import { GridEngine } from './GridEngine';

export class ResizeManager {
  constructor(private grid: GridEngine) {}

  resize(widget: DashboardWidget, rect: GridRect): DashboardWidget;
  resize(widget: DashboardWidget, w: number, h: number): DashboardWidget;
  resize(widget: DashboardWidget, rectOrWidth: GridRect | number, h?: number): DashboardWidget {
    const rect = typeof rectOrWidth === 'number' ? { w: rectOrWidth, h: h! } : rectOrWidth;
    return this.grid.normalize({ ...widget, ...rect });
  }
}
