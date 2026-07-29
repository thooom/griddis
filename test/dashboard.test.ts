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
});
