import React from "react";

export default function ProgressBar({ value, max, showLabel = true }) {
  const pct     = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const complete = value >= max;
  return (
    <div>
      <div className="progress-bar">
        <div
          className={`progress-fill${complete ? " complete" : ""}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.75rem", color: "var(--gray-500)" }}>
          <span>{value} / {max}</span>
          <span>{pct}%</span>
        </div>
      )}
    </div>
  );
}
