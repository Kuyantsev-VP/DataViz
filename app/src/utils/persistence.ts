import { get, set, del } from "idb-keyval";
import type { Series, ViewState } from "../types";

const KEY_SERIES = "dataviz_series";
const KEY_VIEW = "dataviz_view";

export interface SavedSession {
  series: Series[];
  view: ViewState;
}

export async function saveSession(
  series: Series[],
  view: ViewState,
): Promise<void> {
  await Promise.all([set(KEY_SERIES, series), set(KEY_VIEW, view)]);
}

export async function loadSession(): Promise<SavedSession | null> {
  const [series, view] = await Promise.all([
    get<Series[]>(KEY_SERIES),
    get<ViewState>(KEY_VIEW),
  ]);
  if (!series || !view || series.length === 0) return null;
  return { series, view };
}

export async function clearSession(): Promise<void> {
  await Promise.all([del(KEY_SERIES), del(KEY_VIEW)]);
}
