import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

export default function ManageUsers() {
  const { isAdmin } = useAuth();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const [formError, setFormError] = useState("");
  const [saving,    setSaving]    = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get("/admin/users")
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    reset({ name: "", email: "", password: "", role: "faculty", department: "", designation: "" });
    setFormError("");
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    setSaving(true); setFormError("");
    try {
      if (data.role === "faculty") {
        await api.post("/auth/register", data);
      } else {
        await api.post("/admin/users", data);
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
      await api.delete(`/admin/users/${deleteId}`);
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
          <h2>Manage Users</h2>
          <p>View and manage faculty and administrator accounts</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner"/>Loading…</div>
          ) : users.length === 0 ? (
            <div className="empty-state"><p>No users found.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joined</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td className="text-sm text-muted">{u.email}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td className="text-sm text-muted">{u.department || "—"}</td>
                      <td className="text-sm text-muted">{u.designation || "—"}</td>
                      <td className="text-sm text-muted">{u.created_at?.slice(0, 10) || "—"}</td>
                      {isAdmin && (
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(u.id)}>
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add User</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Full Name <span className="required">*</span></label>
                    <input type="text" {...register("name", { required: "Required" })} />
                    {errors.name && <span className="field-error">{errors.name.message}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" {...register("email", { required: "Required" })} />
                    {errors.email && <span className="field-error">{errors.email.message}</span>}
                  </div>
                  <div className="form-group">
                    <label>Password <span className="required">*</span></label>
                    <input type="password" {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 chars" } })} />
                    {errors.password && <span className="field-error">{errors.password.message}</span>}
                  </div>
                  <div className="form-group">
                    <label>Role <span className="required">*</span></label>
                    <select {...register("role", { required: "Required" })}>
                      <option value="faculty">Faculty</option>
                      <option value="hod">HOD</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input type="text" {...register("department")} />
                  </div>
                  <div className="form-group span-2">
                    <label>Designation</label>
                    <input type="text" {...register("designation")} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Creating…" : "Create User"}
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
              <h3>Remove User</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>This will permanently delete the user and all their achievements. This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
