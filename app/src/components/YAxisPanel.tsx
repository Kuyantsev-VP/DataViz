import { useAppState, useAppActions } from "../stores/appStore";
import { YAxisScale } from "./YAxisScale";
import "./YAxisPanel.css";

export function YAxisPanel() {
  const { series, view } = useAppState();
  const { setYRange, resetYRange, setYOffset } = useAppActions();

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
            offset={sv.yOffset}
            dataMin={s.dataMin}
            dataMax={s.dataMax}
            visible={sv.visible && sv.scaleVisible}
            onRangeChange={(min, max) => setYRange(s.id, { min, max })}
            onOffsetChange={(offset) => setYOffset(s.id, offset)}
            onReset={() => resetYRange(s.id)}
          />
        );
      })}
    </div>
  );
}
