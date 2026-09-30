import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [form, setForm]       = useState({ name: "", email: "", password: "", department: "", designation: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await login(form.email, form.password);
      } else {
        if (!form.name) { setError("Full name is required"); setLoading(false); return; }
        user = await register(form);
      }
      navigate(["admin","hod"].includes(user.role) ? "/admin/overview" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">🎓</div>
          <h1>Faculty Career Tracker</h1>
          <p>Track achievements, milestones &amp; career growth</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="name">Full Name <span className="required">*</span></label>
                <input id="name" name="name" type="text" value={form.name} onChange={handle} placeholder="Dr. Jane Smith" required />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="department">Department</label>
                <input id="department" name="department" type="text" value={form.department} onChange={handle} placeholder="e.g. Computer Science" />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="designation">Designation</label>
                <input id="designation" name="designation" type="text" value={form.designation} onChange={handle} placeholder="e.g. Assistant Professor" />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input id="email" name="email" type="email" value={form.email} onChange={handle} placeholder="you@institution.edu" required autoFocus={mode === "login"} />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input id="password" name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: "0.85rem", color: "var(--gray-500)" }}>
          {mode === "login" ? (
            <>Don&apos;t have an account?{" "}
              <button style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                onClick={() => { setMode("register"); setError(""); }}>Register</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
            </>
          )}
        </div>

        <div style={{ marginTop: 24, padding: "12px 16px", background: "var(--gray-50)", borderRadius: "var(--radius)", fontSize: "0.75rem", color: "var(--gray-500)" }}>
          <strong>Demo accounts:</strong><br />
          admin@fcat.edu / admin123 &nbsp;·&nbsp; hod@fcat.edu / hod123<br />
          priya@fcat.edu / faculty123 &nbsp;·&nbsp; arjun@fcat.edu / faculty123
        </div>
      </div>
    </div>
  );
}
