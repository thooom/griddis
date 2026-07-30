import { describe, expect, it } from 'vitest';
import { Dashboard } from '../src/core/Dashboard';

describe('Dashboard', () => {
  it('adds widgets and resolves collisions by moving down', () => {
    const dashboard = new Dashboard({ columns: 4 });

    const a = dashboard.addWidget({ id: 'a', type: 'chart', x: 0, y: 0, w: 2, h: 1 });
    const b = dashboard.addWidget({ id: 'b', type: 'chart', x: 1, y: 0, w: 2, h: 1 });

    expect(a.y).toBe(0);
    expect(b.y).toBe(1);
  });

  it('supports save and restore from JSON storage', async () => {
    const dashboard = new Dashboard();
    dashboard.addWidget({ id: 'a', type: 'text', x: 0, y: 0, w: 2, h: 2 });

    await dashboard.saveLayout('layout');

    dashboard.removeWidget('a');
    expect(dashboard.getWidgets()).toHaveLength(0);

    await dashboard.restoreLayout('layout');
    expect(dashboard.getWidgets()).toHaveLength(1);
    expect(dashboard.getWidgets()[0]?.id).toBe('a');
  });

  it('emits layoutChanged events', () => {
    const dashboard = new Dashboard();
    let callCount = 0;

    dashboard.on('layoutChanged', () => {
      callCount += 1;
    });

    dashboard.addWidget({ id: 'a', type: 'table', x: 0, y: 0, w: 1, h: 1 });
    dashboard.moveWidget('a', 2, 3);
    dashboard.resizeWidget('a', 2, 2);
    dashboard.removeWidget('a');

    expect(callCount).toBe(4);
  });

  it('supports adding widgets from registered templates', () => {
    const dashboard = new Dashboard({
      columns: 8,
      widgetTemplates: [
        { id: 'kpi-1x1', type: 'kpi', w: 1, h: 1 },
        { id: 'graph-2x2', type: 'graph', w: 2, h: 2 }
      ]
    });

    const widget = dashboard.addWidgetFromTemplate('graph-2x2', { id: 'g1', x: 2, y: 0 });

    expect(widget.id).toBe('g1');
    expect(widget.type).toBe('graph');
    expect(widget.w).toBe(2);
    expect(widget.h).toBe(2);
    expect(widget.data).toBeUndefined();
  });

  it('rejects unknown templates', () => {
    const dashboard = new Dashboard();

    expect(() => dashboard.addWidgetFromTemplate('does-not-exist')).toThrow(
      'Widget template "does-not-exist" is not registered'
    );
  });

  it('respects configured row bounds', () => {
    const dashboard = new Dashboard({ columns: 4, rows: 2 });

    dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 4, h: 1 });
    dashboard.addWidget({ id: 'b', type: 'kpi', x: 0, y: 1, w: 4, h: 1 });

    expect(() => dashboard.addWidget({ id: 'c', type: 'kpi', x: 0, y: 0, w: 4, h: 1 })).toThrow(
      'Unable to place widget within configured row bounds'
    );
  });

  it('reflows layout safely when columns shrink for responsive screens', () => {
    const dashboard = new Dashboard({ columns: 9 });

    dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 3, h: 1 });
    dashboard.addWidget({ id: 'b', type: 'kpi', x: 3, y: 0, w: 3, h: 1 });
    dashboard.addWidget({ id: 'c', type: 'kpi', x: 6, y: 0, w: 3, h: 1 });

    dashboard.setColumns(6);
    const at6 = dashboard.getWidgets();
    expect(at6.every((widget) => widget.x + widget.w <= 6)).toBe(true);

    dashboard.setColumns(3);
    const at3 = dashboard.getWidgets();

    expect(at3).toHaveLength(3);
    expect(at3.every((widget) => widget.x + widget.w <= 3)).toBe(true);

    const collides = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

    for (let i = 0; i < at3.length; i += 1) {
      for (let j = i + 1; j < at3.length; j += 1) {
        expect(collides(at3[i], at3[j])).toBe(false);
      }
    }
  });
});
