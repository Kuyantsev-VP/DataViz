import {
  createContext,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { AxisRange, Series, SeriesViewState, Theme, ViewState } from "../types";
import { SERIES_COLORS } from "../constants";

interface AppState {
  series: Series[];
  view: ViewState;
}

type Action =
  | { type: "ADD_SERIES"; payload: Series[] }
  | { type: "SET_X_RANGE"; payload: AxisRange }
  | { type: "RESET_X_RANGE" }
  | { type: "SET_Y_RANGE"; payload: { id: string; range: AxisRange } }
  | { type: "RESET_Y_RANGE"; payload: string }
  | { type: "SET_VISIBILITY"; payload: { id: string; visible: boolean } }
  | { type: "SET_SCALE_VISIBILITY"; payload: { id: string; scaleVisible: boolean } }
  | { type: "SET_Y_OFFSET"; payload: { id: string; offset: number } }
  | { type: "SET_COLOR"; payload: { id: string; color: string } }
  | { type: "SET_THEME"; payload: Theme }
  | { type: "SET_NOTES"; payload: string }
  | { type: "SET_TOOLTIP_ALWAYS_ON"; payload: boolean }
  | { type: "RENAME_SERIES"; payload: { id: string; name: string } }
  | { type: "CLEAR_ALL" };

function computeGlobalXRange(series: Series[]): AxisRange | null {
  if (series.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    if (s.time.length === 0) continue;
    min = Math.min(min, s.time[0]);
    max = Math.max(max, s.time[s.time.length - 1]);
  }
  return min <= max ? { min, max } : null;
}

function updateSeriesView(
  view: ViewState,
  id: string,
  patch: Partial<SeriesViewState>,
): ViewState {
  return {
    ...view,
    seriesView: {
      ...view.seriesView,
      [id]: { ...view.seriesView[id], ...patch },
    },
  };
}

const initialView: ViewState = {
  xRange: null,
  seriesView: {},
  theme: "light",
  notes: "",
  tooltipAlwaysOn: false,
};

const initialState: AppState = {
  series: [],
  view: { ...initialView },
};

function reducer(state: AppState, action: Action): AppState {
  const { view } = state;

  switch (action.type) {
    case "ADD_SERIES": {
      const newSeries = action.payload;
      const allSeries = [...state.series, ...newSeries];
      const colorBase = state.series.length;

      const seriesView = { ...view.seriesView };
      newSeries.forEach((s, i) => {
        seriesView[s.id] = {
          yRange: { min: s.dataMin, max: s.dataMax },
          yOffset: 0,
          visible: true,
          scaleVisible: true,
          color: SERIES_COLORS[(colorBase + i) % SERIES_COLORS.length],
        };
      });

      return {
        ...state,
        series: allSeries,
        view: {
          ...view,
          xRange: computeGlobalXRange(allSeries),
          seriesView,
        },
      };
    }

    case "SET_X_RANGE":
      return { ...state, view: { ...view, xRange: action.payload } };

    case "RESET_X_RANGE":
      return {
        ...state,
        view: { ...view, xRange: computeGlobalXRange(state.series) },
      };

    case "SET_Y_RANGE":
      return {
        ...state,
        view: updateSeriesView(view, action.payload.id, {
          yRange: action.payload.range,
        }),
      };

    case "RESET_Y_RANGE": {
      const s = state.series.find((s) => s.id === action.payload);
      if (!s) return state;
      return {
        ...state,
        view: updateSeriesView(view, action.payload, {
          yRange: { min: s.dataMin, max: s.dataMax },
          yOffset: 0,
        }),
      };
    }

    case "SET_Y_OFFSET":
      return {
        ...state,
        view: updateSeriesView(view, action.payload.id, {
          yOffset: action.payload.offset,
        }),
      };

    case "SET_VISIBILITY":
      return {
        ...state,
        view: updateSeriesView(view, action.payload.id, {
          visible: action.payload.visible,
        }),
      };

    case "SET_SCALE_VISIBILITY":
      return {
        ...state,
        view: updateSeriesView(view, action.payload.id, {
          scaleVisible: action.payload.scaleVisible,
        }),
      };

    case "SET_COLOR":
      return {
        ...state,
        view: updateSeriesView(view, action.payload.id, {
          color: action.payload.color,
        }),
      };

    case "SET_THEME":
      return { ...state, view: { ...view, theme: action.payload } };

    case "SET_NOTES":
      return { ...state, view: { ...view, notes: action.payload } };

    case "SET_TOOLTIP_ALWAYS_ON":
      return { ...state, view: { ...view, tooltipAlwaysOn: action.payload } };

    case "RENAME_SERIES": {
      const { id, name } = action.payload;
      return {
        ...state,
        series: state.series.map((s) =>
          s.id === id ? { ...s, name } : s,
        ),
      };
    }

    case "CLEAR_ALL":
      return { series: [], view: { ...initialView } };

    default:
      return state;
  }
}

interface AppActions {
  addSeries: (series: Series[]) => void;
  setXRange: (range: AxisRange) => void;
  resetXRange: () => void;
  setYRange: (id: string, range: AxisRange) => void;
  resetYRange: (id: string) => void;
  setYOffset: (id: string, offset: number) => void;
  setVisibility: (id: string, visible: boolean) => void;
  setScaleVisibility: (id: string, scaleVisible: boolean) => void;
  setColor: (id: string, color: string) => void;
  setTheme: (theme: Theme) => void;
  setNotes: (text: string) => void;
  setTooltipAlwaysOn: (on: boolean) => void;
  renameSeries: (id: string, name: string) => void;
  clearAll: () => void;
}

const StateContext = createContext<AppState>(initialState);
const ActionsContext = createContext<AppActions | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo<AppActions>(
    () => ({
      addSeries: (s) => dispatch({ type: "ADD_SERIES", payload: s }),
      setXRange: (r) => dispatch({ type: "SET_X_RANGE", payload: r }),
      resetXRange: () => dispatch({ type: "RESET_X_RANGE" }),
      setYRange: (id, range) =>
        dispatch({ type: "SET_Y_RANGE", payload: { id, range } }),
      resetYRange: (id) => dispatch({ type: "RESET_Y_RANGE", payload: id }),
      setYOffset: (id, offset) =>
        dispatch({ type: "SET_Y_OFFSET", payload: { id, offset } }),
      setVisibility: (id, visible) =>
        dispatch({ type: "SET_VISIBILITY", payload: { id, visible } }),
      setScaleVisibility: (id, scaleVisible) =>
        dispatch({ type: "SET_SCALE_VISIBILITY", payload: { id, scaleVisible } }),
      setColor: (id, color) =>
        dispatch({ type: "SET_COLOR", payload: { id, color } }),
      setTheme: (t) => dispatch({ type: "SET_THEME", payload: t }),
      setNotes: (text) => dispatch({ type: "SET_NOTES", payload: text }),
      setTooltipAlwaysOn: (on) =>
        dispatch({ type: "SET_TOOLTIP_ALWAYS_ON", payload: on }),
      renameSeries: (id, name) =>
        dispatch({ type: "RENAME_SERIES", payload: { id, name } }),
      clearAll: () => dispatch({ type: "CLEAR_ALL" }),
    }),
    [],
  );

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}

export function useAppActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx)
    throw new Error("useAppActions must be used within AppStoreProvider");
  return ctx;
}

/** Derived: set of existing series names (for CSV dedup). */
export function useExistingNames() {
  const { series } = useAppState();
  return useMemo(() => new Set(series.map((s) => s.name)), [series]);
}

/** Derived: default X range from all data. */
export function useDataXRange() {
  const { series } = useAppState();
  return useMemo(() => computeGlobalXRange(series), [series]);
}
