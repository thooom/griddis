import { DashboardWidget } from '../types';
import { GridEngine } from './GridEngine';

export class ResizeManager {
  constructor(private grid: GridEngine) {}

  resize(widget: DashboardWidget, w: number, h: number): DashboardWidget {
    return this.grid.normalize({ ...widget, w, h });
  }
}
