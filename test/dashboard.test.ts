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

  it('saves and restores scoped personal layout per breakpoint', async () => {
    const dashboard = new Dashboard({ columns: 9 });

    dashboard.addWidget({ id: 'desktop-kpi', type: 'kpi', x: 0, y: 0, w: 3, h: 1 });
    await dashboard.saveScopedLayout({ appId: 'sales', userId: 'u1', breakpointKey: 'desktop' });

    dashboard.setColumns(3);
    dashboard.clearLayout();
    dashboard.addWidget({ id: 'mobile-kpi', type: 'kpi', x: 0, y: 0, w: 1, h: 1 });
    await dashboard.saveScopedLayout({ appId: 'sales', userId: 'u1', breakpointKey: 'mobile' });

    await dashboard.restoreScopedLayout({ appId: 'sales', userId: 'u1', breakpointKey: 'desktop' });
    expect(dashboard.getWidgets().map((w) => w.id)).toEqual(['desktop-kpi']);

    await dashboard.restoreScopedLayout({ appId: 'sales', userId: 'u1', breakpointKey: 'mobile' });
    expect(dashboard.getWidgets().map((w) => w.id)).toEqual(['mobile-kpi']);
  });

  it('restores saved scoped layout or applies code-defined default layout', async () => {
    const dashboard = new Dashboard({ columns: 6 });
    const defaultWidgets = [{ id: 'default-a', type: 'kpi', x: 0, y: 0, w: 2, h: 1 }];

    const noSaved = await dashboard.restoreScopedLayoutOrDefault(
      { appId: 'sales', userId: 'u2', breakpointKey: 'desktop' },
      defaultWidgets
    );

    expect(noSaved.source).toBe('default');
    expect(dashboard.getWidgets().map((w) => w.id)).toEqual(['default-a']);

    await dashboard.saveScopedLayout({ appId: 'sales', userId: 'u2', breakpointKey: 'desktop' });

    dashboard.clearLayout();
    const withSaved = await dashboard.restoreScopedLayoutOrDefault(
      { appId: 'sales', userId: 'u2', breakpointKey: 'desktop' },
      [{ id: 'unused-default', type: 'kpi', x: 0, y: 0, w: 1, h: 1 }]
    );

    expect(withSaved.source).toBe('saved');
    expect(dashboard.getWidgets().map((w) => w.id)).toEqual(['default-a']);
  });

  it('applies project-defined responsive breakpoint rules', () => {
    const dashboard = new Dashboard({ columns: 9, rows: 12 });
    const rules = [
      { key: 'ultra', minWidth: 1920, columns: 12 },
      { key: 'desktop', minWidth: 1024, columns: 9 },
      { key: 'tablet', minWidth: 640, columns: 6 },
      { key: 'mobile', minWidth: 0, columns: 3 }
    ];

    const selected = dashboard.applyResponsiveDimensions(500, rules);

    expect(selected.key).toBe('mobile');
    expect(dashboard.getDimensions().columns).toBe(3);
  });

  it('swaps widgets when moving onto same-size widget', () => {
    const dashboard = new Dashboard({ columns: 6 });

    dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 2 });
    dashboard.addWidget({ id: 'b', type: 'kpi', x: 2, y: 0, w: 2, h: 2 });

    dashboard.moveWidget('a', 2, 0);

    const a = dashboard.getWidgets().find((widget) => widget.id === 'a');
    const b = dashboard.getWidgets().find((widget) => widget.id === 'b');

    expect(a).toMatchObject({ id: 'a', x: 2, y: 0, w: 2, h: 2 });
    expect(b).toMatchObject({ id: 'b', x: 0, y: 0, w: 2, h: 2 });
  });

  it('enables swap by default', () => {
    const dashboard = new Dashboard({ columns: 6 });

    expect(dashboard.isSwapEnabled()).toBe(true);
  });

  it('allows swap behavior to be turned off', () => {
    const dashboard = new Dashboard({ columns: 6, swapEnabled: false });

    dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 2 });
    dashboard.addWidget({ id: 'b', type: 'kpi', x: 2, y: 0, w: 2, h: 2 });

    dashboard.moveWidget('a', 2, 0);

    const a = dashboard.getWidgets().find((widget) => widget.id === 'a');
    const b = dashboard.getWidgets().find((widget) => widget.id === 'b');

    expect(a).toMatchObject({ id: 'a', x: 2, y: 2, w: 2, h: 2 });
    expect(b).toMatchObject({ id: 'b', x: 2, y: 0, w: 2, h: 2 });
  });

  it('does not swap widgets when sizes are incompatible', () => {
    const dashboard = new Dashboard({ columns: 6 });

    dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 1 });
    dashboard.addWidget({ id: 'b', type: 'kpi', x: 2, y: 0, w: 1, h: 1 });

    dashboard.moveWidget('a', 2, 0);

    const a = dashboard.getWidgets().find((widget) => widget.id === 'a');
    const b = dashboard.getWidgets().find((widget) => widget.id === 'b');

    expect(a).toMatchObject({ id: 'a', x: 2, y: 1, w: 2, h: 1 });
    expect(b).toMatchObject({ id: 'b', x: 2, y: 0, w: 1, h: 1 });
  });

  it('keeps previous layout when restore payload is malformed JSON', async () => {
    const storage = {
      async save() {},
      async load(key: string) {
        if (key === 'bad-layout') {
          return '{ this is not valid json';
        }
        return null;
      }
    };

    const dashboard = new Dashboard({ storage });
    dashboard.addWidget({ id: 'existing', type: 'kpi', x: 0, y: 0, w: 1, h: 1 });

    const restored = await dashboard.restoreLayout('bad-layout');
    expect(restored.map((widget) => widget.id)).toEqual(['existing']);
    expect(dashboard.getWidgets().map((widget) => widget.id)).toEqual(['existing']);
  });

  it('restores valid widgets and ignores invalid ones from persisted payload', async () => {
    const storage = {
      async save() {},
      async load(key: string) {
        if (key !== 'mixed-layout') {
          return null;
        }

        return JSON.stringify([
          { id: 'valid-a', type: 'kpi', x: 0, y: 0, w: 2, h: 1 },
          { id: '', type: 'kpi', x: 0, y: 0, w: 1, h: 1 },
          { id: 'bad-size', type: 'kpi', x: 0, y: 0, w: -2, h: 1 },
          { id: 'valid-b', type: 'graph', x: 2, y: 0, w: 2, h: 2 }
        ]);
      }
    };

    const dashboard = new Dashboard({ columns: 6, storage });
    const restored = await dashboard.restoreLayout('mixed-layout');

    expect(restored.map((widget) => widget.id)).toEqual(['valid-a', 'valid-b']);
    expect(restored.every((widget) => widget.w > 0 && widget.h > 0)).toBe(true);
  });

  describe('locked widgets', () => {
    it('cannot be moved', () => {
      const dashboard = new Dashboard({ columns: 4 });
      dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 1, locked: true });

      expect(() => dashboard.moveWidget('a', 1, 1)).toThrow(
        'Widget with id "a" is locked and cannot be moved'
      );
    });

    it('cannot be resized', () => {
      const dashboard = new Dashboard({ columns: 4 });
      dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 1, locked: true });

      expect(() => dashboard.resizeWidget('a', 3, 2)).toThrow(
        'Widget with id "a" is locked and cannot be resized'
      );
    });

    it('cannot be removed', () => {
      const dashboard = new Dashboard({ columns: 4 });
      dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 1, locked: true });

      expect(() => dashboard.removeWidget('a')).toThrow(
        'Widget with id "a" is locked and cannot be removed'
      );
    });

    it('cannot be updated via updateWidget', () => {
      const dashboard = new Dashboard({ columns: 4 });
      dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 1, locked: true });

      expect(() =>
        dashboard.updateWidget({ id: 'a', type: 'kpi', x: 1, y: 0, w: 2, h: 1, locked: true })
      ).toThrow('Widget with id "a" is locked and cannot be modified');
    });

    it('collision resolves around locked widgets without moving them', () => {
      const dashboard = new Dashboard({ columns: 4 });
      dashboard.addWidget({ id: 'anchor', type: 'kpi', x: 0, y: 0, w: 4, h: 1, locked: true });
      const pushed = dashboard.addWidget({ id: 'b', type: 'kpi', x: 0, y: 0, w: 4, h: 1 });

      const anchor = dashboard.getWidgets().find((w) => w.id === 'anchor')!;
      expect(anchor.y).toBe(0);
      expect(pushed.y).toBe(1);
    });

    it('locked flag survives save and restore', async () => {
      const store = new Map<string, string>();
      const storage = {
        async save(key: string, value: string) { store.set(key, value); },
        async load(key: string) { return store.get(key) ?? null; }
      };

      const dashboard = new Dashboard({ storage });
      dashboard.addWidget({ id: 'a', type: 'kpi', x: 0, y: 0, w: 2, h: 1, locked: true });
      await dashboard.saveLayout('lock-test');

      dashboard.addWidget({ id: 'b', type: 'kpi', x: 0, y: 1, w: 2, h: 1 });
      await dashboard.restoreLayout('lock-test');

      const restored = dashboard.getWidgets().find((w) => w.id === 'a')!;
      expect(restored.locked).toBe(true);
    });

    it('addWidgetFromTemplate carries locked from template', () => {
      const dashboard = new Dashboard({
        columns: 4,
        widgetTemplates: [{ id: 'pinned-kpi', type: 'kpi', w: 2, h: 2, locked: true }]
      });

      const widget = dashboard.addWidgetFromTemplate('pinned-kpi', { id: 'p1', x: 0, y: 0 });
      expect(widget.locked).toBe(true);
      expect(() => dashboard.moveWidget('p1', 1, 0)).toThrow();
    });
  });
});
