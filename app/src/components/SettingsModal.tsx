import { useState, useEffect, useRef, useCallback } from "react";
import { useAppState, useAppActions } from "../stores/appStore";
import "./SettingsModal.css";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { series, view } = useAppState();
  const { setTooltipAlwaysOn, setTheme, renameSeries, setColor } = useAppActions();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingId]);

  const close = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !editingId) {
        e.preventDefault();
        close();
      }
    },
    [close, editingId],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) close();
    },
    [close],
  );

  const startRename = useCallback((id: string, currentName: string) => {
    setNameInput(currentName);
    setEditingId(id);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && nameInput.trim()) {
      renameSeries(editingId, nameInput.trim());
    }
    setEditingId(null);
  }, [editingId, nameInput, renameSeries]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") commitRename();
      if (e.key === "Escape") setEditingId(null);
    },
    [commitRename],
  );

  return (
    <dialog
      ref={dialogRef}
      className="settings-modal"
      onClose={() => onClose()}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="settings-modal__content">
        <div className="settings-modal__header">
          <h3 className="settings-modal__title">Settings</h3>
          <button className="settings-modal__close" onClick={close} title="Close">
            ✕
          </button>
        </div>

        <label className="settings-modal__row">
          <input
            type="checkbox"
            checked={view.tooltipAlwaysOn}
            onChange={(e) => setTooltipAlwaysOn(e.target.checked)}
          />
          <span>Always-on tooltip</span>
        </label>

        <div className="settings-modal__row">
          <span>Theme</span>
          <button
            className="settings-modal__theme-btn"
            onClick={() => setTheme(view.theme === "dark" ? "light" : "dark")}
          >
            {view.theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {series.length > 0 && (
          <>
            <div className="settings-modal__divider" />
            <div className="settings-modal__section-title">Series</div>
            {series.map((s) => {
              const sv = view.seriesView[s.id];
              if (!sv) return null;
              return (
                <div key={s.id} className="settings-modal__series-row">
                  {editingId === s.id ? (
                    <input
                      ref={inputRef}
                      className="settings-modal__name-input"
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={handleRenameKeyDown}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="settings-modal__series-name"
                      onClick={() => startRename(s.id, s.name)}
                      title="Click to rename"
                    >
                      {s.name}
                    </span>
                  )}
                  <input
                    type="color"
                    className="settings-modal__color-picker"
                    value={sv.color}
                    onChange={(e) => setColor(s.id, e.target.value)}
                    title="Pick color"
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </dialog>
  );
}
