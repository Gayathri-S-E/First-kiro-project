/**
 * Login — /login
 *
 * Authentication page: Sign In and Create Account.
 * All API calls, validation, and post-login navigation are unchanged.
 * Only the visual presentation has been redesigned.
 */

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Inline SVG icons (no external library) ────────────────────────────────────
const IconFaculty = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 14l9-5-9-5-9 5 9 5z"/>
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const IconBrand = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 14l9-5-9-5-9 5 9 5z"/>
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
  </svg>
);

// ── Demo accounts for testing ─────────────────────────────────────────────────
// Fills the login form fields only — user must still click Sign In.
// These accounts must exist in the DB (created via npm run seed).
const DEMO_ACCOUNTS = [
  { role: "Faculty",      label: "Faculty",      email: "priya@fcat.edu",              password: "faculty123" },
  { role: "Coordinator",  label: "Coordinator",  email: "coordinator@demo.fcat.edu",   password: "demo1234"   },
  { role: "Admin / HOD",  label: "Admin / HOD",  email: "admin@fcat.edu",              password: "admin123"   },
];

// ── Role definitions ──────────────────────────────────────────────────────────
// selfReg: true  → selectable via radio
// selfReg: false → informational only, no radio input, no pointer events
const ROLES = [
  {
    value:   "faculty",
    label:   "Faculty",
    desc:    "Self-register and track your career",
    selfReg: true,
  },
  {
    value:   "coordinator",
    label:   "Coordinator",
    desc:    "Account created by an administrator",
    selfReg: false,
  },
  {
    value:   "admin",
    label:   "Admin / HOD",
    desc:    "Account created by an administrator",
    selfReg: false,
  },
];

