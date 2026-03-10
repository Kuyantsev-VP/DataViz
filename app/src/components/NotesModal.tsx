import { useState, useEffect, useRef, useCallback } from "react";
import { useAppState, useAppActions } from "../stores/appStore";
import "./NotesModal.css";

let savedCursorPos = 0;

interface NotesModalProps {
  onClose: () => void;
}

export function NotesModal({ onClose }: NotesModalProps) {
  const { view } = useAppState();
  const { setNotes } = useAppActions();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(view.notes);

  const isDirty = draft !== view.notes;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      const pos = Math.min(savedCursorPos, ta.value.length);
      ta.setSelectionRange(pos, pos);
    }
  }, []);

  const saveCursor = useCallback(() => {
    savedCursorPos = textareaRef.current?.selectionStart ?? 0;
  }, []);

  const tryClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm("Discard unsaved changes?")) return;
    }
    saveCursor();
    dialogRef.current?.close();
    onClose();
  }, [isDirty, onClose, saveCursor]);

  const handleApply = useCallback(() => {
    saveCursor();
    setNotes(draft);
    dialogRef.current?.close();
    onClose();
  }, [draft, setNotes, onClose, saveCursor]);

  const handleDialogClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        tryClose();
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleApply();
      }
    },
    [tryClose, handleApply],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) {
        tryClose();
      }
    },
    [tryClose],
  );

  return (
    <dialog
      ref={dialogRef}
      className="notes-modal"
      onClose={handleDialogClose}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="notes-modal__content">
        <div className="notes-modal__header">
          <h3 className="notes-modal__title">Notes</h3>
          <button
            className="notes-modal__close"
            onClick={tryClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="notes-modal__textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write your notes here..."
        />

        <div className="notes-modal__footer">
          <button className="notes-modal__apply" onClick={handleApply}>
            Apply
          </button>
          <span className="notes-modal__hotkey">Ctrl + Enter</span>
          <button className="notes-modal__cancel" onClick={tryClose}>
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
