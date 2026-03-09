import { useAppState, useAppActions } from "../stores/appStore";
import "./Legend.css";

export function Legend() {
  const { series, view } = useAppState();
  const { setVisibility, setScaleVisibility } = useAppActions();

  if (series.length === 0) return null;

  return (
    <div className="legend">
      {series.map((s) => {
        const sv = view.seriesView[s.id];
        if (!sv) return null;

        return (
          <div key={s.id} className="legend__item">
            <input
              type="checkbox"
              className="legend__scale-cb"
              checked={sv.scaleVisible}
              onChange={(e) => setScaleVisibility(s.id, e.target.checked)}
              title="Toggle scale"
            />
            <span
              className={`legend__entry${sv.visible ? "" : " legend__entry--hidden"}`}
              onClick={() => setVisibility(s.id, !sv.visible)}
              title="Toggle series"
            >
              <span
                className="legend__marker"
                style={{ background: sv.color }}
              />
              <span className="legend__name">{s.name}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
