import { useState, useEffect, useRef, useCallback } from "react";
import { useAppActions, useExistingNames, useAppState } from "../stores/appStore";
import { finalizeParse, isParseError, type WizardColumn } from "../utils/csvParser";
import { SERIES_COLORS } from "../constants";
import "./ImportWizard.css";

interface ImportWizardProps {
  columns: string[];
  rows: Record<string, unknown>[];
  onClose: () => void;
  onError: (msg: string) => void;
}

export function ImportWizard({ columns, rows, onClose, onError }: ImportWizardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const existingNames = useExistingNames();
  const { series: existingSeries } = useAppState();
  const { addSeries } = useAppActions();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const usedColorCount = Object.keys(existingSeries).length;

  const [wizardCols, setWizardCols] = useState<WizardColumn[]>(() => {
    let dataIdx = 0;
    return columns.map((col) => {
      const isTime = col === "Time";
      const color = isTime
        ? "#000000"
        : SERIES_COLORS[(usedColorCount + dataIdx++) % SERIES_COLORS.length];
      return { originalName: col, displayName: col, enabled: true, color };
    });
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) inputRef.current.select();
  }, [editingIdx]);

  const close = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && editingIdx === null) {
        e.preventDefault();
        close();
      }
    },
    [close, editingIdx],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) close();
    },
    [close],
  );

  const toggleEnabled = useCallback((idx: number) => {
    setWizardCols((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, enabled: !c.enabled } : c)),
    );
  }, []);

  const setColor = useCallback((idx: number, color: string) => {
    setWizardCols((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, color } : c)),
    );
  }, []);

  const startRename = useCallback((idx: number, currentName: string) => {
    setNameInput(currentName);
    setEditingIdx(idx);
  }, []);

  const commitRename = useCallback(() => {
    if (editingIdx !== null && nameInput.trim()) {
      setWizardCols((prev) =>
        prev.map((c, i) =>
          i === editingIdx ? { ...c, displayName: nameInput.trim() } : c,
        ),
      );
    }
    setEditingIdx(null);
  }, [editingIdx, nameInput]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") commitRename();
      if (e.key === "Escape") setEditingIdx(null);
    },
    [commitRename],
  );

  const handleApply = useCallback(() => {
    setValidationError(null);
    const result = finalizeParse(rows, wizardCols, existingNames);
    if (isParseError(result)) {
      setValidationError(result.message);
      return;
    }
    addSeries(result.series, result.colors);
    dialogRef.current?.close();
    onClose();
  }, [rows, wizardCols, existingNames, addSeries, onClose]);

  const enabledCount = wizardCols.filter((c) => c.enabled).length;

  return (
    <dialog
      ref={dialogRef}
      className="import-wizard"
      onClose={() => onClose()}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="import-wizard__content">
        <div className="import-wizard__header">
          <h3 className="import-wizard__title">Import columns</h3>
          <button className="import-wizard__close" onClick={close} title="Close">
            ✕
          </button>
        </div>

        <div className="import-wizard__hint">
          {columns.length} columns found, {rows.length} rows.
          Toggle, rename, or recolor before loading.
        </div>

        {validationError && (
          <div className="import-wizard__error">{validationError}</div>
        )}

        <div className="import-wizard__list">
          {wizardCols.map((col, idx) => {
            const isTime = col.displayName === "Time";
            return (
              <div
                key={idx}
                className={`import-wizard__row ${!col.enabled ? "import-wizard__row--disabled" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={col.enabled}
                  onChange={() => toggleEnabled(idx)}
                />

                {editingIdx === idx ? (
                  <input
                    ref={inputRef}
                    className="import-wizard__name-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleRenameKeyDown}
                    autoFocus
                  />
                ) : (
                  <span
                    className="import-wizard__col-name"
                    onClick={() => startRename(idx, col.displayName)}
                    title="Click to rename"
                  >
                    {col.displayName}
                    {col.displayName !== col.originalName && (
                      <span className="import-wizard__original-name">
                        ({col.originalName})
                      </span>
                    )}
                  </span>
                )}

                {!isTime && (
                  <input
                    type="color"
                    className="import-wizard__color-picker"
                    value={col.color}
                    onChange={(e) => setColor(idx, e.target.value)}
                    title="Pick color"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="import-wizard__footer">
          <button
            className="import-wizard__apply"
            onClick={handleApply}
            disabled={enabledCount < 2}
            title={enabledCount < 2 ? "Select at least Time + one data column" : ""}
          >
            Apply
          </button>
          <button className="import-wizard__cancel" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
