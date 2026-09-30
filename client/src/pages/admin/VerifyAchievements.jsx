import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import StatusBadge from "../../components/StatusBadge";

export default function VerifyAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [types,        setTypes]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filters,      setFilters]      = useState({ status: "pending", type_code: "" });
  const [reviewing,    setReviewing]    = useState(null); // { id, status, note }
  const [saving,       setSaving]       = useState(false);
  const [detail,       setDetail]       = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.status)    params.status    = filters.status;
    if (filters.type_code) params.type_code = filters.type_code;

    Promise.all([
      api.get("/admin/achievements", { params }),
      api.get("/achievements/types"),
    ]).then(([aRes, tRes]) => {
      setAchievements(aRes.data.achievements);
      setTypes(tRes.data.types);
    }).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitReview = async () => {
    if (!reviewing) return;
    setSaving(true);
    try {
      await api.post(`/admin/achievements/${reviewing.id}/review`, {
        status: reviewing.status,
        review_note: reviewing.note,
      });
      setReviewing(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Review failed");
    } finally {
      setSaving(false);
    }
  };

  const pendingCount   = achievements.filter(a => a.status === "pending").length;
  const approvedCount  = achievements.filter(a => a.status === "approved").length;
  const rejectedCount  = achievements.filter(a => a.status === "rejected").length;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Verify Achievements</h2>
          <p>Review and approve or reject faculty achievement submissions</p>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Showing</div>
            <div className="stat-value">{achievements.length}</div>
            <div className="stat-sub">Filtered results</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value" style={{ color: "var(--warning)" }}>{pendingCount}</div>
            <div className="stat-sub">Need review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved / Rejected</div>
            <div className="stat-value">{approvedCount} / {rejectedCount}</div>
            <div className="stat-sub">In current view</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              style={{ width: "auto", minWidth: 140 }}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filters.type_code} onChange={e => setFilters(f => ({ ...f, type_code: e.target.value }))}
              style={{ width: "auto", minWidth: 160 }}>
              <option value="">All Categories</option>
              {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner"/>Loading…</div>
          ) : achievements.length === 0 ? (
            <div className="empty-state"><p>No achievements match these filters.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Proof</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.faculty_name}</div>
                        <div className="text-xs text-muted">{a.department}</div>
                      </td>
                      <td>
                        <button style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontWeight: 500, color: "var(--primary)", fontSize: "0.875rem" }}
                          onClick={() => setDetail(a)}>
                          {a.title}
                        </button>
                        {a.review_note && <div className="text-xs text-muted" style={{ marginTop: 2 }}>Note: {a.review_note}</div>}
                      </td>
                      <td><span className="badge badge-faculty" style={{ fontSize: "0.72rem" }}>{a.type_label || a.type_code}</span></td>
                      <td className="text-sm text-muted">{a.date_achieved || "—"}</td>
                      <td>
                        {(a.files || []).length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {a.files.map(f => (
                              <a key={f.id} href={`/uploads/${f.filename}`} target="_blank" rel="noreferrer"
                                style={{ fontSize: "0.75rem", color: "var(--primary)" }}>
                                📎 {f.original_name}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">None</span>
                        )}
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        {a.status === "pending" && (
                          <div className="flex gap-2">
                            <button className="btn btn-success btn-sm"
                              onClick={() => setReviewing({ id: a.id, status: "approved", note: "" })}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => setReviewing({ id: a.id, status: "rejected", note: "" })}>
                              Reject
                            </button>
                          </div>
                        )}
                        {a.status !== "pending" && (
                          <span className="text-xs text-muted">Reviewed by {a.reviewer_name || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="modal-backdrop" onClick={() => setReviewing(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{reviewing.status === "approved" ? "Approve Achievement" : "Reject Achievement"}</h3>
              <button className="modal-close" onClick={() => setReviewing(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="review_note">Review Note {reviewing.status === "rejected" ? "(required)" : "(optional)"}</label>
                <textarea id="review_note" rows={3}
                  placeholder={reviewing.status === "rejected" ? "Reason for rejection, what needs to be fixed…" : "Optional comment for the faculty…"}
                  value={reviewing.note}
                  onChange={e => setReviewing(r => ({ ...r, note: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReviewing(null)}>Cancel</button>
              <button
                className={`btn ${reviewing.status === "approved" ? "btn-success" : "btn-danger"}`}
                onClick={submitReview}
                disabled={saving || (reviewing.status === "rejected" && !reviewing.note.trim())}
              >
                {saving ? "Saving…" : reviewing.status === "approved" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Achievement Details</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px 16px", fontSize: "0.875rem" }}>
                <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Faculty</dt>
                <dd>{detail.faculty_name} ({detail.department})</dd>
                <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Title</dt>
                <dd style={{ fontWeight: 500 }}>{detail.title}</dd>
                <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Category</dt>
                <dd>{detail.type_label || detail.type_code}</dd>
                <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Issuer</dt>
                <dd>{detail.issuer || "—"}</dd>
                <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Date</dt>
                <dd>{detail.date_achieved || "—"}</dd>
                <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Status</dt>
                <dd><StatusBadge status={detail.status} /></dd>
                {detail.description && <>
                  <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Description</dt>
                  <dd>{detail.description}</dd>
                </>}
                {detail.url && <>
                  <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>URL</dt>
                  <dd><a href={detail.url} target="_blank" rel="noreferrer">{detail.url}</a></dd>
                </>}
                {(detail.files || []).length > 0 && <>
                  <dt style={{ color: "var(--gray-500)", fontWeight: 500 }}>Proof Files</dt>
                  <dd>
                    {detail.files.map(f => (
                      <div key={f.id}>
                        <a href={`/uploads/${f.filename}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.82rem" }}>
                          📎 {f.original_name}
                        </a>
                      </div>
                    ))}
                  </dd>
                </>}
              </dl>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              {detail.status === "pending" && (
                <>
                  <button className="btn btn-success" onClick={() => { setDetail(null); setReviewing({ id: detail.id, status: "approved", note: "" }); }}>Approve</button>
                  <button className="btn btn-danger"  onClick={() => { setDetail(null); setReviewing({ id: detail.id, status: "rejected", note: "" }); }}>Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
