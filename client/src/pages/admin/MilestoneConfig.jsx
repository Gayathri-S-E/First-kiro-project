import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client";

export default function MilestoneConfig() {
  const [milestones, setMilestones] = useState([]);
  const [types,      setTypes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [formError,  setFormError]  = useState("");
  const [saving,     setSaving]     = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/milestones"), api.get("/achievements/types")])
      .then(([mRes, tRes]) => {
        setMilestones(mRes.data.milestones);
        setTypes(tRes.data.types);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    reset({ name: "", description: "", type_code: "", required_count: 1, time_window_months: "" });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    reset({
      name:               m.name,
      description:        m.description || "",
      type_code:          m.type_code,
      required_count:     m.required_count,
      time_window_months: m.time_window_months || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    setSaving(true); setFormError("");
    try {
      const payload = {
        ...data,
        required_count:     Number(data.required_count),
        time_window_months: data.time_window_months ? Number(data.time_window_months) : null,
      };
      if (editing) {
        await api.put(`/milestones/${editing.id}`, payload);
      } else {
        await api.post("/milestones", payload);
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/milestones/${deleteId}`);
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
          <h2>Milestone Configuration</h2>
          <p>Define institution-wide career milestone requirements</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Milestone
        </button>
      </div>

      <div className="page-body">
        <div className="alert alert-info">
          Milestones defined here appear in every faculty member&apos;s progress tracker. Set counts and optional time windows — no government rules are hardcoded.
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner"/>Loading…</div>
          ) : milestones.length === 0 ? (
            <div className="empty-state"><p>No milestones yet. Add your first milestone requirement above.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Milestone Name</th>
                    <th>Category</th>
                    <th>Required Count</th>
                    <th>Time Window</th>
                    <th>Description</th>
                    <th>Created by</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.name}</td>
                      <td><span className="badge badge-faculty">{m.type_label || m.type_code}</span></td>
                      <td style={{ fontWeight: 600 }}>{m.required_count}</td>
                      <td className="text-sm text-muted">
                        {m.time_window_months ? `${m.time_window_months} months` : "No limit"}
                      </td>
                      <td className="text-sm text-muted">{m.description || "—"}</td>
                      <td className="text-sm text-muted">{m.created_by_name || "—"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(m.id)}>Delete</button>
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Milestone" : "Add Milestone"}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Milestone Name <span className="required">*</span></label>
                    <input type="text" placeholder="e.g. Senior Research Milestone"
                      {...register("name", { required: "Name is required" })} />
                    {errors.name && <span className="field-error">{errors.name.message}</span>}
                  </div>

                  <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    <select {...register("type_code", { required: "Category is required" })}>
                      <option value="">Select…</option>
                      {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                    {errors.type_code && <span className="field-error">{errors.type_code.message}</span>}
                  </div>

                  <div className="form-group">
                    <label>Required Count <span className="required">*</span></label>
                    <input type="number" min={1} {...register("required_count", { required: true, min: 1 })} />
                    {errors.required_count && <span className="field-error">Must be at least 1</span>}
                  </div>

                  <div className="form-group span-2">
                    <label>Time Window (months) — leave blank for no limit</label>
                    <input type="number" min={1} placeholder="e.g. 36 for 3 years"
                      {...register("time_window_months")} />
                  </div>

                  <div className="form-group span-2">
                    <label>Description</label>
                    <textarea rows={2} placeholder="Explain this milestone to faculty…" {...register("description")} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update Milestone" : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Milestone</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>This will remove the milestone requirement for all faculty. Their progress data is not affected.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
