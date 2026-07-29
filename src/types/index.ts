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
  label?: string;
}

export interface AddWidgetFromTemplateOptions {
  id?: string;
  x?: number;
  y?: number;
  type?: string;
  data?: unknown;
}

export type DashboardEvents = {
  widgetAdded: DashboardWidget;
  widgetUpdated: DashboardWidget;
  widgetRemoved: DashboardWidget;
  layoutChanged: DashboardWidget[];
};
