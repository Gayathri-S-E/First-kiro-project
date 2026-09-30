import React, { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import ProgressBar from "../components/ProgressBar";

export default function Progress() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/milestones/progress/${user.id}`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="loading"><div className="spinner"/>Loading progress…</div>;

  const achieved = (data?.progress || []).filter(p => p.achieved).length;
  const total    = (data?.progress || []).length;
  const overallPct = total > 0 ? Math.round((achieved / total) * 100) : 0;

  // Group progress by type for display
  const grouped = (data?.progress || []).reduce((acc, p) => {
    const k = p.type_code;
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <h2>My Progress</h2>
          <p>Track how close you are to each career milestone</p>
        </div>
      </div>

      <div className="page-body">
        {/* Overall summary */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Overall Completion</div>
            <div className="stat-value">{overallPct}%</div>
            <div className="stat-sub">{achieved} of {total} milestones achieved</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Milestones Achieved</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{achieved}</div>
            <div className="stat-sub">Fully completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: "var(--warning)" }}>{total - achieved}</div>
            <div className="stat-sub">Still to complete</div>
          </div>
        </div>

        {total === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p>No milestones configured yet. Ask your HOD to set milestone requirements.</p>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([typeCode, items]) => (
            <div key={typeCode} className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3>{items[0]?.type_code.charAt(0).toUpperCase() + items[0]?.type_code.slice(1)}</h3>
              </div>
              <div className="card-body">
                {items.map(p => (
                  <div key={p.milestone_id} style={{ marginBottom: 20 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.milestone_name}</span>
                        {p.achieved && (
                          <span style={{ marginLeft: 8, color: "var(--success)", fontSize: "0.8rem" }}>✓ Achieved</span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                        {p.current_count} / {p.required_count}
                        {p.time_window_months ? ` (within ${p.time_window_months} mo)` : ""}
                      </span>
                    </div>
                    <ProgressBar value={p.current_count} max={p.required_count} showLabel={false} />
                    {p.description && (
                      <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 4 }}>{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
