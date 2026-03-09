import { useEffect, useRef, useMemo } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { useAppState } from "../stores/appStore";
import { alignData } from "../utils/alignData";
import { INTERMEDIATE_POINTS_CNT } from "../constants";
import type { Series, SeriesViewState } from "../types";

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
  };

  for (const s of series) {
    const sv = seriesView[s.id];
    if (!sv) continue;
    scales[s.id] = {
      auto: false,
      range: [sv.yRange.min, sv.yRange.max],
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

  if (series.length === 0) return null;

  return <div ref={containerRef} className="chart-container" />;
}
