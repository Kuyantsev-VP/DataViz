import type { AlignedData, Series } from "../types";

/**
 * Merge multiple series (potentially with different time arrays)
 * into a single aligned dataset for uPlot.
 *
 * Uses sorted merge-join — O(N) per series where N = merged time length.
 */
export function alignData(seriesList: Series[]): AlignedData {
  if (seriesList.length === 0) {
    return { time: [], values: [], seriesIds: [] };
  }

  const mergedTime = mergeTimelines(seriesList.map((s) => s.time));

  const values = seriesList.map((s) => {
    if (s.time === mergedTime || s.time.length === mergedTime.length) {
      const allMatch = s.time.length === mergedTime.length &&
        s.time.every((t, i) => t === mergedTime[i]);
      if (allMatch) return s.values;
    }
    return alignValues(mergedTime, s.time, s.values);
  });

  return {
    time: mergedTime,
    values,
    seriesIds: seriesList.map((s) => s.id),
  };
}

/** Merge multiple sorted arrays into one sorted array of unique values. */
function mergeTimelines(timelines: number[][]): number[] {
  if (timelines.length === 0) return [];
  if (timelines.length === 1) return timelines[0];

  let merged = timelines[0];
  for (let i = 1; i < timelines.length; i++) {
    merged = mergeTwoSorted(merged, timelines[i]);
  }
  return merged;
}

function mergeTwoSorted(a: number[], b: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) {
      result.push(a[i++]);
    } else if (a[i] > b[j]) {
      result.push(b[j++]);
    } else {
      result.push(a[i++]);
      j++;
    }
  }

  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);

  return result;
}

/**
 * Align a series' values to the merged time axis.
 * Both `mergedTime` and `seriesTime` must be sorted.
 * Returns null for time points absent in the series.
 */
function alignValues(
  mergedTime: number[],
  seriesTime: number[],
  seriesValues: (number | null)[],
): (number | null)[] {
  const result: (number | null)[] = new Array(mergedTime.length);
  let j = 0;

  for (let i = 0; i < mergedTime.length; i++) {
    if (j < seriesTime.length && seriesTime[j] === mergedTime[i]) {
      result[i] = seriesValues[j];
      j++;
    } else {
      result[i] = null;
    }
  }

  return result;
}
