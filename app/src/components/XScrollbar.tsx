import { useCallback, useRef } from "react";
import { useAppState, useAppActions, useDataXRange } from "../stores/appStore";
import "./XScrollbar.css";

const SCROLL_FACTOR = 0.05;

export function XScrollbar() {
  const { view } = useAppState();
  const { setXRange } = useAppActions();
  const dataRange = useDataXRange();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartMin = useRef(0);

  const xRange = view.xRange;
  if (!xRange || !dataRange) return <div className="x-scrollbar__placeholder" />;

  const fullSpan = dataRange.max - dataRange.min;
  const viewSpan = xRange.max - xRange.min;
  const isNarrowed = viewSpan < fullSpan - 1e-9;

  const thumbLeft = ((xRange.min - dataRange.min) / fullSpan) * 100;
  const thumbWidth = (viewSpan / fullSpan) * 100;

  const clampAndSet = useCallback(
    (newMin: number) => {
      let min = newMin;
      let max = min + viewSpan;
      if (min < dataRange.min) {
        min = dataRange.min;
        max = dataRange.min + viewSpan;
      }
      if (max > dataRange.max) {
        max = dataRange.max;
        min = dataRange.max - viewSpan;
      }
      setXRange({ min, max });
    },
    [dataRange, viewSpan, setXRange],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * viewSpan * SCROLL_FACTOR;
      clampAndSet(xRange.min + delta);
    },
    [xRange.min, viewSpan, clampAndSet],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragStartX.current === null || !trackRef.current) return;
      const trackWidth = trackRef.current.getBoundingClientRect().width;
      const pxDelta = e.clientX - dragStartX.current;
      const dataDelta = (pxDelta / trackWidth) * fullSpan;
      clampAndSet(dragStartMin.current + dataDelta);
    },
    [fullSpan, clampAndSet],
  );

  const handleMouseUp = useCallback(() => {
    dragStartX.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartMin.current = xRange.min;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    },
    [xRange.min, handleMouseMove, handleMouseUp],
  );

  return (
    <div
      className="x-scrollbar"
      onWheel={handleWheel}
      ref={trackRef}
    >
      {isNarrowed ? (
        <div className="x-scrollbar__track">
          <div
            className="x-scrollbar__thumb"
            style={{ left: `${thumbLeft}%`, width: `${thumbWidth}%` }}
            onMouseDown={handleThumbMouseDown}
          />
        </div>
      ) : null}
    </div>
  );
}
