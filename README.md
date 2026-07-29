# griddis

A modern, framework-agnostic TypeScript dashboard widget system with draggable and resizable grid widgets.

This repository includes a tactile, ANTP-inspired demo board (wood background, floating cards, add-widget panel) so the package and its intended UX direction are visible together. Widgets are moved with drag and drop rather than directional move buttons.

## Features

- Grid-based layout engine
- Drag-and-drop widget movement API
- Widget resizing API
- Snap-to-grid positioning
- Collision detection and resolution
- Configurable column count
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

const dashboard = new Dashboard({ columns: 12 });

dashboard.registerPlugin('chart', (widget) => ({
  ...widget,
  data: widget.data ?? { title: 'New Chart' }
}));

dashboard.on('layoutChanged', (layout) => {
  console.log('Layout updated', layout);
});

dashboard.addWidget({
  id: 'widget-1',
  type: 'chart',
  x: 0,
  y: 0,
  w: 4,
  h: 3
});
```

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
