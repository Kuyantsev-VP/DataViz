import { useState, useCallback, useRef, useEffect } from "react";
import { INTERMEDIATE_POINTS_CNT } from "../constants";
import "./YAxisScale.css";

interface YAxisScaleProps {
  name: string;
  color: string;
  rangeMin: number;
  rangeMax: number;
  offset: number;
  dataMin: number;
  dataMax: number;
  visible: boolean;
  onRangeChange: (min: number, max: number) => void;
  onOffsetChange: (offset: number) => void;
  onReset: () => void;
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(2);
  }
  const decimals = 2;
  return parseFloat(value.toFixed(decimals)).toString();
}

function generateTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const step = (max - min) / (INTERMEDIATE_POINTS_CNT + 1);
  for (let i = 1; i <= INTERMEDIATE_POINTS_CNT; i++) {
    ticks.push(min + step * i);
  }
  return ticks;
}

type EditTarget = "min" | "max" | "offset" | null;

export function YAxisScale({
  name,
  color,
  rangeMin,
  rangeMax,
  offset,
  dataMin,
  dataMax,
  visible,
  onRangeChange,
  onOffsetChange,
  onReset,
}: YAxisScaleProps) {
  const [editing, setEditing] = useState<EditTarget>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select();
    }
  }, [editing]);

  const isCustomRange =
    rangeMin !== dataMin || rangeMax !== dataMax || offset !== 0;

  const effectiveMin = rangeMin + offset;
  const effectiveMax = rangeMax + offset;
  const ticks = generateTicks(effectiveMin, effectiveMax);

  const startEdit = useCallback((target: EditTarget, value: number) => {
    setInputValue(String(value));
    setEditing(target);
  }, []);

  const commit = useCallback(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      setEditing(null);
      return;
    }

    if (editing === "min" && val < effectiveMax) {
      onRangeChange(val - offset, rangeMax);
    } else if (editing === "max" && val > effectiveMin) {
      onRangeChange(rangeMin, val - offset);
    } else if (editing === "offset") {
      onOffsetChange(val);
    }
    setEditing(null);
  }, [
    editing, inputValue, effectiveMin, effectiveMax,
    offset, rangeMin, rangeMax, onRangeChange, onOffsetChange,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") setEditing(null);
    },
    [commit],
  );

  if (!visible) return null;

  const renderEditable = (
    target: EditTarget,
    value: number,
    title: string,
    extraClass?: string,
  ) => {
    if (editing === target) {
      return (
        <input
          ref={inputRef}
          className="y-axis-scale__input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );
    }
    const display = target === "offset" ? value.toFixed(2) : formatTick(value);
    return (
      <span
        className={`y-axis-scale__value y-axis-scale__value--clickable ${extraClass ?? ""}`}
        onClick={() => startEdit(target, value)}
        title={title}
      >
        {display}
      </span>
    );
  };

  return (
    <div className="y-axis-scale" style={{ borderColor: color }}>
      <span className="y-axis-scale__name" style={{ color }}>
        {name}
      </span>
      <div className="y-axis-scale__body">
      {isCustomRange && (
          <button
            className="y-axis-scale__reset"
            onClick={onReset}
            title="Reset to data range"
          >
            ↺
          </button>
        )}
        <div className="y-axis-scale__ticks">
          <div className="y-axis-scale__tick y-axis-scale__tick--bound">
            {renderEditable("max", effectiveMax, "Click to edit max")}

          </div>

          {ticks.reverse().map((tick, i) => (
            <div key={i} className="y-axis-scale__tick">
              <span className="y-axis-scale__value">{formatTick(tick)}</span>
            </div>
          ))}

          <div className="y-axis-scale__tick y-axis-scale__tick--bound">
            {renderEditable("min", effectiveMin, "Click to edit min")}
          </div>
        </div>

        <div className="y-axis-scale__offset">
          <span className="y-axis-scale__offset-label">Y-offs</span>
          {renderEditable("offset", offset, "Click to edit offset")}
        </div>
      </div>
    </div>
  );
}
