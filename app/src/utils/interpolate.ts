import type { Series } from "../types";

export interface TooltipEntry {
  seriesId: string;
  name: string;
  value: number | null;
  color: string;
  interpolated?: boolean;
}

/**
 * For each visible series, compute the linearly interpolated value at `time`.
 * Easily replaceable — swap this function to change tooltip logic.
 */
export function getTooltipValues(
  time: number,
  seriesList: Series[],
  seriesView: Record<string, { visible: boolean; color: string; xOffset?: number }>,
): TooltipEntry[] {
  const entries: TooltipEntry[] = [];

  for (const s of seriesList) {
    const sv = seriesView[s.id];
    if (!sv?.visible) continue;

    const localTime = time - (sv.xOffset ?? 0);
    const value = interpolateAt(localTime, s.time, s.values);
    if (value === null) continue;

    entries.push({
      seriesId: s.id,
      name: s.name,
      value,
      color: sv.color,
    });
  }

  return entries;
}

/**
 * Find the closest actual data-point time (in global coords) across all visible series.
 */
export function findClosestTime(
  cursorTime: number,
  seriesList: Series[],
  seriesView: Record<string, { visible: boolean; xOffset?: number }>,
): number | null {
  let best: number | null = null;
  let bestDist = Infinity;

  for (const s of seriesList) {
    const sv = seriesView[s.id];
    if (!sv?.visible) continue;
    const ofs = sv.xOffset ?? 0;
    const idx = closestIndex(cursorTime - ofs, s.time);
    if (idx === -1) continue;
    const globalT = s.time[idx] + ofs;
    const dist = Math.abs(globalT - cursorTime);
    if (dist < bestDist) {
      bestDist = dist;
      best = globalT;
    }
  }
  return best;
}

function closestIndex(t: number, time: number[]): number {
  if (time.length === 0) return -1;
  if (t <= time[0]) return 0;
  if (t >= time[time.length - 1]) return time.length - 1;
  let lo = 0;
  let hi = time.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (time[mid] <= t) lo = mid;
    else hi = mid;
  }
  return (t - time[lo] <= time[hi] - t) ? lo : hi;
}

/**
 * Snap-mode tooltip: values at the snapped time.
 * Exact matches are unmarked; interpolated values get `interpolated: true`.
 */
export function getSnapTooltipValues(
  snappedTime: number,
  seriesList: Series[],
  seriesView: Record<string, { visible: boolean; color: string; xOffset?: number }>,
): TooltipEntry[] {
  const entries: TooltipEntry[] = [];

  for (const s of seriesList) {
    const sv = seriesView[s.id];
    if (!sv?.visible) continue;

    const localT = snappedTime - (sv.xOffset ?? 0);
    if (localT < s.time[0] || localT > s.time[s.time.length - 1]) continue;

    const idx = closestIndex(localT, s.time);
    const exact = s.time[idx] === localT;

    if (exact) {
      const v = s.values[idx];
      entries.push({ seriesId: s.id, name: s.name, value: v, color: sv.color });
    } else {
      const v = interpolateAt(localT, s.time, s.values);
      entries.push({ seriesId: s.id, name: s.name, value: v, color: sv.color, interpolated: true });
    }
  }
  return entries;
}

function interpolateAt(
  t: number,
  time: number[],
  values: (number | null)[],
): number | null {
  if (time.length === 0) return null;
  if (t < time[0] || t > time[time.length - 1]) return null;

  let lo = 0;
  let hi = time.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (time[mid] <= t) lo = mid;
    else hi = mid;
  }

  const v0 = values[lo];
  const v1 = values[hi];
  if (v0 === null || v1 === null) return v0 ?? v1;

  const frac = (t - time[lo]) / (time[hi] - time[lo]);
  return v0 + (v1 - v0) * frac;
}
