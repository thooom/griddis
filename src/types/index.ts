export type Compaction = 'vertical' | 'none';

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ResizeRect extends GridRect {
  id: string;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface ResizeCollisionOptions<T extends ResizeRect = ResizeRect> {
  columns: number;
  rows?: number;
  immovable?: ReadonlySet<string> | ((widget: Readonly<T>) => boolean);
}

export type ResizeResult<T extends ResizeRect = DashboardWidget> =
  | { success: true; widget: T; widgets: T[] }
  | {
      success: false;
      blockerId: string;
      reason: 'bounds' | 'minimum-size' | 'immovable' | 'iteration-limit' | 'invalid-layout';
    };

export interface DashboardWidget {
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
  locked?: boolean;
  data?: unknown;
}

export interface DashboardDimensions {
  columns: number;
  rows?: number;
}

export interface WidgetTemplate {
  id: string;
  type: string;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  locked?: boolean;
  label?: string;
  /** Allowed sizes for this template keyed by breakpoint key (e.g. "desktop", "tablet", "mobile"). When present for the active breakpoint, these take priority over the global w/h. */
  breakpointSizes?: Record<string, Array<{ w: number; h: number }>>;
}

export interface AddWidgetFromTemplateOptions {
  id?: string;
  x?: number;
  y?: number;
  type?: string;
  data?: unknown;
}

export interface LayoutScope {
  appId: string;
  userId: string;
  breakpointKey?: string;
  layoutId?: string;
  namespace?: string;
}

export interface ResponsiveBreakpoint {
  key: string;
  minWidth: number;
  columns: number;
  rows?: number;
}

export type DashboardEvents = {
  widgetAdded: DashboardWidget;
  widgetUpdated: DashboardWidget;
  widgetRemoved: DashboardWidget;
  layoutChanged: DashboardWidget[];
};
