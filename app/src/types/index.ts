export interface Series {
  id: string;
  name: string;
  time: number[];  // sorted, unique
  values: (number | null)[];
  dataMin: number;
  dataMax: number;
}

export interface DataSet {
  name: string;
  series: Series[];
}

export interface AxisRange {
  min: number;
  max: number;
}

export interface ViewState {
  xRange: AxisRange;
  yRanges: Record<string, AxisRange>;
  visibility: Record<string, boolean>;
  colors: Record<string, string>;
  theme: Theme;
}

export type Theme = "light" | "dark";

export interface SessionSettings {
  viewState: ViewState;
}

/**
 * Data merged from several datasets.
 * Aligned to a single merged time axis for uPlot consumption.
 * `values[i]` corresponds to `seriesIds[i]`.
 * Gaps are represented as `null`.
 */
export interface AlignedData {
  time: number[];
  values: ((number | null)[])[];
  seriesIds: string[];
}
