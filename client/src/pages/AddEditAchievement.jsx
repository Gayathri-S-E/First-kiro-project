import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../api/client";
import FileUpload from "../components/FileUpload";

export default function AddEditAchievement() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [types,   setTypes]   = useState([]);
  const [files,   setFiles]   = useState([]);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoad,setInitLoad] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    api.get("/achievements/types").then(({ data }) => setTypes(data.types));
    if (isEdit) {
      api.get(`/achievements/${id}`)
        .then(({ data }) => {
          const a = data.achievement;
          reset({
            title:         a.title,
            type_code:     a.type_code,
            description:   a.description || "",
            date_achieved: a.date_achieved || "",
            issuer:        a.issuer || "",
            url:           a.url || "",
          });
        })
        .catch(() => navigate("/achievements"))
        .finally(() => setInitLoad(false));
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setError(""); setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") formData.append(k, v); });
      files.forEach(f => formData.append("files", f));

      if (isEdit) {
        await api.put(`/achievements/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/achievements", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      navigate("/achievements");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save achievement");
    } finally {
      setLoading(false);
    }
  };

  if (initLoad) return <div className="loading"><div className="spinner"/>Loading…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{isEdit ? "Edit Achievement" : "Add Achievement"}</h2>
          <p>{isEdit ? "Update details of a pending achievement" : "Submit a new achievement for verification"}</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid">
                {/* Title */}
                <div className="form-group span-2">
                  <label htmlFor="title">Title <span className="required">*</span></label>
                  <input id="title" type="text" placeholder="e.g. Research paper title, certification name…"
                    {...register("title", { required: "Title is required" })} />
                  {errors.title && <span className="field-error">{errors.title.message}</span>}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label htmlFor="type_code">Category <span className="required">*</span></label>
                  <select id="type_code" {...register("type_code", { required: "Category is required" })}>
                    <option value="">Select category…</option>
                    {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </select>
                  {errors.type_code && <span className="field-error">{errors.type_code.message}</span>}
                </div>

                {/* Date */}
                <div className="form-group">
                  <label htmlFor="date_achieved">Date Achieved</label>
                  <input id="date_achieved" type="date" {...register("date_achieved")} />
                </div>

                {/* Issuer */}
                <div className="form-group">
                  <label htmlFor="issuer">Issuer / Publisher / Organiser</label>
                  <input id="issuer" type="text" placeholder="e.g. IEEE, Springer, NASSCOM…"
                    {...register("issuer")} />
                </div>

                {/* URL */}
                <div className="form-group">
                  <label htmlFor="url">URL / DOI (optional)</label>
                  <input id="url" type="url" placeholder="https://doi.org/…" {...register("url")} />
                </div>

                {/* Description */}
                <div className="form-group span-2">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" rows={3} placeholder="Brief description, abstract, or notes…"
                    {...register("description")} />
                </div>

                {/* File upload */}
                <div className="form-group span-2">
                  <label>Proof Documents</label>
                  <FileUpload files={files} onChange={setFiles} />
                  <p className="text-xs text-muted mt-1">
                    Upload certificate scans, acceptance letters, DOI proofs, etc.
                    {isEdit && " New files will be appended to existing ones."}
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => navigate("/achievements")}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving…" : isEdit ? "Update Achievement" : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
