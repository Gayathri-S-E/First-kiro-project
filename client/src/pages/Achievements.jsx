import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function Achievements() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [types,        setTypes]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filters,      setFilters]      = useState({ type_code: "", status: "" });
  const [deleteId,     setDeleteId]     = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.type_code) params.type_code = filters.type_code;
    if (filters.status)    params.status    = filters.status;

    Promise.all([
      api.get("/achievements", { params }),
      api.get("/achievements/types"),
    ]).then(([aRes, tRes]) => {
      setAchievements(aRes.data.achievements);
      setTypes(tRes.data.types);
    }).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/achievements/${id}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>My Achievements</h2>
          <p>All submitted achievements and their verification status</p>
        </div>
        <Link to="/achievements/add" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Achievement
        </Link>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filters.type_code} onChange={e => setFilters(f => ({ ...f, type_code: e.target.value }))}
              style={{ width: "auto", minWidth: 160 }}>
              <option value="">All Categories</option>
              {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              style={{ width: "auto", minWidth: 140 }}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            {(filters.type_code || filters.status) && (
              <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ type_code: "", status: "" })}>
                Clear Filters
              </button>
            )}
            <span className="text-sm text-muted" style={{ marginLeft: "auto" }}>
              {achievements.length} result{achievements.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner"/>Loading…</div>
          ) : achievements.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              <p>No achievements found.<br/>
                <Link to="/achievements/add">Add your first achievement →</Link>
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Issuer/Publisher</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Proof</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.title}</div>
                        {a.review_note && a.status === "rejected" && (
                          <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: 3 }}>
                            ⚠ {a.review_note}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-faculty" style={{ fontSize: "0.72rem" }}>
                          {types.find(t => t.code === a.type_code)?.label || a.type_code}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{a.issuer || "—"}</td>
                      <td className="text-sm text-muted">{a.date_achieved || "—"}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        {(a.files || []).length > 0 ? (
                          <span style={{ fontSize: "0.78rem", color: "var(--success)" }}>
                            📎 {a.files.length}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "var(--gray-300)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {a.status === "pending" && (
                            <>
                              <button className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/achievements/edit/${a.id}`)}>Edit</button>
                              <button className="btn btn-danger btn-sm"
                                onClick={() => setDeleteId(a.id)}>Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Achievement</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this achievement? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
