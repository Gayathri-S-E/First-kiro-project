/**
 * CoordinatorDashboard — /coordinator/dashboard
 *
 * Reads from GET /api/coordinator/dashboard (coordinator-only endpoint).
 * All data is derived from existing tables — no new business logic.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function CoordinatorDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get("/coordinator/dashboard")
      .then(({ data: d }) => setData(d))
      .catch(err => setError(err.response?.data?.error || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading dashboard…</div>;

  if (error) return (
    <div className="page-body">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  const { faculty_count, achievement_counts, milestone_count, faculty_progress } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Coordinator Dashboard</h2>
          <p>Faculty development overview — derived from existing achievement and milestone data</p>
        </div>
        <Link to="/coordinator/growth-plans" className="btn btn-primary btn-sm">
          View Growth Plans
        </Link>
      </div>

      <div className="page-body">

        {/* ── Summary stat cards ─────────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Faculty</div>
            <div className="stat-value">{faculty_count}</div>
            <div className="stat-sub">Active faculty members</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Achievements</div>
            <div className="stat-value">{achievement_counts.total}</div>
            <div className="stat-sub">Across all faculty</div>
          </div>
          <div className="stat-card accent-success">
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {achievement_counts.approved}
            </div>
            <div className="stat-sub">Verified achievements</div>
          </div>
          <div className="stat-card accent-warning">
            <div className="stat-label">Pending</div>
            <div className="stat-value" style={{ color: "var(--warning)" }}>
              {achievement_counts.pending}
            </div>
            <div className="stat-sub">Awaiting review</div>
          </div>
          <div className="stat-card accent-danger">
            <div className="stat-label">Rejected</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>
              {achievement_counts.rejected}
            </div>
            <div className="stat-sub">Need attention</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Milestones</div>
            <div className="stat-value">{milestone_count}</div>
            <div className="stat-sub">Active templates</div>
          </div>
        </div>

        {/* ── Per-faculty progress table ─────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <h3>Faculty Achievement Progress</h3>
          </div>

          {faculty_progress.length === 0 ? (
            <div className="empty-state">
              <p>No faculty members found.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "right" }}>Approved</th>
                    <th style={{ textAlign: "right" }}>Pending</th>
                    <th style={{ textAlign: "right" }}>Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty_progress.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600 }}>{f.name}</td>
                      <td className="text-sm text-muted">{f.department || <span style={{ color: "var(--gray-300)" }}>—</span>}</td>
                      <td className="text-sm text-muted">{f.designation || <span style={{ color: "var(--gray-300)" }}>—</span>}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{f.total_achievements}</td>
                      <td style={{ textAlign: "right", color: "var(--success)", fontWeight: 600 }}>{f.approved}</td>
                      <td style={{ textAlign: "right", color: "var(--warning)" }}>{f.pending}</td>
                      <td style={{ textAlign: "right", color: "var(--danger)" }}>{f.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
