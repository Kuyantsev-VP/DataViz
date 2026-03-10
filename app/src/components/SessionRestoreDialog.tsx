import { useEffect, useRef, useCallback } from "react";
import type { SavedSession } from "../utils/persistence";
import "./SessionRestoreDialog.css";

interface SessionRestoreDialogProps {
  session: SavedSession;
  onRestore: () => void;
  onDiscard: () => void;
}

export function SessionRestoreDialog({
  session,
  onRestore,
  onDiscard,
}: SessionRestoreDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDiscard();
      }
    },
    [onDiscard],
  );

  return (
    <dialog
      ref={dialogRef}
      className="session-restore"
      onKeyDown={handleKeyDown}
    >
      <div className="session-restore__content">
        <h3 className="session-restore__title">Previous session found</h3>
        <p className="session-restore__info">
          {session.series.length} series loaded previously.
          Resume where you left off?
        </p>
        <div className="session-restore__actions">
          <button className="session-restore__btn session-restore__btn--primary" onClick={onRestore}>
            Resume session
          </button>
          <button className="session-restore__btn session-restore__btn--secondary" onClick={onDiscard}>
            Start new
          </button>
        </div>
      </div>
    </dialog>
  );
}
