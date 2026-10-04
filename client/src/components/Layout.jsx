import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Icons = {
  dashboard:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  achievement:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  milestone:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>,
  progress:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  report:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  verify:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  users:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  config:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg>,
  overview:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  analytics:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  growthplan:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
};

// Role identity labels shown below the logo
const ROLE_LABELS = {
  faculty:     "Academic Career",
  coordinator: "Faculty Development",
  admin:       "Institutional Management",
  hod:         "Department Management",
};

export default function Layout({ children }) {
  const { user, logout, isStaff, isCoordinator } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = user?.name
    ? user.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const role       = user?.role || "faculty";
  const roleLabel  = ROLE_LABELS[role] || role;

  const navCls = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <div className="app-shell" data-role={role}>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <h1>FCAT</h1>
          <span>Faculty Career Advancement</span>
        </div>

        {/* Role identity strip */}
        <div className={`sidebar-role-strip role-${role}`}>
          {roleLabel}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {!isStaff && !isCoordinator && (
            <>
              <div className="nav-section">Career</div>
              <NavLink className={navCls} to="/dashboard"    aria-label="Dashboard">    {Icons.dashboard}  Dashboard</NavLink>
              <NavLink className={navCls} to="/achievements" aria-label="Achievements"> {Icons.achievement} Achievements</NavLink>
              <NavLink className={navCls} to="/milestones"   aria-label="Milestones">   {Icons.milestone}  Milestones</NavLink>
              <NavLink className={navCls} to="/progress"     aria-label="My Progress">  {Icons.progress}   My Progress</NavLink>
              <NavLink className={navCls} to="/analytics"    aria-label="Analytics">    {Icons.analytics}  Analytics</NavLink>
              <NavLink className={navCls} to="/report"       aria-label="Career Report">{Icons.report}     Career Report</NavLink>
            </>
          )}

          {isStaff && (
            <>
              <div className="nav-section">Management</div>
              <NavLink className={navCls} to="/admin/overview">   {Icons.overview}   Faculty Overview</NavLink>
              <NavLink className={navCls} to="/admin/verify">     {Icons.verify}     Verify Achievements</NavLink>
              <NavLink className={navCls} to="/admin/milestones"> {Icons.config}     Milestone Config</NavLink>
              <NavLink className={navCls} to="/admin/users">      {Icons.users}      Manage Users</NavLink>
            </>
          )}

          {isCoordinator && (
            <>
              <div className="nav-section">Development</div>
              <NavLink className={navCls} to="/coordinator/dashboard">    {Icons.overview}   Dashboard</NavLink>
              <NavLink className={navCls} to="/coordinator/growth-plans"> {Icons.growthplan} Growth Plans</NavLink>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar" aria-hidden="true">{initials}</div>
            <div className="min-w-0">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{role}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} aria-label="Sign out">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
