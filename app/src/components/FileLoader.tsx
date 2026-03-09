import { useCallback, useRef, useState } from "react";
import { parseCsv, isParseError } from "../utils/csvParser";
import { useAppActions, useExistingNames } from "../stores/appStore";
import { ErrorModal } from "./ErrorModal";
import "./FileLoader.css";

export function FileLoader() {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const existingNames = useExistingNames();
  const { addSeries } = useAppActions();

  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseCsv(text, existingNames);
        if (isParseError(result)) {
          setError(result.message);
        } else {
          addSeries(result.series);
        }
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsText(file);
    },
    [existingNames, addSeries],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <>
      <div
        className={`file-loader ${dragging ? "file-loader--dragging" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          hidden
        />
        <span className="file-loader__text">
          Drop CSV file here or click to browse
        </span>
      </div>
      {error && (
        <ErrorModal message={error} onClose={() => setError(null)} />
      )}
    </>
  );
}
