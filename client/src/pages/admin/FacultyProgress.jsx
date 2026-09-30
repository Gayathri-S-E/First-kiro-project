import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import ProgressBar from "../../components/ProgressBar";

export default function FacultyProgress() {
  const { userId } = useParams();
  const navigate   = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/milestones/progress/${userId}`)
      .then(({ data }) => setData(data))
      .catch(() => navigate("/admin/overview"))
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  if (loading) return <div className="loading"><div className="spinner"/>Loading…</div>;

  const achieved   = (data?.progress || []).filter(p => p.achieved).length;
  const total      = (data?.progress || []).length;

  const grouped = (data?.progress || []).reduce((acc, p) => {
    if (!acc[p.type_code]) acc[p.type_code] = [];
    acc[p.type_code].push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{data?.user?.name}</h2>
          <p>{data?.user?.designation} · {data?.user?.department}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate("/admin/overview")}>← Back</button>
          <button className="btn btn-primary" onClick={() => navigate(`/admin/report/${userId}`)}>Generate Report</button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Milestones Achieved</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{achieved}</div>
            <div className="stat-sub">Out of {total} total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completion</div>
            <div className="stat-value">{total > 0 ? Math.round((achieved/total)*100) : 0}%</div>
            <div className="stat-sub">Overall progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: "var(--warning)" }}>{total - achieved}</div>
            <div className="stat-sub">Milestones remaining</div>
          </div>
        </div>

        {total === 0 ? (
          <div className="card"><div className="empty-state"><p>No milestones configured.</p></div></div>
        ) : (
          Object.entries(grouped).map(([code, items]) => (
            <div key={code} className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3 style={{ textTransform: "capitalize" }}>{code}</h3>
              </div>
              <div className="card-body">
                {items.map(p => (
                  <div key={p.milestone_id} style={{ marginBottom: 18 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {p.milestone_name}
                        {p.achieved && <span style={{ marginLeft: 8, color: "var(--success)", fontSize: "0.8rem" }}>✓</span>}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                        {p.current_count} / {p.required_count}
                      </span>
                    </div>
                    <ProgressBar value={p.current_count} max={p.required_count} showLabel={false} />
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
