import { AppStoreProvider, useAppState } from "./stores/appStore";
import { FileLoader } from "./components/FileLoader";
import { Chart } from "./components/Chart";
import { YAxisPanel } from "./components/YAxisPanel";
import { XAxisBar } from "./components/XAxisBar";
import { XScrollbar } from "./components/XScrollbar";
import { Legend } from "./components/Legend";

function AppContent() {
  const { series } = useAppState();

  return (
    <div className="app">
      <header className="app__header">
        <h1>DataViz</h1>
        <FileLoader />
        <Legend />
      </header>
      {series.length > 0 && (
        <main className="app__main">
          <YAxisPanel />
          <div className="app__chart-col">
            <Chart />
            <XAxisBar />
            <XScrollbar />
          </div>
        </main>
      )}
    </div>
  );
}

function App() {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}

export default App;
