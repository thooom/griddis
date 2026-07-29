# griddis

A modern, framework-agnostic TypeScript dashboard widget system with draggable and resizable grid widgets.

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

## License

MIT
