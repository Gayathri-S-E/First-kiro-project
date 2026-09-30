import React, { useRef, useState } from "react";

export default function FileUpload({ files, onChange, maxFiles = 5 }) {
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const addFiles = (newFiles) => {
    const merged = [...files];
    for (const f of newFiles) {
      if (merged.length < maxFiles) merged.push(f);
    }
    onChange(merged);
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <div
        className={`file-drop${dragover ? " dragover" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto", display: "block" }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ marginTop: 8, display: "block" }}>
          {files.length === 0 ? "Click or drag proof files here" : `${files.length} file(s) selected — click to add more`}
        </span>
        <p>PDF, Word, JPG, PNG · max 10 MB each · up to {maxFiles} files</p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className="file-chip">
              📎 {f.name}
              <button type="button" onClick={() => removeFile(i)} aria-label="Remove file">×</button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = ""; }}
      />
    </div>
  );
}
