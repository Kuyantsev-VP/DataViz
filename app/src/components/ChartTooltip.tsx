import type { TooltipEntry } from "../utils/interpolate";
import "./ChartTooltip.css";

function formatValue(v: number | null): string {
  if (v === null) return "—";
  if (Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0)) {
    return v.toExponential(3);
  }
  return v.toFixed(4);
}

interface ChartTooltipProps {
  time: number;
  entries: TooltipEntry[];
  x: number;
  y: number;
}

export function ChartTooltip({ time, entries, x, y }: ChartTooltipProps) {
  if (entries.length === 0) return null;

  return (
    <div className="chart-tooltip" style={{ left: x, top: y }}>
      <div className="chart-tooltip__time">
        Time: {formatValue(time)}
      </div>
      <table className="chart-tooltip__table">
        <tbody>
          {entries.map((e) => (
            <tr key={e.seriesId}>
              <td>
                <span
                  className="chart-tooltip__dot"
                  style={{ background: e.color }}
                />
              </td>
              <td className="chart-tooltip__name">{e.name}</td>
              <td className="chart-tooltip__val">{formatValue(e.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
