import Papa from "papaparse";
import type { Series } from "../types";

export interface ParseResult {
  series: Series[];
}

export interface ParseError {
  message: string;
}

/**
 * Resolve duplicate column names by appending `_<N>` suffix.
 * `existingNames` — names already present in the app from previous CSVs.
 */
function deduplicateNames(
  columns: string[],
  existingNames: Set<string>,
): string[] {
  const result: string[] = [];
  const allNames = new Set(existingNames);

  for (const col of columns) {
    let name = col;
    if (allNames.has(name)) {
      let n = 2;
      while (allNames.has(`${col}_${n}`)) n++;
      name = `${col}_${n}`;
    }
    allNames.add(name);
    result.push(name);
  }

  return result;
}

function validateTimeColumn(timeValues: unknown[]): ParseError | null {
  for (let i = 0; i < timeValues.length; i++) {
    const v = timeValues[i];
    if (typeof v !== "number" || !isFinite(v)) {
      return {
        message: `Time column contains non-numeric value at row ${i + 1}: "${v}"`,
      };
    }
  }

  for (let i = 1; i < timeValues.length; i++) {
    const prev = timeValues[i - 1] as number;
    const curr = timeValues[i] as number;
    if (curr <= prev) {
      return {
        message:
          curr === prev
            ? `Duplicate Time value ${curr} at rows ${i} and ${i + 1}`
            : `Time values are not sorted: ${prev} > ${curr} at rows ${i} and ${i + 1}`,
      };
    }
  }

  return null;
}

export function parseCsv(
  csvText: string,
  existingNames: Set<string>,
): ParseResult | ParseError {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    return { message: `CSV parse error (row ${first.row}): ${first.message}` };
  }

  const fields = parsed.meta.fields;
  if (!fields || fields.length === 0) {
    return { message: "CSV file has no columns" };
  }

  if (!fields.includes("Time")) {
    return { message: 'CSV file must contain a "Time" column' };
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return { message: "CSV file has no data rows" };
  }

  const timeValues = rows.map((row) => row["Time"]);
  const timeError = validateTimeColumn(timeValues);
  if (timeError) return timeError;

  const time = timeValues as number[];
  const dataColumns = fields.filter((f) => f !== "Time");

  if (dataColumns.length === 0) {
    return { message: "CSV file has no data columns besides Time" };
  }

  const resolvedNames = deduplicateNames(dataColumns, existingNames);

  const series: Series[] = dataColumns.map((col, i) => {
    const values = rows.map((row) => {
      const v = row[col];
      if (typeof v === "number" && isFinite(v)) return v;
      return null;
    });

    const numericValues = values.filter((v): v is number => v !== null);
    const dataMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;

    return {
      id: `${resolvedNames[i]}_${Date.now()}_${i}`,
      name: resolvedNames[i],
      time,
      values,
      dataMin,
      dataMax,
    };
  });

  return { series };
}

export function isParseError(
  result: ParseResult | ParseError,
): result is ParseError {
  return "message" in result;
}
