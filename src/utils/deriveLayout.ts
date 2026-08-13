import { DashboardWidget, WidgetTemplate } from '../types';

export interface DeriveLayoutOptions {
  /**
   * When true, locked widgets are re-packed like regular widgets during
   * derivation (their `locked` flag is preserved). This is useful for strict
   * mobile/tablet compaction where every new row should start from the left.
   *
   * Default: false (locked widgets keep explicit x/y anchors).
   */
  repackLocked?: boolean;
}

/**
 * Given a set of widgets from one breakpoint, derives a sensible layout for a
 * different breakpoint by remapping each widget to the closest allowed size for
 * that breakpoint, then packing the results into the target column count.
 *
 * If a widget type has `breakpointSizes[targetBreakpointKey]` on any of its
 * templates, those sizes are used exclusively. Otherwise the function falls
 * back to the global sizes declared on the templates (w/h pairs).
 *
 * Widgets keep their relative visual order (top-left to bottom-right) and are
 * re-packed greedily from the top-left corner of the target grid.
 */
export function deriveLayoutForBreakpoint(
  widgets: DashboardWidget[],
  targetBreakpointKey: string,
  templates: WidgetTemplate[],
  targetColumns: number,
  options: DeriveLayoutOptions = {}
): DashboardWidget[] {
  const repackLocked = options.repackLocked ?? false;
  const allowedByType = buildAllowedSizes(templates, targetBreakpointKey, targetColumns);

  // Preserve visual reading order (y then x), locked widgets first so they act
  // as anchors in the re-pack step.
  const ordered = [...widgets].sort((a, b) => {
    if (!repackLocked) {
      if (a.locked && !b.locked) return -1;
      if (!a.locked && b.locked) return 1;
    }
    return a.y - b.y || a.x - b.x;
  });

  const remapped = ordered.map((widget) => {
    if (widget.locked && !repackLocked) {
      // Locked widgets keep their size but get clamped to targetColumns.
      const w = Math.min(widget.w, targetColumns);
      return { ...widget, w, x: Math.min(widget.x, targetColumns - w) };
    }

    const allowed = allowedByType.get(widget.type) ?? [];
    const { w, h } = pickBestSize(widget, allowed, targetColumns);
    return { ...widget, w, h };
  });

  return packWidgets(remapped, targetColumns, repackLocked);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildAllowedSizes(
  templates: WidgetTemplate[],
  breakpointKey: string,
  maxColumns: number
): Map<string, Array<{ w: number; h: number }>> {
  const map = new Map<string, Array<{ w: number; h: number }>>();

  for (const t of templates) {
    if (!map.has(t.type)) map.set(t.type, []);

    const bpSizes = t.breakpointSizes?.[breakpointKey];
    const sources: Array<{ w: number; h: number }> = bpSizes && bpSizes.length > 0
      ? bpSizes
      : [{ w: t.w, h: t.h }];

    const list = map.get(t.type)!;
    for (const s of sources) {
      if (s.w <= maxColumns && !list.some((e) => e.w === s.w && e.h === s.h)) {
        list.push(s);
      }
    }
  }

  return map;
}

function pickBestSize(
  widget: DashboardWidget,
  allowed: Array<{ w: number; h: number }>,
  maxColumns: number
): { w: number; h: number } {
  const fits = allowed.filter((s) => s.w <= maxColumns);

  if (fits.length === 0) {
    // No template sizes fit — clamp to column width, preserve height.
    return { w: Math.min(widget.w, maxColumns), h: widget.h };
  }

  // Prefer size whose area is closest to the original widget area. Break ties
  // by preferring wider sizes (more horizontal weight = more visually important).
  const originalArea = widget.w * widget.h;
  return fits.reduce((best, s) => {
    const bestDiff = Math.abs(best.w * best.h - originalArea);
    const sDiff = Math.abs(s.w * s.h - originalArea);
    if (sDiff < bestDiff) return s;
    if (sDiff === bestDiff && s.w > best.w) return s;
    return best;
  });
}

function packWidgets(
  widgets: DashboardWidget[],
  columns: number,
  repackLocked: boolean
): DashboardWidget[] {
  const placed: DashboardWidget[] = [];

  for (const widget of widgets) {
    if (widget.locked && !repackLocked) {
      // Locked widgets keep their explicit position.
      placed.push(widget);
      continue;
    }

    const position = findFirstFit(widget.w, widget.h, placed, columns);
    placed.push({ ...widget, x: position.x, y: position.y });
  }

  return placed;
}

function findFirstFit(
  w: number,
  h: number,
  placed: DashboardWidget[],
  columns: number
): { x: number; y: number } {
  const maxY = placed.reduce((acc, p) => Math.max(acc, p.y + p.h), 0) + h;

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= columns - w; x++) {
      const candidate = { id: '__probe__', type: '', x, y, w, h };
      const blocked = placed.some((p) => overlaps(candidate, p));
      if (!blocked) return { x, y };
    }
  }

  // Fallback — should never be reached for a valid grid.
  return { x: 0, y: maxY };
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
