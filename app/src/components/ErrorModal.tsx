import { useCallback, useEffect, useRef } from "react";
import "./ErrorModal.css";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="error-modal" onClose={handleClose}>
      <div className="error-modal__content">
        <h3 className="error-modal__title">Error</h3>
        <p className="error-modal__message">{message}</p>
        <button className="error-modal__button" onClick={handleClose}>
          OK
        </button>
      </div>
    </dialog>
  );
}
