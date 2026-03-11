import JSZip from "jszip";
import Papa from "papaparse";
import type { Series, ViewState, SeriesViewState } from "../types";
import type { SavedSession } from "./persistence";

interface SessionJson {
  dataFile: string;
  notesFile: string;
  xRange: ViewState["xRange"];
  seriesSettings: Record<
    string,
    {
      yRange: SeriesViewState["yRange"];
      yOffset: number;
      visible: boolean;
      scaleVisible: boolean;
      color: string;
    }
  >;
  theme: ViewState["theme"];
  tooltipAlwaysOn: boolean;
}

/**
 * Merge all series into a single CSV string.
 * Columns: Time, <series1.name>, <series2.name>, ...
 * Rows aligned on merged time axis; gaps left empty.
 */
function buildMergedCsv(series: Series[]): string {
  const timeSet = new Set<number>();
  for (const s of series) {
    for (const t of s.time) timeSet.add(t);
  }
  const mergedTime = Array.from(timeSet).sort((a, b) => a - b);

  const timeMaps: Map<number, number | null>[] = series.map((s) => {
    const m = new Map<number, number | null>();
    for (let i = 0; i < s.time.length; i++) {
      m.set(s.time[i], s.values[i]);
    }
    return m;
  });

  const header = ["Time", ...series.map((s) => s.name)];
  const rows = mergedTime.map((t) => {
    const row: (string | number)[] = [t];
    for (const m of timeMaps) {
      const v = m.get(t);
      row.push(v != null ? v : "");
    }
    return row;
  });

  return Papa.unparse({ fields: header, data: rows });
}

export async function exportSession(
  series: Series[],
  view: ViewState,
): Promise<void> {
  const zip = new JSZip();

  const csvStr = buildMergedCsv(series);
  zip.file("data.csv", csvStr);

  zip.file("notes.txt", view.notes);

  const seriesSettings: SessionJson["seriesSettings"] = {};
  for (const s of series) {
    const sv = view.seriesView[s.id];
    if (!sv) continue;
    seriesSettings[s.name] = {
      yRange: sv.yRange,
      yOffset: sv.yOffset,
      visible: sv.visible,
      scaleVisible: sv.scaleVisible,
      color: sv.color,
    };
  }

  const sessionJson: SessionJson = {
    dataFile: "data.csv",
    notesFile: "notes.txt",
    xRange: view.xRange,
    seriesSettings,
    theme: view.theme,
    tooltipAlwaysOn: view.tooltipAlwaysOn,
  };

  zip.file("session.json", JSON.stringify(sessionJson, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dataviz-session.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importSession(file: File): Promise<SavedSession> {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const sessionFile = zip.file("session.json");
  if (!sessionFile) {
    throw new Error("session.json not found in archive");
  }
  const sessionRaw = await sessionFile.async("string");
  let sessionJson: SessionJson;
  try {
    sessionJson = JSON.parse(sessionRaw);
  } catch {
    throw new Error("Invalid session.json");
  }

  const dataFileName = sessionJson.dataFile || "data.csv";
  const dataFile = zip.file(dataFileName);
  if (!dataFile) {
    throw new Error(`${dataFileName} not found in archive`);
  }
  const csvText = await dataFile.async("string");

  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(
      `CSV parse error: ${parsed.errors[0].message} (row ${parsed.errors[0].row})`,
    );
  }

  const fields = parsed.meta.fields;
  if (!fields || !fields.includes("Time")) {
    throw new Error('data.csv must contain a "Time" column');
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    throw new Error("data.csv has no data rows");
  }

  const time = rows.map((r) => r["Time"] as number);
  const dataColumns = fields.filter((f) => f !== "Time");

  const series: Series[] = dataColumns.map((col, i) => {
    const seriesTime: number[] = [];
    const seriesValues: (number | null)[] = [];

    for (let j = 0; j < rows.length; j++) {
      const v = rows[j][col];
      if (typeof v === "number" && isFinite(v)) {
        seriesTime.push(time[j]);
        seriesValues.push(v);
      } else if (v === "" || v === null || v === undefined) {
        // gap — skip this time point for this series
      } else {
        seriesTime.push(time[j]);
        seriesValues.push(null);
      }
    }

    const numericValues = seriesValues.filter((v): v is number => v !== null);
    const dataMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;

    return {
      id: `${col}_${Date.now()}_${i}`,
      name: col,
      time: seriesTime,
      values: seriesValues,
      dataMin,
      dataMax,
    };
  });

  const seriesView: ViewState["seriesView"] = {};
  for (const s of series) {
    const saved = sessionJson.seriesSettings?.[s.name];
    seriesView[s.id] = saved
      ? {
          yRange: saved.yRange,
          yOffset: saved.yOffset ?? 0,
          visible: saved.visible ?? true,
          scaleVisible: saved.scaleVisible ?? true,
          color: saved.color ?? "#4e79a7",
        }
      : {
          yRange: { min: s.dataMin, max: s.dataMax },
          yOffset: 0,
          visible: true,
          scaleVisible: true,
          color: "#4e79a7",
        };
  }

  const notesFileName = sessionJson.notesFile || "notes.txt";
  const notesFile = zip.file(notesFileName);
  const notes = notesFile ? await notesFile.async("string") : "";

  const view: ViewState = {
    xRange: sessionJson.xRange ?? null,
    seriesView,
    theme: sessionJson.theme ?? "light",
    notes,
    tooltipAlwaysOn: sessionJson.tooltipAlwaysOn ?? false,
  };

  return { series, view };
}
