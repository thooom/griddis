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

export type DashboardEvents = {
  widgetAdded: DashboardWidget;
  widgetUpdated: DashboardWidget;
  widgetRemoved: DashboardWidget;
  layoutChanged: DashboardWidget[];
};
