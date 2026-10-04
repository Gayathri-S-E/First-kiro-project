/**
 * GrowthPlans — /coordinator/growth-plans
 *
 * Coordinator-only page for managing faculty development growth plans.
 * Full CRUD: list, create, edit, delete.
 * Uses existing card/form/table/badge CSS classes — no new styles needed.
 */

import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUSES = ["planned", "in_progress", "completed", "cancelled"];

const STATUS_LABELS = {
  planned:     "Planned",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

const STATUS_BADGE = {
  planned:     "badge-pending",
  in_progress: "badge-warning",
  completed:   "badge-approved",
  cancelled:   "badge-rejected",
};

// ── Small presentational badge ────────────────────────────────────────────────
function StatusPill({ status }) {
  const cls = STATUS_BADGE[status] || "badge";
  return <span className={`badge ${cls}`}>{STATUS_LABELS[status] || status}</span>;
}

// ── Blank form state ──────────────────────────────────────────────────────────
const BLANK = {
  faculty_id:  "",
  title:       "",
  description: "",
  target_date: "",
  status:      "planned",
  notes:       "",
};

export default function GrowthPlans() {
  const { user }              = useAuth();
  const [plans,    setPlans]  = useState([]);
  const [faculty,  setFaculty]= useState([]);
  const [loading,  setLoading]= useState(true);
  const [error,    setError]  = useState(null);

  // modal / form state
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState(null);   // plan object | null
  const [form,        setForm]        = useState(BLANK);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState(null);

  // delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // filters
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");

  // ── data fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(() => {
    const params = {};
    if (filterFaculty) params.faculty_id = filterFaculty;
    if (filterStatus)  params.status     = filterStatus;

    Promise.all([
      api.get("/coordinator/growth-plans", { params }),
      api.get("/coordinator/faculty"),
    ])
      .then(([plansRes, facRes]) => {
        setPlans(plansRes.data.growth_plans);
        setFaculty(facRes.data.faculty);
      })
      .catch(err => setError(err.response?.data?.error || "Failed to load data"))
      .finally(() => setLoading(false));
  }, [filterFaculty, filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── form helpers ────────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(BLANK);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(plan) {
    setEditing(plan);
    setForm({
      faculty_id:  plan.faculty_id,
      title:       plan.title,
      description: plan.description || "",
      target_date: plan.target_date || "",
      status:      plan.status,
      notes:       plan.notes || "",
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(BLANK);
    setFormError(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/coordinator/growth-plans/${editing.id}`, form);
      } else {
        await api.post("/coordinator/growth-plans", form);
      }
      closeForm();
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/coordinator/growth-plans/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Faculty Growth Plans</h2>
          <p className="text-sm" style={{ color: "var(--gray-500)", marginTop: 2 }}>
            Create and manage development plans for faculty members
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </svg>
          New Plan
        </button>
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
              <label>Filter by Faculty</label>
              <select
                value={filterFaculty}
                onChange={e => setFilterFaculty(e.target.value)}
              >
                <option value="">All faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label>Filter by Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            {(filterFaculty || filterStatus) && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 1 }}
                onClick={() => { setFilterFaculty(""); setFilterStatus(""); }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Plans table ───────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <h3>Growth Plans ({plans.length})</h3>
          </div>
          {plans.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center", color: "var(--gray-500)" }}>
              <p style={{ marginBottom: 12 }}>No growth plans yet.</p>
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                Create the first plan
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Goal / Title</th>
                    <th>Status</th>
                    <th>Target Date</th>
                    <th>Department</th>
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{plan.faculty_name}</div>
                        {plan.faculty_designation && (
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                            {plan.faculty_designation}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{plan.title}</div>
                        {plan.description && (
                          <div style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: 2 }}>
                            {plan.description.length > 80
                              ? plan.description.slice(0, 80) + "…"
                              : plan.description}
                          </div>
                        )}
                      </td>
                      <td><StatusPill status={plan.status} /></td>
                      <td style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
                        {plan.target_date || <span style={{ color: "var(--gray-400)" }}>—</span>}
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
                        {plan.faculty_department || <span style={{ color: "var(--gray-400)" }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(plan)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(plan)}
                          >
                            Delete
                          </button>
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

      {/* ── Create / Edit modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editing ? "Edit Growth Plan" : "New Growth Plan"}</h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>
                )}

                <div className="form-grid">
                  {/* Faculty — only selectable on create */}
                  <div className="form-group span-2">
                    <label>
                      Faculty Member <span className="required">*</span>
                    </label>
                    <select
                      name="faculty_id"
                      value={form.faculty_id}
                      onChange={handleChange}
                      disabled={!!editing}
                      required
                    >
                      <option value="">Select faculty member…</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name}{f.department ? ` — ${f.department}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group span-2">
                    <label>Goal / Title <span className="required">*</span></label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Publish 2 research papers in IEEE journals"
                      required
                    />
                  </div>

                  <div className="form-group span-2">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Details about the development goal…"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Date</label>
                    <input
                      type="date"
                      name="target_date"
                      value={form.target_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group span-2">
                    <label>Coordinator Notes</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Optional internal notes…"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Delete Growth Plan</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--gray-700)" }}>
                Delete plan <strong>"{deleteTarget.title}"</strong> for{" "}
                <strong>{deleteTarget.faculty_name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
