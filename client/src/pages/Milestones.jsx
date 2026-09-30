import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    api.get("/milestones")
      .then(({ data }) => setMilestones(data.milestones))
      .finally(() => setLoading(false));
  }, []);

  const grouped = milestones.reduce((acc, m) => {
    const key = m.type_code;
    if (!acc[key]) acc[key] = { label: m.type_label || m.type_code, items: [] };
    acc[key].items.push(m);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Career Milestones</h2>
          <p>Institution-defined requirements for career advancement</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading"><div className="spinner"/>Loading milestones…</div>
        ) : milestones.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p>No milestone requirements configured yet. Contact your HOD or Admin.</p>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([code, group]) => (
            <div key={code} className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3>{group.label}</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Milestone</th>
                      <th>Description</th>
                      <th>Required Count</th>
                      <th>Time Window</th>
                      <th>Set by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td className="text-sm text-muted">{m.description || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{m.required_count}</td>
                        <td className="text-sm text-muted">
                          {m.time_window_months ? `Within ${m.time_window_months} months` : "No limit"}
                        </td>
                        <td className="text-sm text-muted">{m.created_by_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
