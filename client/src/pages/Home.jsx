/**
 * Home — /home
 *
 * Professional public landing page for FCAT.
 * No API calls. No mock data. Static illustrative card only.
 */

import React from "react";
import { Link } from "react-router-dom";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconBrand = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
       stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconAchievement = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconMilestone = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
  </svg>
);
const IconGrowth = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
  </svg>
);
const IconReport = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon:  <IconAchievement />,
    title: "Track Achievements",
    desc:  "Publications, certifications, conferences, workshops, research projects, patents, and academic activities.",
  },
  {
    icon:  <IconMilestone />,
    title: "Monitor Milestones",
    desc:  "Understand career progress against institution-defined milestones with clear visual indicators.",
  },
  {
    icon:  <IconGrowth />,
    title: "Manage Growth Plans",
    desc:  "Support structured faculty professional development with coordinator-managed growth plans.",
  },
  {
    icon:  <IconReport />,
    title: "Generate Reports",
    desc:  "Create clear progress and achievement reports as downloadable career profiles.",
  },
];

const ROLES = [
  {
    key:   "faculty",
    cls:   "rc-faculty",
    icon:  "🎓",
    label: "Academic Career",
    title: "Faculty",
    desc:  "Track achievements, career milestones, and progress toward institutional advancement goals.",
  },
  {
    key:   "coordinator",
    cls:   "rc-coordinator",
    icon:  "📋",
    label: "Faculty Development",
    title: "Coordinator",
    desc:  "Manage faculty growth plans, monitor professional development, and support advancement.",
  },
  {
    key:   "admin",
    cls:   "rc-admin",
    icon:  "🏛️",
    label: "Institutional Management",
    title: "Admin / HOD",
    desc:  "Manage users, verify achievement submissions, and oversee institutional career progress.",
  },
];

