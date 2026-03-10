import { useCallback, useRef, useState } from "react";
import { preParseCsv, isParseError, type PreParseResult } from "../utils/csvParser";
import { ErrorModal } from "./ErrorModal";
import { ImportWizard } from "./ImportWizard";
import { ALLOWED_FILE_EXTENSIONS } from "../constants";
import "./FileLoader.css";

const acceptStr = ALLOWED_FILE_EXTENSIONS.join(",");

export function FileLoader() {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [wizardData, setWizardData] = useState<PreParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file extension "${ext}". Allowed: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = preParseCsv(text);
      if (isParseError(result)) {
        setError(result.message);
      } else {
        setWizardData(result);
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }, []);

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
          accept={acceptStr}
          onChange={handleFileChange}
          hidden
        />
        <span className="file-loader__text">
          Drop CSV/TXT file here or click to browse
        </span>
      </div>
      {error && (
        <ErrorModal message={error} onClose={() => setError(null)} />
      )}
      {wizardData && (
        <ImportWizard
          columns={wizardData.columns}
          rows={wizardData.rows}
          onClose={() => setWizardData(null)}
          onError={(msg) => {
            setWizardData(null);
            setError(msg);
          }}
        />
      )}
    </>
  );
}
