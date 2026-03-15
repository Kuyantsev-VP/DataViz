import Papa from "papaparse";
import type { Series } from "../types";

export interface ParseError {
  message: string;
}

/** Result of pre-parsing: raw column names + parsed rows, before validation. */
export interface PreParseResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ParseResult {
  series: Series[];
  colors?: string[];
}

export function isParseError(
  result: PreParseResult | ParseResult | ParseError,
): result is ParseError {
  return "message" in result;
}

/**
 * First stage: parse CSV text with PapaParse and return column names + rows.
 * Only checks for parse errors and empty data.
 */
export function preParseCsv(csvText: string): PreParseResult | ParseError {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    return { message: `CSV parse error (row ${first.row}): ${first.message}` };
  }

  const columns = parsed.meta.fields;
  if (!columns || columns.length === 0) {
    return { message: "CSV file has no columns" };
  }

  if (parsed.data.length === 0) {
    return { message: "CSV file has no data rows" };
  }

  return { columns, rows: parsed.data };
}

/** Column config from the wizard. */
export interface WizardColumn {
  originalName: string;
  displayName: string;
  enabled: boolean;
  color: string;
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

function deduplicateNames(
  names: string[],
  existingNames: Set<string>,
): string[] {
  const result: string[] = [];
  const allNames = new Set(existingNames);

  for (const name of names) {
    let resolved = name;
    if (allNames.has(resolved)) {
      let n = 2;
      while (allNames.has(`${name}_${n}`)) n++;
      resolved = `${name}_${n}`;
    }
    allNames.add(resolved);
    result.push(resolved);
  }

  return result;
}

/**
 * Second stage: validate and build Series from wizard config.
 * Called when user clicks Apply in the wizard.
 */
export function finalizeParse(
  rows: Record<string, unknown>[],
  wizardColumns: WizardColumn[],
  existingNames: Set<string>,
): ParseResult | ParseError {
  const enabled = wizardColumns.filter((c) => c.enabled);

  const timeCol = enabled.find((c) => c.displayName === "Time");
  if (!timeCol) {
    return { message: 'No column named "Time" among selected columns' };
  }

  const displayNames = enabled
    .filter((c) => c.displayName !== "Time")
    .map((c) => c.displayName);

  const seen = new Set<string>();
  for (const name of displayNames) {
    if (seen.has(name)) {
      return { message: `Duplicate series name: "${name}"` };
    }
    seen.add(name);
  }

  const timeValues = rows.map((row) => row[timeCol.originalName]);
  const timeError = validateTimeColumn(timeValues);
  if (timeError) return timeError;

  const time = timeValues as number[];

  const dataCols = enabled.filter((c) => c.displayName !== "Time");
  if (dataCols.length === 0) {
    return { message: "No data columns selected besides Time" };
  }

  const resolvedNames = deduplicateNames(
    dataCols.map((c) => c.displayName),
    existingNames,
  );

  const series: Series[] = dataCols.map((col, i) => {
    const values = rows.map((row) => {
      const v = row[col.originalName];
      if (typeof v === "number" && isFinite(v)) return v;
      return null;
    });

    const numericValues = values.filter((v): v is number => v !== null);
    const dataMin = numericValues.length > 0 ? numericValues.reduce((a, b) => a < b ? a : b) : 0;
    const dataMax = numericValues.length > 0 ? numericValues.reduce((a, b) => a > b ? a : b) : 0;

    return {
      id: `${resolvedNames[i]}_${Date.now()}_${i}`,
      name: resolvedNames[i],
      time,
      values,
      dataMin,
      dataMax,
    };
  });

  return { series, colors: dataCols.map((c) => c.color) };
}