const FLOW = [
  { num: "01", label: "Record", title: "Add Achievements",  desc: "Log publications, certifications, conferences, and other professional activities with supporting evidence." },
  { num: "02", label: "Track",  title: "Monitor Progress",  desc: "Visualise milestone progress and see exactly how close you are to each career target." },
  { num: "03", label: "Grow",   title: "Develop Your Plan", desc: "Create and manage structured professional growth plans with coordinator support." },
  { num: "04", label: "Report", title: "Generate Reports",  desc: "Export a complete career profile PDF with achievements, milestones, and progress." },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="home-page">

      {/* ══ Header ══════════════════════════════════════════════════════════ */}
      <header className="home-header">
        <div className="home-header-inner">
          <span className="home-brand" aria-label="FCAT — Faculty Career Advancement Tracker">
            <span className="home-brand-icon" aria-hidden="true">
              <IconBrand />
            </span>
            <span className="home-brand-text">
              <span className="home-brand-name">FCAT</span>
              <span className="home-brand-tagline">Faculty Career Advancement Tracker</span>
            </span>
          </span>

          <nav className="home-header-actions" aria-label="Site actions">
            <Link to="/login"                 className="home-btn-outline">Sign In</Link>
            <Link to="/login?mode=register"   className="home-btn-primary">Create Account</Link>
          </nav>
        </div>
      </header>

      {/* ══ Hero ════════════════════════════════════════════════════════════ */}
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="home-container">
          <div className="home-hero-inner">

            {/* Left */}
            <div className="home-hero-left">
              <div className="home-eyebrow" aria-hidden="true">
                Faculty Career Management Platform
              </div>
              <p className="home-hero-kicker">Advance. Track. Grow.</p>
              <h1 id="hero-heading">
                Faculty Career<br />
                <em>Advancement</em> Tracker
              </h1>
              <p className="home-hero-desc">
                A centralized platform to track faculty achievements, monitor
                career milestones, manage professional growth, and support
                institutional advancement.
              </p>
              <div className="home-hero-cta">
                <Link to="/login" className="home-btn-cta-primary">
                  Sign In <IconArrow />
                </Link>
                <Link to="/login?mode=register" className="home-btn-cta-secondary">
                  Create Account
                </Link>
              </div>
            </div>

            {/* Right — Career progress illustration card */}
            {/* NOTE: values below are illustrative UI content only, not real data */}
            <div className="home-hero-right" aria-hidden="true">
              <div className="hero-card">
                <div className="hero-card-title">Career Progress Overview</div>

                <div className="hero-progress-row">
                  <div className="hero-progress-label">
                    <span>Overall Progress</span>
                    <span>72%</span>
                  </div>
                  <div className="hero-progress-track">
                    <div className="hero-progress-fill" style={{ width: "72%" }} />
                  </div>
                </div>

                <div className="hero-stats">
                  <div className="hero-stat">
                    <div className="hero-stat-value">18</div>
                    <div className="hero-stat-label">Achievements</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-value">6</div>
                    <div className="hero-stat-label">Milestones</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-value">2</div>
                    <div className="hero-stat-label">Growth Plans</div>
                  </div>
                </div>

                <div className="hero-status">On Track</div>
                <p className="hero-card-note">Illustrative example only</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ Trust strip ═════════════════════════════════════════════════════ */}
      <div className="home-trust" role="presentation">
        <div className="home-container">
          <div className="home-trust-inner">
            <span className="home-trust-label">Built for faculty. Designed for institutional growth.</span>
            <span className="home-trust-item"><span className="home-trust-dot" />Achievement Tracking</span>
            <span className="home-trust-item"><span className="home-trust-dot" />Career Milestones</span>
            <span className="home-trust-item"><span className="home-trust-dot" />Faculty Development</span>
          </div>
        </div>
      </div>

      {/* ══ Features ════════════════════════════════════════════════════════ */}
      <section className="home-section" aria-labelledby="features-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <span className="home-section-eyebrow">Platform Capabilities</span>
            <h2 id="features-heading">Everything you need to manage career advancement</h2>
            <p>
              FCAT brings together achievement tracking, milestone management,
              and institutional reporting into a single professional platform.
            </p>
          </div>
          <div className="home-features-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <article key={title} className="home-feature-card">
                <div className="home-feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Roles ═══════════════════════════════════════════════════════════ */}
      <section className="home-section home-section-alt" aria-labelledby="roles-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <span className="home-section-eyebrow">User Roles</span>
            <h2 id="roles-heading">Designed for every role in the advancement ecosystem</h2>
            <p>
              FCAT provides a tailored experience for each participant in the
              faculty career advancement process.
            </p>
          </div>
          <div className="home-roles-grid">
            {ROLES.map(({ key, cls, icon, label, title, desc }) => (
              <article key={key} className={`home-role-card ${cls}`}>
                <div className="home-role-icon" aria-hidden="true">{icon}</div>
                <p className="home-role-label">{label}</p>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Career Flow ═════════════════════════════════════════════════════ */}
      <section className="home-section" aria-labelledby="flow-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <span className="home-section-eyebrow">How It Works</span>
            <h2 id="flow-heading">A clear path from achievement to advancement</h2>
          </div>
          <div className="home-flow-grid">
            {FLOW.map(({ num, label, title, desc }) => (
              <div key={num} className="home-flow-step">
                <div className="home-flow-number" aria-hidden="true">{num}</div>
                <div>
                  <p className="home-flow-step-label">{label}</p>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Final CTA ═══════════════════════════════════════════════════════ */}
      <section className="home-cta-section" aria-labelledby="cta-heading">
        <div className="home-cta-inner">
          <h2 id="cta-heading">Start tracking your career advancement</h2>
          <p>
            Bring achievements, milestones, and professional growth together
            in one platform built for academic institutions.
          </p>
          <div className="home-cta-actions">
            <Link to="/login?mode=register" className="home-btn-cta-white">
              Create Account
            </Link>
            <Link to="/login" className="home-btn-cta-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══ Footer ══════════════════════════════════════════════════════════ */}
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
