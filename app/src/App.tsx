import { useEffect, useState, useCallback, useRef } from "react";
import { AppStoreProvider, useAppState, useAppActions } from "./stores/appStore";
import { loadSession, clearSession, type SavedSession } from "./utils/persistence";
import { exportSession, importSession } from "./utils/sessionZip";
import { FileLoader } from "./components/FileLoader";
import { Chart } from "./components/Chart";
import { YAxisPanel } from "./components/YAxisPanel";
import { XAxisBar } from "./components/XAxisBar";
import { XScrollbar } from "./components/XScrollbar";
import { Legend } from "./components/Legend";
import { NotesModal } from "./components/NotesModal";
import { SettingsModal } from "./components/SettingsModal";
import { SessionRestoreDialog } from "./components/SessionRestoreDialog";
import { ErrorModal } from "./components/ErrorModal";

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

type StartupState =
  | { status: "checking" }
  | { status: "prompt"; session: SavedSession }
  | { status: "ready" };

function AppContent() {
  const { series, view } = useAppState();
  const { restoreSession, setYOffsetLocked } = useAppActions();
  const [showNotes, setShowNotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [startup, setStartup] = useState<StartupState>({ status: "checking" });
  const [importError, setImportError] = useState<string | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSession().then((saved) => {
      if (saved) {
        setStartup({ status: "prompt", session: saved });
      } else {
        setStartup({ status: "ready" });
      }
    });
  }, []);

  const handleRestore = useCallback(() => {
    if (startup.status === "prompt") {
      restoreSession(startup.session);
    }
    setStartup({ status: "ready" });
  }, [startup, restoreSession]);

  const handleDiscard = useCallback(() => {
    clearSession();
    setStartup({ status: "ready" });
  }, []);

  const handleExport = useCallback(() => {
    exportSession(series, view);
  }, [series, view]);

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const session = await importSession(file);
        restoreSession(session);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Import failed");
      }
    },
    [restoreSession],
  );

  const handleZipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImportFile(file);
      if (zipInputRef.current) zipInputRef.current.value = "";
    },
    [handleImportFile],
  );

  if (startup.status === "checking") return null;

  return (
    <div className={`app theme-${view.theme}`}>
      {startup.status === "prompt" && (
        <SessionRestoreDialog
          session={startup.session}
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      )}
      <header className="app__header">
        <h1>DataViz</h1>
        <FileLoader />
        <Legend />
        {series.length > 0 && (
          <label className="app__lock-yoffs" title="Lock Y offsets together">
            <input
              type="checkbox"
              checked={view.yOffsetLocked}
              onChange={(e) => setYOffsetLocked(e.target.checked)}
            />
            <span>Lock Y offset</span>
          </label>
        )}
        <div className="app__header-spacer" />
        {series.length > 0 && (
          <button
            className="app__icon-btn"
            onClick={handleExport}
            title="Export session (.zip)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 12V3M10 3l-3 3M10 3l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <button
          className="app__icon-btn"
          onClick={() => zipInputRef.current?.click()}
          title="Import session (.zip)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3v9M10 12l-3-3M10 12l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          onChange={handleZipChange}
          hidden
        />
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
      {importError && (
        <ErrorModal message={importError} onClose={() => setImportError(null)} />
      )}
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
