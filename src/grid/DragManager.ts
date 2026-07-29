import { DashboardWidget } from '../types';
import { GridEngine } from './GridEngine';

export class DragManager {
  constructor(private grid: GridEngine) {}

  drag(widget: DashboardWidget, x: number, y: number): DashboardWidget {
    return this.grid.normalize({ ...widget, x, y });
  }
}
