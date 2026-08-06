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
