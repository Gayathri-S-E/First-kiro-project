# FCAT --- Frontend Conventions

## Stack

React 18 + Vite 5. No CSS framework (no Tailwind). No global state library.
All CSS is in client/src/index.css as custom properties and utility classes.

## Project Structure

client/src/
  api/client.js          # Axios instance -- the only place HTTP calls are made
  context/AuthContext.jsx # Global auth state (user, login, logout, register)
  components/            # Shared presentational components
  pages/                 # One file per route; pages/ admin/ for admin-only pages
  App.jsx                # BrowserRouter + route definitions + route guards
  main.jsx               # ReactDOM.createRoot entry point
  index.css              # ALL styles -- design tokens, layout, components, utilities

## Routing (react-router-dom v6)

All authenticated routes are wrapped in Layout. Three route guard components in App.jsx:

  RequireAuth     -- redirects to /login if not authenticated
  RequireFaculty  -- blocks unauthenticated; redirects admin/hod to /admin/overview
  RequireStaff    -- blocks unauthenticated; redirects faculty to /dashboard

Route map:
  /login                          Login (no Layout)
  /dashboard                      Dashboard (RequireFaculty)
  /achievements                   Achievements (RequireFaculty)
  /achievements/add               AddEditAchievement (RequireFaculty)
  /achievements/edit/:id          AddEditAchievement (RequireFaculty)
  /milestones                     Milestones (RequireAuth -- both roles)
  /progress                       Progress (RequireFaculty)
  /report                         Report (RequireFaculty)
  /admin/overview                 FacultyOverview (RequireStaff)
  /admin/verify                   VerifyAchievements (RequireStaff)
  /admin/milestones               MilestoneConfig (RequireStaff)
  /admin/users                    ManageUsers (RequireStaff)
  /admin/progress/:userId         FacultyProgress (RequireStaff)
  /admin/report/:userId           Report (RequireStaff -- same component, reads useParams)

## Auth Context (useAuth hook)

Import: import { useAuth } from '../context/AuthContext'

Provides: user, loading, login, logout, register, isAdmin, isHod, isStaff

  isStaff = isAdmin || isHod

Token stored as fcat_token in localStorage. User object stored as fcat_user.
Axios interceptor attaches Bearer token automatically to every request.
On 401 response the interceptor clears localStorage and redirects to /login.

## API Client (client/src/api/client.js)

import api from '../api/client'   // axios instance with baseURL '/api'

All calls use this instance -- never use fetch() or a raw axios import.
The proxy in vite.config.js forwards /api and /uploads to http://localhost:3001.

## Shared Components

Layout.jsx        -- App shell: fixed 240px dark sidebar + main content area.
                     Renders role-conditional nav links using react-router NavLink.
                     SVG icons defined inline as an Icons object -- no icon library.

StatusBadge.jsx   -- Pure presentational: renders span with class badge-{status}.
                     Statuses: pending | approved | rejected
                     Usage: <StatusBadge status={ach.status} />

ProgressBar.jsx   -- Renders .progress-bar / .progress-fill with aria attributes.
                     Props: value, max, showLabel (default true)
                     Adds .complete class (green fill) when value >= max.

FileUpload.jsx    -- Drag-and-drop + click-to-browse file picker.
                     Props: files (array), onChange (setter), maxFiles (default 5)
                     Accepted types: .pdf .doc .docx .jpg .jpeg .png

## Forms

Use react-hook-form for all form state and validation.
On submit build a FormData object for achievement forms (multipart upload).
Pre-populate edit forms via reset() after fetching the resource.

## CSS Conventions

All design tokens are CSS custom properties on :root in index.css:
  --primary / --primary-dark / --primary-light
  --success / --success-light
  --warning / --warning-light
  --danger  / --danger-light
  --gray-50 through --gray-900
  --radius / --radius-lg
  --shadow-sm / --shadow / --shadow-md / --shadow-lg
  --font: 'Inter', system-ui, -apple-system, sans-serif

Add new styles to index.css following the existing section structure.
Do NOT introduce Tailwind, CSS Modules, or styled-components.
Use the existing utility classes (.flex, .gap-2, .mt-3, .text-sm, etc.) before adding new ones.
Key component classes: .card, .btn .btn-primary/secondary/danger/sm/lg, .badge, .alert, .modal

## Charts

recharts is used only in Dashboard.jsx. Use BarChart for new charts; match the
existing color-per-type pattern if adding achievement-type breakdowns.

## PDF Export

jspdf + jspdf-autotable. All PDF logic lives in Report.jsx (exportPdf function).
PDF is generated client-side on demand -- no server involvement.
