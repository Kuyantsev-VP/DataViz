import { AppStoreProvider, useAppState } from "./stores/appStore";
import { FileLoader } from "./components/FileLoader";
import { Chart } from "./components/Chart";
import { YAxisPanel } from "./components/YAxisPanel";

function AppContent() {
  const { series } = useAppState();

  return (
    <div className="app">
      <header className="app__header">
        <h1>DataViz</h1>
        <FileLoader />
      </header>
      {series.length > 0 && (
        <main className="app__main">
          <YAxisPanel />
          <Chart />
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
