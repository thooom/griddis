import { DashboardWidget } from '../types';

export interface DashboardPlugin {
  type: string;
  initialize?(widget: DashboardWidget): DashboardWidget;
}

export class PluginManager {
  private plugins = new Map<string, DashboardPlugin>();

  register(plugin: DashboardPlugin): void {
    this.plugins.set(plugin.type, plugin);
  }

  apply(widget: DashboardWidget): DashboardWidget {
    const plugin = this.plugins.get(widget.type);
    if (!plugin?.initialize) return widget;
    return plugin.initialize(widget);
  }
}
