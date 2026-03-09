import { useAppState, useAppActions } from "../stores/appStore";
import { YAxisScale } from "./YAxisScale";
import "./YAxisPanel.css";

export function YAxisPanel() {
  const { series, view } = useAppState();
  const { setYRange, resetYRange } = useAppActions();

  return (
    <div className="y-axis-panel">
      {series.map((s) => {
        const sv = view.seriesView[s.id];
        if (!sv) return null;
        return (
          <YAxisScale
            key={s.id}
            name={s.name}
            color={sv.color}
            rangeMin={sv.yRange.min}
            rangeMax={sv.yRange.max}
            dataMin={s.dataMin}
            dataMax={s.dataMax}
            visible={sv.visible}
            onRangeChange={(min, max) =>
              setYRange(s.id, { min, max })
            }
            onReset={() => resetYRange(s.id)}
          />
        );
      })}
    </div>
  );
}
