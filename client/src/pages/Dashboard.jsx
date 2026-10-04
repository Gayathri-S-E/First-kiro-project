import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

// One color per achievement type — matches existing admin pages
const TYPE_COLORS = {
  publication:   "#2563eb",
  certification: "#16a34a",
  conference:    "#d97706",
  workshop:      "#7c3aed",
  research:      "#0891b2",
  patent:        "#dc2626",
  teaching:      "#059669",
};

// Inline SVG icons for quick-link cards (no external library)
const QuickIcons = {
  milestones: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         width="22" height="22">
      <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         width="22" height="22">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         width="22" height="22">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
};

export default function Dashboard() {
  const { user }             = useAuth();
  const [stats,   setStats]  = useState(null);
  const [loading, setLoading]= useState(true);
  const [error,   setError]  = useState(null);

  useEffect(() => {
    api.get(`/reports/dashboard/${user.id}`)
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return (
    <div className="loading"><div className="spinner" />Loading dashboard…</div>
  );

  if (error) return (
    <div className="page-body">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  // Derive counts from API response
  const statusMap = {};
  (stats?.statusCounts || []).forEach(r => { statusMap[r.status] = r.count; });
  const total    = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const approved = statusMap.approved || 0;
  const pending  = statusMap.pending  || 0;
  const rejected = statusMap.rejected || 0;

  const hasChartData   = (stats?.typeCounts  || []).length > 0;
  const hasMonthlyData = (stats?.monthly     || []).length > 0;
  const hasRecent      = (stats?.recent      || []).length > 0;

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>
            {user.designation || "Faculty"}
            {user.department ? ` · ${user.department}` : ""}
          </p>
        </div>
        <Link to="/achievements/add" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Add Achievement
        </Link>
      </div>

      <div className="page-body">

        {/* ── Welcome banner ─────────────────────────────────────────────── */}
        <div className="welcome-banner">
          <div>
            <h3>Welcome back, {user.name}</h3>
            <p>Track your achievements, review milestone progress, and export your career profile.</p>
          </div>
          <div className="welcome-banner-actions">
            <Link to="/milestones" className="btn btn-secondary btn-sm">Milestones</Link>
            <Link to="/progress"   className="btn btn-secondary btn-sm">My Progress</Link>
          </div>
        </div>

        {/* ── Status stat cards ──────────────────────────────────────────── */}
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

        {/* ── Charts ─────────────────────────────────────────────────────── */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <h3>Approved by Category</h3>
            </div>
            <div className="card-body">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.typeCounts}
                    margin={{ top: 4, right: 8, bottom: 4, left: -10 }}
                  >
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v, "Count"]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.typeCounts.map((entry) => (
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

          <div className="card">
            <div className="card-header">
              <h3>Monthly Activity (12 months)</h3>
            </div>
            <div className="card-body">
              {hasMonthlyData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.monthly}
                    margin={{ top: 4, right: 8, bottom: 4, left: -10 }}
                  >
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p>No approved activity in the last 12 months</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent achievements ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Recent Achievements</h3>
            <Link to="/achievements" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {hasRecent ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.title}</td>
                      <td>
                        <span className="badge" style={{
                          background: "var(--primary-light)",
                          color: "var(--primary-dark)",
                        }}>
                          {a.type_label}
                        </span>
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-muted text-sm">
                        {a.date_achieved || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>
                No achievements yet.{" "}
                <Link to="/achievements/add">Add your first one →</Link>
              </p>
            </div>
          )}
        </div>

        {/* ── Quick links ─────────────────────────────────────────────────── */}
        <div className="grid-3">
          {[
            {
              to:        "/milestones",
              icon:      QuickIcons.milestones,
              label:     "View Milestones",
              sub:       "Check your career milestone requirements",
              iconColor: "var(--primary)",
              iconBg:    "var(--primary-light)",
            },
            {
              to:        "/progress",
              icon:      QuickIcons.progress,
              label:     "My Progress",
              sub:       "See how far you are toward each goal",
              iconColor: "var(--success)",
              iconBg:    "var(--success-light)",
            },
            {
              to:        "/report",
              icon:      QuickIcons.report,
              label:     "Career Report",
              sub:       "Export your career profile as PDF",
              iconColor: "var(--warning)",
              iconBg:    "var(--warning-light)",
            },
          ].map(({ to, icon, label, sub, iconColor, iconBg }) => (
            <Link key={to} to={to} className="quick-link-card">
              <div className="quick-link-icon" style={{ background: iconBg, color: iconColor }}>
                {icon}
              </div>
              <div className="quick-link-label">{label}</div>
              <div className="quick-link-sub">{sub}</div>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
