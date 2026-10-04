/**
 * Analytics — /analytics
 *
 * Faculty Progress Analytics + Career Milestone Timeline.
 * Calls only GET /api/reports/analytics/:userId — a single new endpoint
 * that aggregates existing DB data.  No mock or hardcoded data.
 *
 * Section 1 — Achievement Analytics
 *   • 4 stat cards: Total, Approved, Pending, Rejected
 *   • Horizontal bar chart: approved count per category (recharts BarChart —
 *     already in the bundle from Dashboard.jsx)
 *   • Yearly activity table: approved achievements per calendar year (5 yrs)
 *
 * Section 2 — Career Milestone Timeline
 *   • Each milestone_template rendered as a timeline entry
 *   • Sorted: achieved (with completion date) → in-progress (% desc) → not started
 *   • Status dot: green = achieved, amber = in-progress, gray = not started
 *   • Inline progress bar per milestone
 *   • Time-window constraint shown when present
 *   • No government/promotion rules — driven entirely by HOD-configured milestone_templates
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

// Reuse same colour map as Dashboard.jsx
const TYPE_COLORS = {
  publication:   "#2563eb",
  certification: "#16a34a",
  conference:    "#d97706",
  workshop:      "#7c3aed",
  research:      "#0891b2",
  patent:        "#dc2626",
  teaching:      "#059669",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function milestoneState(m) {
  if (m.achieved)          return "achieved";
  if (m.current_count > 0) return "progress";
  return "pending";
}

function dotLabel(state) {
  if (state === "achieved") return "✓";
  if (state === "progress") return "…";
  return "○";
}

function formatDate(iso) {
  if (!iso) return null;
  // Handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS" shapes
  const d = new Date(iso.length > 10 ? iso : iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { user }              = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get(`/reports/analytics/${user.id}`)
      .then(({ data: d }) => setData(d))
      .catch(err => setError(err.response?.data?.error || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return (
    <div className="loading"><div className="spinner" />Loading analytics…</div>
  );

  if (error) return (
    <div className="page-body">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  // ── Derive summary counts ───────────────────────────────────────────────────
  const statusMap = {};
  (data.statusCounts || []).forEach(r => { statusMap[r.status] = r.count; });
  const total    = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const approved = statusMap.approved || 0;
  const pending  = statusMap.pending  || 0;
  const rejected = statusMap.rejected || 0;

  const hasTypeData   = (data.typeCounts  || []).length > 0;
  const hasYearlyData = (data.yearly      || []).length > 0;

  // ── Sort milestones: achieved → in-progress (% desc) → not started ─────────
  const sortedMilestones = [...(data.milestoneProgress || [])].sort((a, b) => {
    const stateOrder = { achieved: 0, progress: 1, pending: 2 };
    const sa = milestoneState(a), sb = milestoneState(b);
    if (stateOrder[sa] !== stateOrder[sb]) return stateOrder[sa] - stateOrder[sb];
    return b.percentage - a.percentage;
  });

  const achievedCount  = sortedMilestones.filter(m => m.achieved).length;
  const inProgressCount = sortedMilestones.filter(m => !m.achieved && m.current_count > 0).length;
  const overallPct     = sortedMilestones.length > 0
    ? Math.round((achievedCount / sortedMilestones.length) * 100)
    : 0;

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Progress Analytics</h2>
          <p>
            {user.designation || "Faculty"}
            {user.department ? ` · ${user.department}` : ""}
          </p>
        </div>
        <Link to="/progress" className="btn btn-secondary btn-sm">
          ← Back to Progress
        </Link>
      </div>

      <div className="page-body">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — Achievement Analytics
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 6 }}>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-700)",
                       marginBottom: 16, textTransform: "uppercase",
                       letterSpacing: "0.05em" }}>
            Achievement Analytics
          </h3>
        </div>

        {/* Stat cards */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Submitted</div>
            <div className="stat-value">{total}</div>
            <div className="stat-sub">All achievements</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{approved}</div>
            <div className="stat-sub">Verified by HOD / Admin</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: "var(--warning)" }}>{pending}</div>
            <div className="stat-sub">Awaiting verification</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Need Attention</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>{rejected}</div>
            <div className="stat-sub">Rejected — resubmit</div>
          </div>
        </div>

        {/* Charts row */}
        <div
          className="grid-2 analytics-grid"
          style={{ marginBottom: 24, gridTemplateColumns: "1fr 1fr" }}
        >
          {/* Approved by category */}
          <div className="card">
            <div className="card-header">
              <h3>Approved by Category</h3>
            </div>
            <div className="card-body">
              {hasTypeData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.typeCounts}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 4, left: 20 }}
                  >
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => [v, "Approved"]} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.typeCounts.map(entry => (
                        <Cell
                          key={entry.type_code}
                          fill={TYPE_COLORS[entry.type_code] || "var(--gray-400)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p>No approved achievements yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Yearly activity table */}
          <div className="card">
            <div className="card-header">
              <h3>Yearly Activity (last 5 years)</h3>
            </div>
            <div className="card-body" style={{ padding: "12px 0" }}>
              {hasYearlyData ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th style={{ textAlign: "right" }}>Approved</th>
                        <th>Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.yearly.map(row => {
                        const maxCount = Math.max(...data.yearly.map(r => r.count), 1);
                        const pct = Math.round((row.count / maxCount) * 100);
                        return (
                          <tr key={row.year}>
                            <td style={{ fontWeight: 600 }}>{row.year}</td>
                            <td style={{ textAlign: "right", color: "var(--success)", fontWeight: 600 }}>
                              {row.count}
                            </td>
                            <td style={{ width: "45%" }}>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No approved activity in the last 5 years</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Career Milestone Timeline
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center",
                      justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-700)",
                       textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Career Milestone Timeline
          </h3>
          <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: "var(--gray-500)" }}>
            <span>
              <span style={{ color: "var(--success)", fontWeight: 700 }}>{achievedCount}</span> achieved
            </span>
            <span>
              <span style={{ color: "var(--warning)", fontWeight: 700 }}>{inProgressCount}</span> in progress
            </span>
            <span>
              <span style={{ fontWeight: 700 }}>{overallPct}%</span> overall
            </span>
          </div>
        </div>

        {sortedMilestones.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p>No milestones configured yet. Ask your HOD to set milestone requirements.</p>
            </div>
          </div>
        ) : (
          <div className="timeline">
            {sortedMilestones.map((m) => {
              const state    = milestoneState(m);
              const pctWidth = `${m.percentage}%`;

              return (
                <div key={m.milestone_id} className="timeline-item">
                  {/* Dot + connector track */}
                  <div className="timeline-track">
                    <div className={`timeline-dot ${state}`}>
                      {dotLabel(state)}
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="timeline-content">
                    <div className="timeline-title">{m.milestone_name}</div>

                    <div className="timeline-meta">
                      {/* Category */}
                      <span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                          <path d="M3 3v18h18"/>
                          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                        </svg>
                        {m.type_label}
                      </span>

                      {/* Time window constraint */}
                      {m.time_window_months && (
                        <span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Within {m.time_window_months} months
                        </span>
                      )}

                      {/* Achieved on */}
                      {state === "achieved" && m.achieved_on && (
                        <span style={{ color: "var(--success)", fontWeight: 600 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Completed {formatDate(m.achieved_on)}
                        </span>
                      )}

                      {/* In-progress indicator */}
                      {state === "progress" && (
                        <span style={{ color: "var(--warning)" }}>
                          {m.current_count} of {m.required_count} required
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {m.description && (
                      <p style={{ fontSize: "0.78rem", color: "var(--gray-400)",
                                  marginBottom: 10, lineHeight: 1.5 }}>
                        {m.description}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div className="timeline-progress-row">
                      <div className="timeline-progress-bar">
                        <div
                          className={`timeline-progress-fill ${state}`}
                          style={{ width: pctWidth }}
                        />
                      </div>
                      <span className="timeline-progress-label">
                        {m.current_count} / {m.required_count}
                      </span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700,
                                     color: state === "achieved"
                                       ? "var(--success)"
                                       : state === "progress"
                                         ? "var(--warning)"
                                         : "var(--gray-400)" }}>
                        {m.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
