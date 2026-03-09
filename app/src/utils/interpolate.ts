import type { Series } from "../types";

export interface TooltipEntry {
  seriesId: string;
  name: string;
  value: number | null;
  color: string;
}

/**
 * For each visible series, compute the linearly interpolated value at `time`.
 * Easily replaceable — swap this function to change tooltip logic.
 */
export function getTooltipValues(
  time: number,
  seriesList: Series[],
  seriesView: Record<string, { visible: boolean; color: string }>,
): TooltipEntry[] {
  const entries: TooltipEntry[] = [];

  for (const s of seriesList) {
    const sv = seriesView[s.id];
    if (!sv?.visible) continue;

    const value = interpolateAt(time, s.time, s.values);
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
