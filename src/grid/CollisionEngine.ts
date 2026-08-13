import { DashboardWidget } from '../types';

interface ResolveOptions {
  alignNewRowsLeft?: boolean;
  compactLeft?: boolean;
}

export class CollisionEngine {
  collides(a: DashboardWidget, b: DashboardWidget): boolean {
    if (a.id === b.id) return false;

    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  resolve(
    widget: DashboardWidget,
    others: DashboardWidget[],
    maxRows?: number,
    options: ResolveOptions = {}
  ): DashboardWidget {
    const resolved = { ...widget };
    const alignNewRowsLeft = options.alignNewRowsLeft ?? false;
    const compactLeft = options.compactLeft ?? false;

    if (compactLeft) {
      this.compactLeftInRow(resolved, others);
    }

    // Locked widgets are immovable anchors; non-locked widgets resolve around them.
    while (others.some((other) => this.collides(resolved, other))) {
      if (alignNewRowsLeft) {
        // For auto-placement/reflow flows, once we move to a new row, start
        // from the leftmost column for compact, predictable packing.
        resolved.x = 0;
      }
      resolved.y += 1;

      if (maxRows !== undefined && resolved.y + resolved.h > maxRows) {
        throw new Error('Unable to place widget within configured row bounds');
      }

      if (compactLeft) {
        this.compactLeftInRow(resolved, others);
      }
    }

    return resolved;
  }

  private compactLeftInRow(widget: DashboardWidget, others: DashboardWidget[]): void {
    while (widget.x > 0) {
      const next = { ...widget, x: widget.x - 1 };
      if (others.some((other) => this.collides(next, other))) {
        return;
      }
      widget.x -= 1;
    }
  }
}
