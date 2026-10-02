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
};

export default function Layout({ children }) {
  const { user, logout, isStaff, isCoordinator } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = user?.name
    ? user.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Career Advancement Tracker</h1>
          <span>Faculty Management</span>
        </div>

        <nav className="sidebar-nav">
          {!isStaff && !isCoordinator && (
            <>
              <div className="nav-section">Faculty</div>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/dashboard">
                {Icons.dashboard} Dashboard
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/achievements">
                {Icons.achievement} Achievements
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/milestones">
                {Icons.milestone} Milestones
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/progress">
                {Icons.progress} My Progress
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/report">
                {Icons.report} Generate Report
              </NavLink>
            </>
          )}

          {isStaff && (
            <>
              <div className="nav-section">Admin</div>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/admin/overview">
                {Icons.overview} Faculty Overview
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/admin/verify">
                {Icons.verify} Verify Achievements
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/admin/milestones">
                {Icons.config} Milestone Config
              </NavLink>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/admin/users">
                {Icons.users} Manage Users
              </NavLink>
            </>
          )}

          {isCoordinator && (
            <>
              <div className="nav-section">Coordinator</div>
              <NavLink className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} to="/coordinator/dashboard">
                {Icons.overview} Dashboard
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
