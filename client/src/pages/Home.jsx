/**
 * Home — /home
 *
 * Public landing page for FCAT.
 * Typography-led, centered hero. No fake data. No mock metrics.
 * Sections: navbar · hero · purpose · roles · process · CTA · footer.
 */

import React from "react";
import { Link } from "react-router-dom";

// ── Icons (inline SVG, no library) ────────────────────────────────────────────
const IconBrand = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
       stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconTrack = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconProgress = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 3v18h18"/>
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
  </svg>
);
const IconDevelop = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
       stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Section data ───────────────────────────────────────────────────────────────
const PURPOSE = [
  {
    icon:  <IconTrack />,
    title: "Track Achievements",
    desc:  "Record publications, certifications, conferences, workshops, research projects, patents, and academic activities in one structured place.",
  },
  {
    icon:  <IconProgress />,
    title: "Monitor Progress",
    desc:  "Track career milestones and understand progress toward institution-defined advancement goals over time.",
  },
  {
    icon:  <IconDevelop />,
    title: "Support Development",
    desc:  "Manage professional growth plans and support structured faculty development through a dedicated coordinator workflow.",
  },
];

const ROLES = [
  {
    key:  "faculty",
    cls:  "rf-faculty",
    icon: "🎓",
    tag:  "Academic Career",
    name: "Faculty",
    desc: "Track achievements, milestones, and career progress toward institutional advancement.",
  },
  {
    key:  "coordinator",
    cls:  "rf-coordinator",
    icon: "📋",
    tag:  "Faculty Development",
    name: "Coordinator",
    desc: "Support faculty development and manage structured professional growth plans.",
  },
  {
    key:  "admin",
    cls:  "rf-admin",
    icon: "🏛️",
    tag:  "Institutional Management",
    name: "Admin / HOD",
    desc: "Manage users, verify achievements, and oversee institutional progress.",
  },
];

const STEPS = [
  { num: "01", verb: "Record",  title: "Add Achievements",   desc: "Log professional activities with supporting evidence." },
  { num: "02", verb: "Track",   title: "Monitor Milestones", desc: "See progress against institution-defined career targets." },
  { num: "03", verb: "Develop", title: "Support Growth",     desc: "Manage professional development through growth plans." },
  { num: "04", verb: "Report",  title: "Review Progress",    desc: "Generate and share career achievement reports." },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="home-page">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="home-header">
        <div className="home-header-inner">
          <span className="home-brand" aria-label="FCAT — Faculty Career Advancement Tracker">
            <span className="home-brand-icon" aria-hidden="true"><IconBrand /></span>
            <span className="home-brand-text">
              <span className="home-brand-name">FCAT</span>
              <span className="home-brand-sub">Faculty Career Advancement Tracker</span>
            </span>
          </span>
          <nav className="home-header-nav" aria-label="Site navigation">
            <Link to="/login"               className="hp-btn-ghost">Sign In</Link>
            <Link to="/login?mode=register" className="hp-btn-solid">Create Account</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="home-hero" aria-labelledby="fcat-title">
        <div className="home-wrap-narrow">
          <p className="home-hero-label" aria-hidden="true">
            Faculty Career Management Platform
          </p>
          <h1 id="fcat-title">Faculty Career<br />Advancement Tracker</h1>
          <p className="home-hero-desc">
            A centralized platform to record faculty achievements, track career
            milestones, and support professional growth.
          </p>
          <p className="home-hero-desc2">
            Designed to bring career progress, professional development, and
            institutional tracking into one place.
          </p>
          <div className="home-hero-actions">
            <Link to="/login" className="hp-btn-cta">
              Sign In <IconArrow />
            </Link>
            <Link to="/login?mode=register" className="hp-btn-cta-outline">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Purpose ────────────────────────────────────────────────────────── */}
      <section className="home-purpose" aria-labelledby="purpose-heading">
        <div className="home-wrap">
          <h2 className="home-purpose-heading" id="purpose-heading">
            Built to support faculty career growth
          </h2>
          <p className="home-purpose-lead">
            FCAT brings achievements, milestones, professional development, and
            progress tracking together in one structured platform.
          </p>
          <div className="home-purpose-cols">
            {PURPOSE.map(({ icon, title, desc }) => (
              <div key={title} className="home-purpose-col">
                <div className="home-purpose-col-icon" aria-hidden="true">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────────────────────────── */}
      <section className="home-roles" aria-labelledby="roles-heading">
        <div className="home-wrap">
          <span className="home-roles-eyebrow" aria-hidden="true">User Roles</span>
          <h2 className="home-roles-heading" id="roles-heading">
            Who uses FCAT?
          </h2>
          <div className="home-roles-cols">
            {ROLES.map(({ key, cls, icon, tag, name, desc }) => (
              <article key={key} className={`home-role-col ${cls}`}>
                <span className="home-role-col-icon" aria-hidden="true">{icon}</span>
                <h3>{name}</h3>
                <span className="home-role-col-tag">{tag}</span>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ────────────────────────────────────────────────────────── */}
      <section className="home-process" aria-labelledby="process-heading">
        <div className="home-wrap">
          <h2 className="home-process-heading" id="process-heading">
            From achievement to advancement
          </h2>
          <div className="home-process-steps">
            {STEPS.map(({ num, verb, title, desc }) => (
              <div key={num} className="home-process-step">
                <p className="home-step-num">{num} — {verb}</p>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="home-cta" aria-labelledby="cta-heading">
        <div className="home-wrap-narrow">
          <h2 id="cta-heading">Ready to start tracking your career progress?</h2>
          <p>
            Create your FCAT account and begin organizing your professional
            journey.
          </p>
          <div className="home-cta-btns">
            <Link to="/login?mode=register" className="hp-btn-cta-inv">
              Create Account
            </Link>
            <Link to="/login" className="hp-btn-cta-inv-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-footer-brand">
          <span className="home-footer-name">FCAT</span>
          <span className="home-footer-tagline">Faculty Career Advancement Tracker</span>
        </div>
        <nav className="home-footer-links" aria-label="Footer navigation">
          <Link to="/login"               className="home-footer-link">Sign In</Link>
          <Link to="/login?mode=register" className="home-footer-link">Create Account</Link>
        </nav>
      </footer>

    </div>
  );
}
