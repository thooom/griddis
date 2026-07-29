import { DashboardWidget } from '../types';

export class CollisionEngine {
  collides(a: DashboardWidget, b: DashboardWidget): boolean {
    if (a.id === b.id) return false;

    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  resolve(widget: DashboardWidget, others: DashboardWidget[], maxRows?: number): DashboardWidget {
    const resolved = { ...widget };

    while (others.some((other) => this.collides(resolved, other))) {
      resolved.y += 1;

      if (maxRows !== undefined && resolved.y + resolved.h > maxRows) {
        throw new Error('Unable to place widget within configured row bounds');
      }
    }

    return resolved;
  }
}
