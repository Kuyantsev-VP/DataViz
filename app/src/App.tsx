import { useCallback, useMemo, useState } from "react";
import type { Series } from "./types";
import { FileLoader } from "./components/FileLoader";

function App() {
  const [allSeries, setAllSeries] = useState<Series[]>([]);

  const existingNames = useMemo(
    () => new Set(allSeries.map((s) => s.name)),
    [allSeries],
  );

  const handleLoaded = useCallback((newSeries: Series[]) => {
    setAllSeries((prev) => [...prev, ...newSeries]);
  }, []);

  return (
    <div className="app">
      <h1>DataViz</h1>
      <FileLoader existingNames={existingNames} onLoaded={handleLoaded} />
      {allSeries.length > 0 && (
        <div style={{ padding: "16px", fontSize: "14px" }}>
          Loaded series: {allSeries.map((s) => s.name).join(", ")}
        </div>
      )}
    </div>
  );
}

export default App;
