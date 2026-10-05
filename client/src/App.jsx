import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import Login              from "./pages/Login";
import Home               from "./pages/Home";
import Dashboard          from "./pages/Dashboard";
import Achievements       from "./pages/Achievements";
import AddEditAchievement from "./pages/AddEditAchievement";
import Milestones         from "./pages/Milestones";
import Progress           from "./pages/Progress";
import Report             from "./pages/Report";

// Admin pages
import FacultyOverview    from "./pages/admin/FacultyOverview";
import VerifyAchievements from "./pages/admin/VerifyAchievements";
import MilestoneConfig    from "./pages/admin/MilestoneConfig";
import ManageUsers        from "./pages/admin/ManageUsers";
import FacultyProgress    from "./pages/admin/FacultyProgress";

// Coordinator pages
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import GrowthPlans          from "./pages/coordinator/GrowthPlans";

// Analytics (Lesson 8)
import Analytics from "./pages/Analytics";

// ─── Route guards ────────────────────────────────────────────────────────────

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"/>Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function RequireStaff({ children }) {
  const { user, loading, isStaff } = useAuth();
  if (loading)   return <div className="loading"><div className="spinner"/>Loading…</div>;
  if (!user)     return <Navigate to="/login" replace />;
  if (!isStaff)  return <Navigate to="/dashboard" replace />;
  return children;
}

// RequireFaculty: faculty only.
// Redirects isStaff → /admin/overview (unchanged).
// Redirects isCoordinator → /coordinator/dashboard (new — prevents coordinators
// landing on faculty pages since they are not isStaff).
function RequireFaculty({ children }) {
  const { user, loading, isStaff, isCoordinator } = useAuth();
  if (loading)        return <div className="loading"><div className="spinner"/>Loading…</div>;
  if (!user)          return <Navigate to="/login" replace />;
  if (isStaff)        return <Navigate to="/admin/overview" replace />;
  if (isCoordinator)  return <Navigate to="/coordinator/dashboard" replace />;
  return children;
}

// RequireCoordinator: coordinator role only.
function RequireCoordinator({ children }) {
  const { user, loading, isCoordinator } = useAuth();
  if (loading)       return <div className="loading"><div className="spinner"/>Loading…</div>;
  if (!user)         return <Navigate to="/login" replace />;
  if (!isCoordinator) return <Navigate to="/login" replace />;
  return children;
}

// RootRedirect: unauthenticated → /home; authenticated → role dashboard.
function RootRedirect() {
  const { user, loading, isStaff, isCoordinator } = useAuth();
  if (loading)        return <div className="loading"><div className="spinner"/>Loading…</div>;
  if (!user)          return <Navigate to="/home" replace />;
  if (isStaff)        return <Navigate to="/admin/overview" replace />;
  if (isCoordinator)  return <Navigate to="/coordinator/dashboard" replace />;
  return              <Navigate to="/dashboard" replace />;
}

// ─── App ─────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/home"  element={<Home />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Faculty routes */}
      <Route path="/dashboard" element={
        <RequireFaculty><Layout><Dashboard /></Layout></RequireFaculty>
      }/>
      <Route path="/achievements" element={
        <RequireFaculty><Layout><Achievements /></Layout></RequireFaculty>
      }/>
      <Route path="/achievements/add" element={
        <RequireFaculty><Layout><AddEditAchievement /></Layout></RequireFaculty>
      }/>
      <Route path="/achievements/edit/:id" element={
        <RequireFaculty><Layout><AddEditAchievement /></Layout></RequireFaculty>
      }/>
      <Route path="/milestones" element={
        <RequireAuth><Layout><Milestones /></Layout></RequireAuth>
      }/>
      <Route path="/progress" element={
        <RequireFaculty><Layout><Progress /></Layout></RequireFaculty>
      }/>
      <Route path="/report" element={
        <RequireFaculty><Layout><Report /></Layout></RequireFaculty>
      }/>
      <Route path="/analytics" element={
        <RequireFaculty><Layout><Analytics /></Layout></RequireFaculty>
      }/>

      {/* Admin / HOD routes */}
      <Route path="/admin/overview" element={
        <RequireStaff><Layout><FacultyOverview /></Layout></RequireStaff>
      }/>
      <Route path="/admin/verify" element={
        <RequireStaff><Layout><VerifyAchievements /></Layout></RequireStaff>
      }/>
      <Route path="/admin/milestones" element={
        <RequireStaff><Layout><MilestoneConfig /></Layout></RequireStaff>
      }/>
      <Route path="/admin/users" element={
        <RequireStaff><Layout><ManageUsers /></Layout></RequireStaff>
      }/>
      <Route path="/admin/progress/:userId" element={
        <RequireStaff><Layout><FacultyProgress /></Layout></RequireStaff>
      }/>
      <Route path="/admin/report/:userId" element={
        <RequireStaff><Layout><Report /></Layout></RequireStaff>
      }/>

      {/* Coordinator routes */}
      <Route path="/coordinator/dashboard" element={
        <RequireCoordinator><Layout><CoordinatorDashboard /></Layout></RequireCoordinator>
      }/>
      <Route path="/coordinator/growth-plans" element={
        <RequireCoordinator><Layout><GrowthPlans /></Layout></RequireCoordinator>
      }/>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
