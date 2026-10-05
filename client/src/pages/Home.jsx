/**
 * Home — /home
 *
 * Public landing page for FCAT.
 * Minimal, centered, typography-led. No fake data. No decorative clutter.
 */

import React from "react";
import { Link } from "react-router-dom";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IconBrand = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M12 14l9-5-9-5-9 5 9 5z"/>
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="hp-page">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="hp-nav">
        <div className="hp-nav-inner">
          <span className="hp-nav-brand" aria-label="FCAT">
            <span className="hp-nav-mark" aria-hidden="true"><IconBrand /></span>
            <span className="hp-nav-name">FCAT</span>
          </span>
          <nav className="hp-nav-actions" aria-label="Site navigation">
            <Link to="/login"               className="hp2-ghost">Sign In</Link>
            <Link to="/login?mode=register" className="hp2-solid">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hp-hero" aria-labelledby="hp-title">
        <div className="hp-center">
          <p className="hp-eyebrow">Faculty Career Management</p>
          <h1 id="hp-title" className="hp-h1">
            Faculty Career<br />Advancement Tracker
          </h1>
          <p className="hp-subtitle">
            A simple platform to track faculty achievements, career milestones,
            and professional growth.
          </p>
          <div className="hp-actions">
            <Link to="/login?mode=register" className="hp2-solid hp2-lg">Get Started</Link>
            <Link to="/login"               className="hp2-ghost hp2-lg">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── Role strip ───────────────────────────────────────────────────── */}
      <section className="hp-roles-strip" aria-label="User roles">
        <div className="hp-roles-strip-inner">
          <div className="hp-role-item hp-role-faculty">
            <span className="hp-role-name">Faculty</span>
            <span className="hp-role-desc">Track achievements and career progress</span>
          </div>
          <span className="hp-role-sep" aria-hidden="true" />
          <div className="hp-role-item hp-role-coord">
            <span className="hp-role-name">Coordinator</span>
            <span className="hp-role-desc">Support faculty development</span>
          </div>
          <span className="hp-role-sep" aria-hidden="true" />
          <div className="hp-role-item hp-role-admin">
            <span className="hp-role-name">Admin / HOD</span>
            <span className="hp-role-desc">Manage users and oversee progress</span>
          </div>
        </div>
      </section>

      {/* ── Features trio ────────────────────────────────────────────────── */}
      <section className="hp-features" aria-labelledby="hp-features-title">
        <div className="hp-center">
          <h2 id="hp-features-title" className="hp-section-title">
            Achievements → Progress → Career Growth
          </h2>
          <div className="hp-feat-grid">
            <div className="hp-feat">
              <span className="hp-feat-num" aria-hidden="true">01</span>
              <h3 className="hp-feat-title">Track Achievements</h3>
              <p className="hp-feat-desc">
                Record publications, certifications, conferences, workshops,
                research projects, patents, and teaching activities.
              </p>
            </div>
            <div className="hp-feat">
              <span className="hp-feat-num" aria-hidden="true">02</span>
              <h3 className="hp-feat-title">Monitor Milestones</h3>
              <p className="hp-feat-desc">
                Understand career progress against institution-defined milestones.
                See exactly where each faculty member stands.
              </p>
            </div>
            <div className="hp-feat">
              <span className="hp-feat-num" aria-hidden="true">03</span>
              <h3 className="hp-feat-title">Support Development</h3>
              <p className="hp-feat-desc">
                Coordinators create growth plans. Faculty, coordinators, and admins
                each have a clear view of career progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="hp-cta" aria-labelledby="hp-cta-title">
        <div className="hp-center">
          <h2 id="hp-cta-title" className="hp-cta-title">
            Ready to get started?
          </h2>
          <p className="hp-cta-sub">
            Create an account and begin organizing your professional journey.
          </p>
          <div className="hp-actions">
            <Link to="/login?mode=register" className="hp2-inv hp2-lg">Get Started</Link>
            <Link to="/login"               className="hp2-inv-ghost hp2-lg">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="hp-footer">
        <span className="hp-footer-brand">FCAT — Faculty Career Advancement Tracker</span>
        <nav className="hp-footer-links" aria-label="Footer">
          <Link to="/login"               className="hp-footer-link">Sign In</Link>
          <Link to="/login?mode=register" className="hp-footer-link">Get Started</Link>
        </nav>
      </footer>

    </div>
  );
}
