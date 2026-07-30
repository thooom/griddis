# griddis

A modern, framework-agnostic TypeScript dashboard widget system with draggable and resizable grid widgets.

This repository includes a tactile, ANTP-inspired demo board (wood background, floating cards, add-widget panel) so the package and its intended UX direction are visible together. Widgets are moved with drag and drop rather than directional move buttons.

## Features

- Grid-based layout engine
- Drag-and-drop widget movement API
- Widget resizing API
- Snap-to-grid positioning
- Collision detection and resolution
- Configurable grid dimensions (columns and optional row bounds)
- Template-based widget catalog controlled by the consuming project
- Save and restore layouts as JSON
- Event system for widget and layout updates
- Plugin architecture for custom widget behavior
- Strong TypeScript typing and modular public API

## Installation

```bash
npm install griddis
```

## Quick Start

```ts
import { Dashboard } from 'griddis';

const dashboard = new Dashboard({
  columns: 12,
  rows: 10,
  widgetTemplates: [
    { id: 'kpi-1x1', type: 'kpi', w: 1, h: 1, label: 'KPI 1x1' },
    { id: 'graph-2x2', type: 'graph', w: 2, h: 2, label: 'Graph 2x2' },
    { id: 'list-4x2', type: 'list', w: 4, h: 2, label: 'List 4x2' }
  ]
});

dashboard.registerPlugin('chart', (widget) => ({
  ...widget,
  data: widget.data ?? { title: 'New Chart' }
}));

dashboard.on('layoutChanged', (layout) => {
  console.log('Layout updated', layout);
});

// Adds an empty widget with size taken from the registered template.
dashboard.addWidgetFromTemplate('graph-2x2', {
  id: 'widget-1',
  x: 0,
  y: 0
});
```

The consuming project decides which templates exist and what each size/type means.
For example: 1x1, 1x2, and 1x3 as KPI tiles; 2x2 and 2x3 as graphs; 4x2 as lists.
The package only enforces layout behavior and sizing.

## Responsive Columns

Responsive column counts are controlled by the consuming project. The package provides `setColumns` / `setDimensions`; your app decides the breakpoints.

```ts
import { Dashboard } from 'griddis';

const dashboard = new Dashboard({ columns: 9 });

// Project-defined breakpoint policy (example only).
const responsiveColumns = [
  { minWidth: 1280, columns: 9 },
  { minWidth: 768, columns: 6 },
  { minWidth: 0, columns: 3 }
];

function applyResponsiveColumns() {
  const width = window.innerWidth;
  const match = responsiveColumns.find((entry) => width >= entry.minWidth);
  dashboard.setColumns(match?.columns ?? 3);
}

window.addEventListener('resize', applyResponsiveColumns);
applyResponsiveColumns();
```

When columns shrink, the dashboard reflows widgets to stay within bounds and avoid overlap.

## Widget Model

```ts
interface DashboardWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  data?: unknown;
}

interface WidgetTemplate {
  id: string;
  type: string;
  w: number;
  h: number;
  label?: string;
}

interface DashboardDimensions {
  columns: number;
  rows?: number;
}
```

## Project Structure

```text
src/
  core/
    Dashboard.ts
    Widget.ts
    Layout.ts
  grid/
    GridEngine.ts
    CollisionEngine.ts
    DragManager.ts
    ResizeManager.ts
  events/
    EventBus.ts
  storage/
    StorageAdapter.ts
    MemoryStorage.ts
  plugins/
    PluginManager.ts
  types/
    index.ts
  utils/
```

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

## Demo App

A local consumer app lives in `demo/` so you can test the package as an npm dependency during development.

The demo is intentionally styled to resemble a tactile browser start-page dashboard and exercises package APIs through UI actions:

- Add and remove widgets
- Drag and resize selected widgets
- Save and restore layout
- Reset to a seeded reference layout

```bash
npm run build
npm run demo:install
npm run demo:dev
```

For a production-style check of the demo consumer:

```bash
npm run demo:build
```

If this build succeeds, your package exports and runtime integration are valid in a real app context.

## License

MIT
