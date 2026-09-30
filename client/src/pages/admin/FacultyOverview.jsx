import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

const TYPE_CODES = ["publication","certification","conference","workshop","research","patent","teaching"];

export default function FacultyOverview() {
  const [overview,    setOverview]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter,      setFilter]      = useState({ dept: "" });
  const [loading,     setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/admin/overview"),
      api.get("/admin/departments"),
    ]).then(([oRes, dRes]) => {
      setOverview(oRes.data.overview);
      setDepartments(dRes.data.departments);
    }).finally(() => setLoading(false));
  }, []);

  const displayed = filter.dept
    ? overview.filter(f => f.department === filter.dept)
    : overview;

  const totalApproved = displayed.reduce((s, f) => s + f.totalApproved, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Faculty Overview</h2>
          <p>View achievement counts and progress for all faculty members</p>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Faculty</div>
            <div className="stat-value">{displayed.length}</div>
            <div className="stat-sub">Active accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Approved</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{totalApproved}</div>
            <div className="stat-sub">Across all faculty</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Departments</div>
            <div className="stat-value">{departments.length}</div>
            <div className="stat-sub">Represented</div>
          </div>
        </div>

        {/* Department filter */}
        <div className="card" style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div className="flex items-center gap-3">
            <select value={filter.dept} onChange={e => setFilter({ dept: e.target.value })}
              style={{ width: "auto", minWidth: 200 }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner"/>Loading…</div>
          ) : displayed.length === 0 ? (
            <div className="empty-state"><p>No faculty found.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Publications</th>
                    <th>Certifications</th>
                    <th>Conferences</th>
                    <th>Workshops</th>
                    <th>Research</th>
                    <th>Patents</th>
                    <th>Teaching</th>
                    <th>Total ✓</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 500 }}>{f.name}</td>
                      <td className="text-sm text-muted">{f.department || "—"}</td>
                      <td className="text-sm text-muted">{f.designation || "—"}</td>
                      {TYPE_CODES.map(tc => (
                        <td key={tc} style={{ textAlign: "center" }}>
                          <span style={{ fontWeight: 600 }}>{f.byType?.[tc]?.approved || 0}</span>
                          {(f.byType?.[tc]?.pending || 0) > 0 && (
                            <span style={{ fontSize: "0.7rem", color: "var(--warning)", marginLeft: 4 }}>
                              +{f.byType[tc].pending}
                            </span>
                          )}
                        </td>
                      ))}
                      <td style={{ textAlign: "center", fontWeight: 700, color: "var(--success)" }}>
                        {f.totalApproved}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/progress/${f.id}`)}>
                          View
                        </button>
                      </td>
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
