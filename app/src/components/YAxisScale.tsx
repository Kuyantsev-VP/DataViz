import { useState, useCallback, useRef, useEffect } from "react";
import { INTERMEDIATE_POINTS_CNT } from "../constants";
import "./YAxisScale.css";

interface YAxisScaleProps {
  name: string;
  color: string;
  rangeMin: number;
  rangeMax: number;
  dataMin: number;
  dataMax: number;
  visible: boolean;
  onRangeChange: (min: number, max: number) => void;
  onReset: () => void;
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(2);
  }
  const decimals = Math.abs(value) < 1 ? 4 : Math.abs(value) < 100 ? 2 : 1;
  return value.toFixed(decimals);
}

function generateTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const step = (max - min) / (INTERMEDIATE_POINTS_CNT + 1);
  for (let i = 1; i <= INTERMEDIATE_POINTS_CNT; i++) {
    ticks.push(min + step * i);
  }
  return ticks;
}

export function YAxisScale({
  name,
  color,
  rangeMin,
  rangeMax,
  dataMin,
  dataMax,
  visible,
  onRangeChange,
  onReset,
}: YAxisScaleProps) {
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((editingMin || editingMax) && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingMin, editingMax]);

  const isCustomRange = rangeMin !== dataMin || rangeMax !== dataMax;
  const ticks = generateTicks(rangeMin, rangeMax);

  const handleMinClick = useCallback(() => {
    setInputValue(String(rangeMin));
    setEditingMin(true);
  }, [rangeMin]);

  const handleMaxClick = useCallback(() => {
    setInputValue(String(rangeMax));
    setEditingMax(true);
  }, [rangeMax]);

  const commitMin = useCallback(() => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val < rangeMax) {
      onRangeChange(val, rangeMax);
    }
    setEditingMin(false);
  }, [inputValue, rangeMax, onRangeChange]);

  const commitMax = useCallback(() => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > rangeMin) {
      onRangeChange(rangeMin, val);
    }
    setEditingMax(false);
  }, [inputValue, rangeMin, onRangeChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, commit: () => void, cancel: () => void) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    },
    [],
  );

  if (!visible) return null;

  return (
    <div className="y-axis-scale" style={{ borderColor: color }}>
      <div className="y-axis-scale__header">
        <span className="y-axis-scale__name" style={{ color }}>
          {name}
        </span>
        {isCustomRange && (
          <button
            className="y-axis-scale__reset"
            onClick={onReset}
            title="Reset to data range"
          >
            ↺
          </button>
        )}
      </div>

      <div className="y-axis-scale__ticks">
        <div className="y-axis-scale__tick y-axis-scale__tick--bound">
          {editingMax ? (
            <input
              ref={inputRef}
              className="y-axis-scale__input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitMax}
              onKeyDown={(e) =>
                handleKeyDown(e, commitMax, () => setEditingMax(false))
              }
              autoFocus
            />
          ) : (
            <span
              className="y-axis-scale__value y-axis-scale__value--clickable"
              onClick={handleMaxClick}
              title="Click to edit max"
            >
              {formatTick(rangeMax)}
            </span>
          )}
        </div>

        {ticks.reverse().map((tick, i) => (
          <div key={i} className="y-axis-scale__tick">
            <span className="y-axis-scale__value">{formatTick(tick)}</span>
          </div>
        ))}

        <div className="y-axis-scale__tick y-axis-scale__tick--bound">
          {editingMin ? (
            <input
              ref={inputRef}
              className="y-axis-scale__input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitMin}
              onKeyDown={(e) =>
                handleKeyDown(e, commitMin, () => setEditingMin(false))
              }
              autoFocus
            />
          ) : (
            <span
              className="y-axis-scale__value y-axis-scale__value--clickable"
              onClick={handleMinClick}
              title="Click to edit min"
            >
              {formatTick(rangeMin)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
