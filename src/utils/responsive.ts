import { ResponsiveBreakpoint } from '../types';

export function resolveResponsiveBreakpoint(
  width: number,
  breakpoints: ResponsiveBreakpoint[]
): ResponsiveBreakpoint {
  if (breakpoints.length === 0) {
    throw new Error('At least one responsive breakpoint is required');
  }

  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
  return sorted.find((breakpoint) => width >= breakpoint.minWidth) ?? sorted[sorted.length - 1];
}
