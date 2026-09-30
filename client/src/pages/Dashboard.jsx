import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

const TYPE_COLORS = {
  publication:"#2563eb", certification:"#16a34a", conference:"#d97706",
  workshop:"#7c3aed", research:"#0891b2", patent:"#dc2626", teaching:"#059669",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,  setStats]  = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/reports/dashboard/${user.id}`),
    ]).then(([{ data }]) => {
      setStats(data);
    }).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="loading"><div className="spinner"/>Loading dashboard…</div>;

  const statusMap = {};
  (stats?.statusCounts || []).forEach(r => { statusMap[r.status] = r.count; });

  const total    = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const approved = statusMap.approved || 0;
  const pending  = statusMap.pending  || 0;
  const rejected = statusMap.rejected || 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Welcome back, {user.name.split(" ")[0]} 👋</h2>
          <p>{user.designation || "Faculty"} · {user.department || "—"}</p>
        </div>
        <Link to="/achievements/add" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Achievement
        </Link>
      </div>

      <div className="page-body">
        {/* Status Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Submitted</div>
            <div className="stat-value">{total}</div>
            <div className="stat-sub">All achievements</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{approved}</div>
            <div className="stat-sub">Verified by HOD/Admin</div>
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

        <div className="grid-2" style={{ gap: 20 }}>
          {/* Achievements by type bar chart */}
          <div className="card">
            <div className="card-header"><h3>Approved by Category</h3></div>
            <div className="card-body">
              {(stats?.typeCounts || []).length === 0 ? (
                <div className="empty-state"><p>No approved achievements yet</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.typeCounts} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v, "Count"]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(stats.typeCounts || []).map((entry) => (
                        <Cell key={entry.type_code} fill={TYPE_COLORS[entry.type_code] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Monthly activity */}
          <div className="card">
            <div className="card-header"><h3>Monthly Activity (12 months)</h3></div>
            <div className="card-body">
              {(stats?.monthly || []).length === 0 ? (
                <div className="empty-state"><p>No activity recorded yet</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthly} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3>Recent Achievements</h3>
            <Link to="/achievements" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="table-wrap">
            {(stats?.recent || []).length === 0 ? (
              <div className="empty-state">
                <p>No achievements yet. <Link to="/achievements/add">Add your first one →</Link></p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {(stats?.recent || []).map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.title}</td>
                      <td><span className="badge badge-faculty">{a.type_label}</span></td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-muted text-sm">{a.date_achieved || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid-3" style={{ marginTop: 20 }}>
          <Link to="/milestones" className="card" style={{ padding: 20, display: "block", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>🏆</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>View Milestones</div>
            <div className="text-sm text-muted">Check your career milestone requirements</div>
          </Link>
          <Link to="/progress" className="card" style={{ padding: 20, display: "block", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>📊</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>My Progress</div>
            <div className="text-sm text-muted">See how far you are toward each goal</div>
          </Link>
          <Link to="/report" className="card" style={{ padding: 20, display: "block", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>📄</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Generate Report</div>
            <div className="text-sm text-muted">Export your career profile as PDF</div>
          </Link>
        </div>
      </div>
    </>
  );
}
