import { useState } from "react";
import { AppStoreProvider, useAppState } from "./stores/appStore";
import { FileLoader } from "./components/FileLoader";
import { Chart } from "./components/Chart";
import { YAxisPanel } from "./components/YAxisPanel";
import { XAxisBar } from "./components/XAxisBar";
import { XScrollbar } from "./components/XScrollbar";
import { Legend } from "./components/Legend";
import { NotesModal } from "./components/NotesModal";
import { SettingsModal } from "./components/SettingsModal";

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="13" x2="10.5" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AppContent() {
  const { series } = useAppState();
  const [showNotes, setShowNotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="app">
      <header className="app__header">
        <h1>DataViz</h1>
        <FileLoader />
        <Legend />
        <div className="app__header-spacer" />
        <button
          className="app__icon-btn"
          onClick={() => setShowNotes(true)}
          title="Notes"
        >
          <NotesIcon />
        </button>
        <button
          className="app__icon-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8.5 2h3l.4 2.1a6 6 0 011.5.9l2-.8 1.5 2.6-1.6 1.3a6 6 0 010 1.8l1.6 1.3-1.5 2.6-2-.8a6 6 0 01-1.5.9L11.5 18h-3l-.4-2.1a6 6 0 01-1.5-.9l-2 .8-1.5-2.6 1.6-1.3a6 6 0 010-1.8L3.1 8.8l1.5-2.6 2 .8a6 6 0 011.5-.9L8.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </header>
      {showNotes && <NotesModal onClose={() => setShowNotes(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
