import { GridRect, ResizeCollisionOptions, ResizeRect, ResizeResult } from '../types';

type Direction = 'east' | 'west' | 'south' | 'north';

function collides(first: GridRect, second: GridRect): boolean {
  return first.x < second.x + second.w && second.x < first.x + first.w &&
    first.y < second.y + second.h && second.y < first.y + first.h;
}

export function resolveResize<T extends ResizeRect>(
  widget: T,
  rect: GridRect,
  widgets: readonly T[],
  options: ResizeCollisionOptions<T>
): ResizeResult<T> {
  const resized = { ...widget, ...rect };
  const reject = (blockerId: string, reason: Extract<ResizeResult<T>, { success: false }>['reason']): ResizeResult<T> =>
    ({ success: false, blockerId, reason });
  const isImmovable = (item: T): boolean => typeof options.immovable === 'function'
    ? options.immovable(item)
    : options.immovable?.has(item.id) ?? false;
  const inBounds = (item: GridRect): boolean =>
    [item.x, item.y, item.w, item.h].every(Number.isSafeInteger) &&
    item.x >= 0 && item.y >= 0 && item.w >= 1 && item.h >= 1 &&
    item.x + item.w <= options.columns &&
    (options.rows === undefined || item.y + item.h <= options.rows);
  const withinMinimum = (item: T): boolean => item.w >= (item.minW ?? 1) && item.h >= (item.minH ?? 1);

  if (!Number.isSafeInteger(options.columns) || options.columns < 1 ||
    (options.rows !== undefined && (!Number.isSafeInteger(options.rows) || options.rows < 1)) ||
    !inBounds(resized)) return reject(widget.id, 'bounds');
  if (!withinMinimum(resized)) return reject(widget.id, 'minimum-size');
  if (resized.w > (widget.maxW ?? Infinity) || resized.h > (widget.maxH ?? Infinity)) {
    return reject(widget.id, 'bounds');
  }
  if (isImmovable(widget)) return reject(widget.id, 'immovable');

  let state = widgets.map((item) => ({ ...item }));
  if (new Set(state.map((item) => item.id)).size !== state.length ||
    !state.some((item) => item.id === widget.id)) return reject(widget.id, 'invalid-layout');
  for (const item of state) {
    if (!inBounds(item) || !withinMinimum(item)) return reject(item.id, 'invalid-layout');
  }
  state = state.map((item) => item.id === widget.id ? resized : item);
  const ordered = (items: T[]): T[] => [...items].sort((first, second) =>
    first.y - second.y || first.x - second.x || (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));
  const directions: Direction[] = [];
  if (rect.x < widget.x) directions.push('west');
  if (rect.x + rect.w > widget.x + widget.w) directions.push('east');
  if (rect.y < widget.y) directions.push('north');
  if (rect.y + rect.h > widget.y + widget.h) directions.push('south');

  let remaining = Math.max(128, Math.min(10000, state.length * state.length * 16));
  const place = (source: T, target: T, direction: Direction, current: T[], path: ReadonlySet<string>): ResizeResult<T> => {
    remaining -= 1;
    if (remaining < 0 || path.size >= 128 || path.has(target.id)) return reject(target.id, 'iteration-limit');
    if (target.id === widget.id || isImmovable(target)) return reject(target.id, 'immovable');
    const horizontal = direction === 'east' || direction === 'west';
    const positive = direction === 'east' || direction === 'south';
    const position = horizontal ? 'x' : 'y';
    const size = horizontal ? 'w' : 'h';
    const edge = positive ? source[position] + source[size] : source[position];
    const displaced = { ...target, [position]: positive ? edge : edge - target[size] };
    const nextPath = new Set([...path, target.id]);

    const attempt = (candidate: T): ResizeResult<T> => {
      if (!inBounds(candidate)) return reject(target.id, 'bounds');
      if (!withinMinimum(candidate)) return reject(target.id, 'minimum-size');
      let next = current.map((item) => item.id === target.id ? candidate : item);
      for (const other of ordered(next)) {
        const latest = next.find((item) => item.id === other.id)!;
        if (latest.id === candidate.id || !collides(candidate, latest)) continue;
        const result = place(candidate, latest, direction, next, nextPath);
        if (!result.success) return result;
        next = result.widgets;
      }
      return { success: true, widget: resized, widgets: next };
    };

    const pushed = attempt(displaced);
    if (pushed.success) return pushed;
    if (remaining < 0) return reject(target.id, 'iteration-limit');

    let boundary = positive ? (horizontal ? options.columns : options.rows ?? Infinity) : 0;
    for (const other of current) {
      if (other.id === target.id || other.id === source.id) continue;
      const crossPosition = horizontal ? 'y' : 'x';
      const crossSize = horizontal ? 'h' : 'w';
      if (target[crossPosition] >= other[crossPosition] + other[crossSize] ||
        other[crossPosition] >= target[crossPosition] + target[crossSize]) continue;
      if (positive && other[position] >= edge) boundary = Math.min(boundary, other[position]);
      if (!positive && other[position] + other[size] <= edge) boundary = Math.max(boundary, other[position] + other[size]);
    }
    const available = positive ? boundary - edge : edge - boundary;
    const length = Math.min(target[size], available);
    if (length >= target[size]) return pushed;
    const shrunk = { ...target, [position]: positive ? edge : edge - length, [size]: length };
    if (!withinMinimum(shrunk)) {
      return pushed.reason === 'immovable' || pushed.reason === 'iteration-limit'
        ? pushed : reject(target.id, 'minimum-size');
    }
    return attempt(shrunk);
  };

  for (const other of ordered(state)) {
    const target = state.find((item) => item.id === other.id)!;
    if (target.id === widget.id || !collides(resized, target)) continue;
    const candidates = directions.length ? directions : [
      target.x + target.w / 2 >= resized.x + resized.w / 2 ? 'east' : 'west',
      target.y + target.h / 2 >= resized.y + resized.h / 2 ? 'south' : 'north'
    ] as Direction[];
    let result: ResizeResult<T> = reject(target.id, 'invalid-layout');
    for (const direction of candidates) {
      result = place(resized, target, direction, state, new Set([widget.id]));
      if (result.success) break;
    }
    if (!result.success) return result;
    state = result.widgets;
  }
  for (const first of ordered(state)) {
    const overlap = ordered(state).find((second) => first.id !== second.id && collides(first, second));
    if (overlap) return reject(overlap.id, 'invalid-layout');
  }
  return { success: true, widget: resized, widgets: state };
}