// ── RoleSelector ──────────────────────────────────────────────────────────────
function RoleSelector({ value, onChange }) {
  return (
    <fieldset className="auth-role-fieldset">
      <legend className="auth-role-legend">
        Your Role <span className="required" aria-hidden="true">*</span>
      </legend>

      <div className="auth-role-grid" role="radiogroup" aria-label="Select your role">
        {ROLES.map(({ value: rv, label, desc, selfReg }) => {
          if (selfReg) {
            return (
              <label
                key={rv}
                className={`auth-role-card auth-role-selectable${value === rv ? " auth-role-selected" : ""}`}
                data-role={rv}
              >
                <input
                  type="radio"
                  name="role"
                  value={rv}
                  checked={value === rv}
                  onChange={() => onChange(rv)}
                  aria-label={label}
                  className="auth-role-radio"
                />
                <span className="auth-role-card-icon" aria-hidden="true">
                  <IconFaculty />
                </span>
                <span className="auth-role-card-name">{label}</span>
                <span className="auth-role-card-desc">{desc}</span>
                {value === rv && (
                  <span className="auth-role-selected-dot" aria-hidden="true" />
                )}
              </label>
            );
          }

          // Informational card — no radio, no pointer-events
          return (
            <div
              key={rv}
              className="auth-role-card auth-role-managed"
              data-role={rv}
              aria-label={`${label} — ${desc}`}
            >
              <span className="auth-role-card-icon auth-role-card-icon-muted" aria-hidden="true">
                <IconLock />
              </span>
              <span className="auth-role-card-name">{label}</span>
              <span className="auth-role-card-desc">{desc}</span>
              <span className="auth-managed-badge" aria-hidden="true">Admin managed</span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);

  const [form, setForm] = useState({
    name:        "",
    email:       "",
    password:    "",
    department:  "",
    designation: "",
    role:        "faculty",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle     = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleRole = (role) => setForm(f => ({ ...f, role }));

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setForm(f => ({ ...f, role: "faculty" }));
  };

  // Fill login fields with a demo account credential.
  // Does NOT log the user in — they must still click Sign In.
  const useDemoAccount = (email, password) => {
    if (mode !== "login") switchMode("login");
    setForm(f => ({ ...f, email, password }));
    setError("");
  };

  // Submit — all API logic unchanged
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await login(form.email, form.password);
      } else {
        if (!form.name) { setError("Full name is required"); setLoading(false); return; }
        user = await register(form);
      }
      if (["admin", "hod"].includes(user.role)) navigate("/admin/overview");
      else if (user.role === "coordinator")      navigate("/coordinator/dashboard");
      else                                       navigate("/dashboard");
    } catch (err) {
      // Show the real backend error message, or a meaningful network error.
      const msg = err.response?.data?.error
               || err.response?.data?.message
               || (err.response ? `Server error ${err.response.status}` : "Cannot reach the server — is the backend running?");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card${mode === "register" ? " auth-card-wide" : ""}`}>

        {/* ── Brand mark ─────────────────────────────────────────────── */}
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            <IconBrand />
          </span>
          <div className="auth-brand-text">
            <span className="auth-brand-name">Faculty Career Advancement Tracker</span>
            <span className="auth-brand-sub">Track achievements, milestones &amp; career growth</span>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <hr className="auth-divider" />

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          {[
            { key: "login",    label: "Sign In" },
            { key: "register", label: "Create Account" },
          ].map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              className={`auth-tab${mode === key ? " auth-tab-active" : ""}`}
              onClick={() => switchMode(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error" role="alert">{error}</div>
        )}

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form onSubmit={submit} noValidate>

          {mode === "register" && (
            <>
              <RoleSelector value={form.role} onChange={handleRole} />

              <div className="auth-field">
                <label htmlFor="reg-name" className="auth-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="reg-name" name="name" type="text"
                  value={form.name} onChange={handle}
                  placeholder="Dr. Jane Smith"
                  autoComplete="name" required
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-dept" className="auth-label">Department</label>
                <input
                  id="reg-dept" name="department" type="text"
                  value={form.department} onChange={handle}
                  placeholder="e.g. Computer Science"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-desig" className="auth-label">Designation</label>
                <input
                  id="reg-desig" name="designation" type="text"
                  value={form.designation} onChange={handle}
                  placeholder="e.g. Assistant Professor"
                  className="auth-input"
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">
              Email <span className="required">*</span>
            </label>
            <input
              id="auth-email" name="email" type="email"
              value={form.email} onChange={handle}
              placeholder="you@institution.edu"
              autoComplete={mode === "login" ? "username" : "email"}
              required autoFocus={mode === "login"}
              className="auth-input"
            />
          </div>

          <div className="auth-field auth-field-last">
            <label htmlFor="auth-password" className="auth-label">
              Password <span className="required">*</span>
            </label>
            <input
              id="auth-password" name="password" type="password"
              value={form.password} onChange={handle}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* ── Mode switcher ───────────────────────────────────────────── */}
        <p className="auth-switch">
          {mode === "login" ? (
            <>Don&apos;t have an account?{" "}
              <button className="auth-switch-btn" onClick={() => switchMode("register")} type="button">
                Create Account
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button className="auth-switch-btn" onClick={() => switchMode("login")} type="button">
                Sign In
              </button>
            </>
          )}
        </p>

        {/* ── Demo accounts panel ─────────────────────────────────────── */}
        {/* Development / testing only. Fills email + password fields.     */}
        {/* User must still click Sign In — no auth bypass.                */}
        <div className="demo-panel">
          <p className="demo-panel-label">Test Accounts</p>
          <div className="demo-panel-rows">
            {DEMO_ACCOUNTS.map(({ role, label, email, password }) => (
              <div key={role} className="demo-panel-row">
                <span className="demo-panel-role">{label}</span>
                <span className="demo-panel-email">{email}</span>
                <button
                  type="button"
                  className="demo-panel-btn"
                  onClick={() => useDemoAccount(email, password)}
                  aria-label={`Use demo ${label} account`}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
