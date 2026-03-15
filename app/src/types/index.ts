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

/** Per-series display settings. Keyed by Series.id in ViewState. */
export interface SeriesViewState {
  yRange: AxisRange;
  yOffset: number;
  xOffset: number;
  visible: boolean;
  scaleVisible: boolean;
  color: string;
}

/** Display state of the app. Serialized for session save/restore. */
export interface ViewState {
  xRange: AxisRange | null;
  seriesView: Record<string, SeriesViewState>;
  theme: Theme;
  notes: string;
  tooltipAlwaysOn: boolean;
  yOffsetLocked: boolean;
  snapToClosest: boolean;
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
