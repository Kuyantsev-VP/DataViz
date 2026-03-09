import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { useAppState } from "../stores/appStore";
import { alignData } from "../utils/alignData";
import { getTooltipValues, type TooltipEntry } from "../utils/interpolate";
import { ChartTooltip } from "./ChartTooltip";
import { INTERMEDIATE_POINTS_CNT } from "../constants";
import type { Series, SeriesViewState } from "../types";

interface TooltipState {
  time: number;
  entries: TooltipEntry[];
  x: number;
  y: number;
  crosshairX: number;
}

function buildOptions(
  series: Series[],
  seriesView: Record<string, SeriesViewState>,
  xRange: { min: number; max: number } | null,
  width: number,
  height: number,
): uPlot.Options {
  const scales: uPlot.Scales = {
    x: {
      time: false,
      range: xRange ? [xRange.min, xRange.max] : [0, 1],
    },
    _yGrid: {
      auto: false,
      range: [0, 1],
    },
  };

  for (const s of series) {
    const sv = seriesView[s.id];
    if (!sv) continue;
    const ofs = sv.yOffset ?? 0;
    scales[s.id] = {
      auto: false,
      range: [sv.yRange.min + ofs, sv.yRange.max + ofs],
    };
  }

  const uSeries: uPlot.Series[] = [
    {},
    ...series.map((s) => {
      const sv = seriesView[s.id];
      return {
        label: s.name,
        scale: s.id,
        stroke: sv?.color ?? "#888",
        width: 1.5,
        show: sv?.visible ?? true,
        spanGaps: true,
        paths: uPlot.paths!.linear!(),
      } satisfies uPlot.Series;
    }),
  ];

  const xSplits: number[] = [];
  if (xRange) {
    const step = (xRange.max - xRange.min) / (INTERMEDIATE_POINTS_CNT + 1);
    for (let i = 0; i <= INTERMEDIATE_POINTS_CNT + 1; i++) {
      xSplits.push(xRange.min + step * i);
    }
  }

  const ySplits: number[] = [];
  const yStep = 1 / (INTERMEDIATE_POINTS_CNT + 1);
  for (let i = 0; i <= INTERMEDIATE_POINTS_CNT + 1; i++) {
    ySplits.push(yStep * i);
  }

  const axes: uPlot.Axis[] = [
    {
      scale: "x",
      side: 2,
      size: 0,
      splits: () => xSplits,
      values: () => xSplits.map(() => ""),
      ticks: { show: false },
      grid: { show: true, stroke: "rgba(150,150,150,0.25)", width: 1 },
    },
    {
      scale: "_yGrid",
      side: 3,
      size: 0,
      splits: () => ySplits,
      values: () => ySplits.map(() => ""),
      ticks: { show: false },
      grid: { show: true, stroke: "rgba(150,150,150,0.25)", width: 1 },
    },
    ...series.map(() => ({
      show: false as const,
    })),
  ];

  return {
    width,
    height,
    scales,
    series: uSeries,
    axes,
    cursor: { show: false },
    legend: { show: false },
  };
}

export function Chart() {
  const { series, view } = useAppState();
  const containerRef = useRef<HTMLDivElement>(null);
  const uPlotRef = useRef<uPlot | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const aligned = useMemo(() => alignData(series), [series]);

  const uData = useMemo((): uPlot.AlignedData => {
    return [aligned.time, ...aligned.values] as uPlot.AlignedData;
  }, [aligned]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || series.length === 0) return;

    if (uPlotRef.current) {
      uPlotRef.current.destroy();
      uPlotRef.current = null;
    }

    const rect = container.getBoundingClientRect();
    const w = rect.width || 800;
    const h = rect.height || 400;

    const opts = buildOptions(series, view.seriesView, view.xRange, w, h);
    const plot = new uPlot(opts, uData, container);
    uPlotRef.current = plot;

    return () => {
      plot.destroy();
      uPlotRef.current = null;
    };
  }, [series, view.seriesView, view.xRange, uData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const plot = uPlotRef.current;
      if (!plot) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        plot.setSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const updateTooltip = useCallback(
    (clientX: number, clientY: number) => {
      const plot = uPlotRef.current;
      if (!plot) return;

      const overEl = plot.root.querySelector(".u-over") as HTMLElement | null;
      if (!overEl) return;
      const rect = overEl.getBoundingClientRect();

      const cx = clientX - rect.left;
      if (cx < 0 || cx > rect.width) return;

      const time = plot.posToVal(cx, "x");
      const entries = getTooltipValues(time, series, view.seriesView);

      setTooltip({
        time,
        entries,
        x: clientX + 12,
        y: clientY - 12,
        crosshairX: cx,
      });
    },
    [series, view.seriesView],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      updateTooltip(e.clientX, e.clientY);
    },
    [updateTooltip],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons & 2) {
        updateTooltip(e.clientX, e.clientY);
      }
    },
    [updateTooltip],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) {
        setTooltip(null);
      }
    },
    [],
  );

  if (series.length === 0) return null;

  const plotOver = uPlotRef.current?.root.querySelector(".u-over") as HTMLElement | null;
  const plotHeight = plotOver?.clientHeight ?? 0;

  return (
    <div
      ref={containerRef}
      className="chart-container"
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {tooltip && (
        <>
          <div
            className="chart-crosshair"
            style={{
              left: tooltip.crosshairX,
              height: plotHeight,
            }}
          />
          <ChartTooltip
            time={tooltip.time}
            entries={tooltip.entries}
            x={tooltip.x}
            y={tooltip.y}
          />
        </>
      )}
    </div>
  );
}
