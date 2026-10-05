/**
 * Home — /home
 *
 * Public landing page for FCAT.
 * Shows hero, feature overview, and role cards.
 * Unauthenticated visitors land here; authenticated users are redirected
 * by RootRedirect before they ever reach this component.
 *
 * No API calls. No hardcoded user data. No backend changes.
 */

import React from "react";
import { Link } from "react-router-dom";

// ── Inline SVG icons (no icon library) ───────────────────────────────────────
const IconAchievement = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconMilestone = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
  </svg>
);
const IconGrowth = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
  </svg>
);
const IconInstitution = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

// ── Feature data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <IconAchievement />,
    title: "Track Achievements",
    desc:  "Record publications, certifications, conferences, workshops, research projects, patents, and academic activities in one organised place.",
  },
  {
    icon: <IconMilestone />,
    title: "Monitor Career Progress",
    desc:  "Visualise progress against institution-defined career milestones and see exactly how close you are to each target.",
  },
  {
    icon: <IconGrowth />,
    title: "Manage Faculty Growth",
    desc:  "Coordinators can create and track personalised faculty development growth plans, supporting long-term professional advancement.",
  },
  {
    icon: <IconInstitution />,
    title: "Institutional Oversight",
    desc:  "Admins and HODs can verify submissions, configure milestone requirements, manage user accounts, and generate career reports.",
  },
];

// ── Role data ─────────────────────────────────────────────────────────────────
const ROLES = [
  {
    key:     "faculty",
    cls:     "role-faculty",
    icon:    "🎓",
    label:   "Academic Career",
    title:   "Faculty",
    desc:    "Track achievements, career milestones, and progress toward institutional advancement goals.",
  },
  {
    key:     "coordinator",
    cls:     "role-coordinator",
    icon:    "📋",
    label:   "Faculty Development",
    title:   "Coordinator",
    desc:    "Manage faculty growth plans, monitor professional development, and support advancement.",
  },
  {
    key:     "admin",
    cls:     "role-admin",
    icon:    "🏛️",
    label:   "Institutional Management",
    title:   "Admin / HOD",
    desc:    "Manage users, verify achievement submissions, and oversee institutional career progress.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="home-page">

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <nav className="home-nav" aria-label="Site navigation">
        <span className="home-nav-brand" aria-label="FCAT">
          <IconLogo />
          FCAT
        </span>
        <div className="home-nav-actions">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/login?mode=register" className="btn btn-primary btn-sm">
            Create Account
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="home-hero-inner">
          <div className="home-hero-badge" aria-hidden="true">
            ✦ Faculty Career Advancement Tracker
          </div>

          <h1 id="hero-heading">Career Advancement Tracker</h1>

          <p>
            Track faculty achievements, monitor career milestones, manage
            professional growth, and support institutional career advancement
            in one place.
          </p>

          <div className="home-hero-actions">
            <Link to="/login" className="btn-hero-primary">
              Sign In <IconArrow />
            </Link>
            <Link to="/login?mode=register" className="btn-hero-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── What FCAT does ───────────────────────────────────────────────── */}
      <section className="home-section home-features" aria-labelledby="features-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <p className="home-section-eyebrow">Platform Features</p>
            <h2 id="features-heading">Everything in one place</h2>
            <p>
              FCAT brings together achievement tracking, milestone management,
              and institutional reporting into a single, streamlined platform.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <article key={title} className="feature-card">
                <div className="feature-icon" aria-hidden="true">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ───────────────────────────────────────────────────────── */}
      <section className="home-section home-roles" aria-labelledby="roles-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <p className="home-section-eyebrow" style={{ color: "var(--role-coord-accent)" }}>
              User Roles
            </p>
            <h2 id="roles-heading">Roles in FCAT</h2>
            <p>
              FCAT supports three distinct roles, each with a tailored
              experience designed for their responsibilities.
            </p>
          </div>

          <div className="roles-grid">
            {ROLES.map(({ key, cls, icon, label, title, desc }) => (
              <article key={key} className={`role-card ${cls}`}>
                <div className="role-card-icon" aria-hidden="true">{icon}</div>
                <p className="role-card-label">{label}</p>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <strong>FCAT</strong> — Faculty Career Advancement Tracker
      </footer>

    </div>
  );
}
