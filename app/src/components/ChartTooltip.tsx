import { useRef } from "react";
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

const OFFSET = 12;

export function ChartTooltip({ time, entries, x, y }: ChartTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (entries.length === 0) return null;

  const w = ref.current?.offsetWidth ?? 0;
  const flip = x + OFFSET + w > window.innerWidth;

  const style: React.CSSProperties = flip
    ? { left: x - OFFSET - w, top: y }
    : { left: x + OFFSET, top: y };

  return (
    <div ref={ref} className="chart-tooltip" style={style}>
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
