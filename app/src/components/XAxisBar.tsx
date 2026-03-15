import { useState, useCallback, useRef, useEffect } from "react";
import { useAppState, useAppActions, useDataXRange } from "../stores/appStore";
import { INTERMEDIATE_POINTS_CNT } from "../constants";
import "./XAxisBar.css";

function formatTick(value: number): string {
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(2);
  }
  const decimals = Math.abs(value) < 1 ? 4 : Math.abs(value) < 100 ? 2 : 1;
  return parseFloat(value.toFixed(decimals)).toString();
}

function generateAllTicks(min: number, max: number): number[] {
  const ticks: number[] = [min];
  const step = (max - min) / (INTERMEDIATE_POINTS_CNT + 1);
  for (let i = 1; i <= INTERMEDIATE_POINTS_CNT; i++) {
    ticks.push(min + step * i);
  }
  ticks.push(max);
  return ticks;
}

function toPercent(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 100;
}

export function XAxisBar() {
  const { view } = useAppState();
  const { setXRange, resetXRange } = useAppActions();
  const dataRange = useDataXRange();

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingIdx]);

  const xRange = view.xRange;
  if (!xRange || !dataRange) return null;

  const isCustomRange =
    xRange.min !== dataRange.min || xRange.max !== dataRange.max;
  const ticks = generateAllTicks(xRange.min, xRange.max);

  const handleClick = (idx: number, value: number) => {
    setInputValue(String(value));
    setEditingIdx(idx);
  };

  const commit = useCallback(() => {
    if (editingIdx === null) return;
    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      setEditingIdx(null);
      return;
    }

    if (editingIdx === 0 && val < xRange.max) {
      setXRange({ min: val, max: xRange.max });
    } else if (editingIdx === ticks.length - 1 && val > xRange.min) {
      setXRange({ min: xRange.min, max: val });
    }
    setEditingIdx(null);
  }, [editingIdx, inputValue, xRange, ticks.length, setXRange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") setEditingIdx(null);
    },
    [commit],
  );

  const isEditable = (idx: number) => idx === 0 || idx === ticks.length - 1;

  return (
    <div className="x-axis-bar">
      <div className="x-axis-bar__track">
        {ticks.map((tick, i) => {
          const pct = toPercent(tick, xRange.min, xRange.max);
          const editable = isEditable(i);
          const editing = editingIdx === i;

          const isFirst = i === 0;
          const isLast = i === ticks.length - 1;
          const tickClass = `x-axis-bar__tick${isFirst ? " x-axis-bar__tick--first" : isLast ? " x-axis-bar__tick--last" : ""}`;

          return (
            <div
              key={i}
              className={tickClass}
              style={{ left: `${pct}%` }}
            >
              {editing ? (
                <input
                  ref={inputRef}
                  className="x-axis-bar__input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={commit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              ) : (
                <span
                  className={`x-axis-bar__value${editable ? " x-axis-bar__value--clickable" : ""}`}
                  onClick={editable ? () => handleClick(i, tick) : undefined}
                  title={editable ? "Click to edit" : undefined}
                >
                  {formatTick(tick)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {isCustomRange && (
        <button
          className="x-axis-bar__reset"
          onClick={resetXRange}
          title="Reset to data range"
        >
          ↺
        </button>
      )}
    </div>
  );
}
