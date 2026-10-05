/**
 * Login — /login
 *
 * Handles both Sign In and Create Account in a single tabbed card.
 * Arriving with ?mode=register pre-opens the registration tab (used by Home.jsx).
 *
 * NOTHING changed in the auth API calls, validation, or post-login navigation.
 * The only additions are:
 *   • useSearchParams to read ?mode=register
 *   • role field added to form state (was missing before; backend already expects it)
 *   • RoleSelector component replacing the old free-text role field
 */

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Role definitions ──────────────────────────────────────────────────────────
// `value` must match the exact string the backend accepts.
// Faculty self-registers; coordinator/admin accounts are admin-created.
const ROLES = [
  {
    value:   "faculty",
    icon:    "🎓",
    label:   "Faculty",
    desc:    "Self-register and track your career",
    selfReg: true,
  },
  {
    value:   "coordinator",
    icon:    "📋",
    label:   "Coordinator",
    desc:    "Created by an administrator",
    selfReg: false,
  },
  {
    value:   "admin",
    icon:    "🏛️",
    label:   "Admin / HOD",
    desc:    "Created by an administrator",
    selfReg: false,
  },
];

// ── RoleSelector component ────────────────────────────────────────────────────
// Only Faculty is selectable — coordinator and admin accounts must be
// created by an existing administrator, so those cards are informational only.
function RoleSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <span className="role-selector-label">
        Your Role <span className="required">*</span>
      </span>

      <div className="role-options" role="radiogroup" aria-label="Select your role">
        {ROLES.map(({ value: rv, icon, label, desc, selfReg }) => {
          if (selfReg) {
            // ── Selectable card (Faculty only) ──────────────────────────────
            return (
              <label
                key={rv}
                className="role-option"
                data-role={rv}
                title={desc}
              >
                <input
                  type="radio"
                  name="role"
                  value={rv}
                  checked={value === rv}
                  onChange={() => onChange(rv)}
                  aria-label={label}
                />
                <span className="role-option-inner">
                  <span className="role-option-icon" aria-hidden="true">{icon}</span>
                  <span className="role-option-name">{label}</span>
                  <span className="role-option-desc">{desc}</span>
                </span>
              </label>
            );
          }

          // ── Informational card (Coordinator / Admin·HOD) ────────────────
          // Not a label, no radio — purely decorative / informational.
          return (
            <div
              key={rv}
              className="role-option role-option-locked"
              data-role={rv}
              aria-label={`${label} — ${desc}`}
              title={desc}
            >
              <span className="role-option-inner">
                <span className="role-option-icon" aria-hidden="true">{icon}</span>
                <span className="role-option-name">{label}</span>
                <span className="role-option-desc">{desc}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();

  // Pre-open register tab if arriving from Home's "Create Account" button
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);

  const [form, setForm] = useState({
    name:        "",
    email:       "",
    password:    "",
    department:  "",
    designation: "",
    role:        "faculty",   // default selection
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Generic field handler
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Role selector handler
  const handleRole = (role) => setForm(f => ({ ...f, role }));

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setForm(f => ({ ...f, role: "faculty" })); // reset role on tab switch
  };

  // ── Submit — identical logic to before, role is now included in form ────────
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await login(form.email, form.password);
      } else {
        if (!form.name) {
          setError("Full name is required");
          setLoading(false);
          return;
        }
        user = await register(form); // role is now sent in the payload
      }
      // Post-login navigation — unchanged
      if (["admin", "hod"].includes(user.role))     navigate("/admin/overview");
      else if (user.role === "coordinator")          navigate("/coordinator/dashboard");
      else                                           navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Card is slightly wider in register mode to accommodate the role selector
  const cardClass = `login-card${mode === "register" ? " login-card-wide" : ""}`;

  return (
    <div className="login-page">
      <div className={cardClass}>

        {/* ── Logo + title ────────────────────────────────────────────── */}
        <div className="login-header">
          <div className="logo-icon" aria-hidden="true">🎓</div>
          <h1>Faculty Career Tracker</h1>
          <p>Track achievements, milestones &amp; career growth</p>
        </div>

        {/* ── Mode tabs ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--gray-200)",
            marginBottom: 22,
            gap: 0,
          }}
          role="tablist"
          aria-label="Authentication mode"
        >
          {[
            { key: "login",    label: "Sign In" },
            { key: "register", label: "Create Account" },
          ].map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              onClick={() => switchMode(key)}
              style={{
                flex: 1,
                padding: "8px 0",
                background: "none",
                border: "none",
                borderBottom: mode === key
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
                color: mode === key ? "var(--primary)" : "var(--gray-500)",
                fontWeight: mode === key ? 700 : 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "color 0.12s, border-color 0.12s",
                fontFamily: "var(--font)",
                letterSpacing: "0.01em",
                marginBottom: "-1px",   /* sit on top of the border */
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Error alert ─────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error" role="alert">{error}</div>
        )}

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form onSubmit={submit} noValidate>

          {/* Register-only fields */}
          {mode === "register" && (
            <>
              {/* Role selector — replaces old free-text role */}
              <RoleSelector value={form.role} onChange={handleRole} />

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="reg-name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handle}
                  placeholder="Dr. Jane Smith"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="reg-dept">Department</label>
                <input
                  id="reg-dept"
                  name="department"
                  type="text"
                  value={form.department}
                  onChange={handle}
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="reg-desig">Designation</label>
                <input
                  id="reg-desig"
                  name="designation"
                  type="text"
                  value={form.designation}
                  onChange={handle}
                  placeholder="e.g. Assistant Professor"
                />
              </div>
            </>
          )}

          {/* Shared fields */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="auth-email">
              Email <span className="required">*</span>
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              placeholder="you@institution.edu"
              autoComplete={mode === "login" ? "username" : "email"}
              required
              autoFocus={mode === "login"}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 22 }}>
            <label htmlFor="auth-password">
              Password <span className="required">*</span>
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* ── Mode switcher (below form) ───────────────────────────────── */}
        <div style={{
          textAlign: "center",
          marginTop: 18,
          fontSize: "0.84rem",
          color: "var(--gray-500)",
        }}>
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                style={{
                  background: "none", border: "none",
                  color: "var(--primary)", cursor: "pointer",
                  fontWeight: 600, fontFamily: "var(--font)", fontSize: "inherit",
                }}
                onClick={() => switchMode("register")}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                style={{
                  background: "none", border: "none",
                  color: "var(--primary)", cursor: "pointer",
                  fontWeight: 600, fontFamily: "var(--font)", fontSize: "inherit",
                }}
                onClick={() => switchMode("login")}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* ── Demo credentials hint ────────────────────────────────────── */}
        <div style={{
          marginTop: 22,
          padding: "11px 14px",
          background: "var(--gray-50)",
          borderRadius: "var(--radius)",
          fontSize: "0.73rem",
          color: "var(--gray-500)",
          lineHeight: 1.6,
        }}>
          <strong style={{ color: "var(--gray-700)" }}>Demo accounts:</strong><br />
          admin@fcat.edu / admin123 &nbsp;·&nbsp; hod@fcat.edu / hod123<br />
          priya@fcat.edu / faculty123 &nbsp;·&nbsp; arjun@fcat.edu / faculty123
        </div>

      </div>
    </div>
  );
}
