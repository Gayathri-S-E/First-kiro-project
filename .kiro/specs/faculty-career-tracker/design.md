# Design — Faculty Career Advancement Tracker

## Architecture Overview

The application follows a standard client-server monorepo layout with a clear separation of concerns. No new architecture is introduced — this document describes the **existing** architecture as the canonical design.

```
F:\Kiro\
├── server/          Express + sql.js (SQLite) — REST API, port 3001
│   └── src/
│       ├── index.js          App bootstrap, middleware, route mounting
│       ├── db.js             Database initialisation and CRUD helpers
│       ├── seed.js           Demo data seeder
│       ├── middleware/
│       │   └── auth.js       JWT verification + role guard middleware
│       └── routes/
│           ├── auth.js       /api/auth/*
│           ├── achievements.js /api/achievements/*
│           ├── milestones.js /api/milestones/*
│           ├── admin.js      /api/admin/*
│           └── reports.js    /api/reports/*
│
└── client/          React 18 + Vite — SPA, port 5173 (dev) / served by Express (prod)
    └── src/
        ├── main.jsx          React DOM root
        ├── App.jsx           Router + route guards
        ├── index.css         Design system CSS (variables, layout, components)
        ├── api/
        │   └── client.js     Axios instance with JWT interceptor
        ├── context/
        │   └── AuthContext.jsx  User state, login/logout/register
        ├── components/
        │   ├── Layout.jsx    Sidebar navigation shell
        │   ├── StatusBadge.jsx
        │   ├── ProgressBar.jsx
        │   └── FileUpload.jsx  Drag-and-drop proof upload
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Achievements.jsx
            ├── AddEditAchievement.jsx
            ├── Milestones.jsx
            ├── Progress.jsx
            ├── Report.jsx
            └── admin/
                ├── FacultyOverview.jsx
                ├── VerifyAchievements.jsx
                ├── MilestoneConfig.jsx
                ├── ManageUsers.jsx
                └── FacultyProgress.jsx
```

---

## Technology Stack

| Concern | Technology | Version | Reason |
|---|---|---|---|
| Frontend framework | React | 18.3.1 | In use |
| Frontend build | Vite | 5.3.4 | In use |
| Client routing | react-router-dom | 6.24.1 | In use |
| HTTP client | axios | 1.7.2 | In use |
| Forms | react-hook-form | 7.52.1 | In use |
| Charts | recharts | 2.12.7 | In use |
| PDF export | jsPDF + jspdf-autotable | 2.5.1 / 3.8.2 | In use |
| Backend framework | Express | 4.19.2 | In use |
| Database | sql.js (pure-JS SQLite) | 1.12.0 | In use — no native build required |
| Auth | jsonwebtoken + bcryptjs | 9.0.2 / 2.4.3 | In use |
| File upload | multer | 1.4.5-lts.1 | In use |
| Dev server | nodemon | 3.1.3 | In use |

No new dependencies are to be added for the core feature set.

---

## Database Schema

All tables are created in `server/src/db.js → createSchema()`.

### `users`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT    NOT NULL
email       TEXT    NOT NULL UNIQUE
password    TEXT    NOT NULL            -- bcrypt hash
role        TEXT    DEFAULT 'faculty'  -- CHECK: faculty | admin | hod
department  TEXT
designation TEXT
created_at  TEXT    DEFAULT datetime('now')
```

### `achievement_types`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
code        TEXT    NOT NULL UNIQUE     -- e.g. 'publication'
label       TEXT    NOT NULL            -- e.g. 'Publications'
description TEXT
sort_order  INTEGER DEFAULT 0
```
Seeded with 7 fixed types on first startup. These are read-only reference data; the UI does not expose editing.

### `achievements`
```sql
id            INTEGER PRIMARY KEY AUTOINCREMENT
user_id       INTEGER NOT NULL REFERENCES users(id)
type_code     TEXT    NOT NULL           -- FK to achievement_types.code
title         TEXT    NOT NULL
description   TEXT
date_achieved TEXT                       -- ISO date string YYYY-MM-DD
issuer        TEXT
url           TEXT
status        TEXT    DEFAULT 'pending' -- CHECK: pending | approved | rejected
reviewed_by   INTEGER REFERENCES users(id)
review_note   TEXT
reviewed_at   TEXT
created_at    TEXT    DEFAULT datetime('now')
```

### `achievement_files`
```sql
id             INTEGER PRIMARY KEY AUTOINCREMENT
achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE
filename       TEXT    NOT NULL           -- stored filename in uploads/
original_name  TEXT    NOT NULL
mime_type      TEXT
size_bytes     INTEGER
uploaded_at    TEXT    DEFAULT datetime('now')
```

### `milestone_templates`
```sql
id                   INTEGER PRIMARY KEY AUTOINCREMENT
name                 TEXT    NOT NULL
description          TEXT
type_code            TEXT    NOT NULL    -- maps to achievement_types.code
required_count       INTEGER NOT NULL DEFAULT 1
time_window_months   INTEGER             -- NULL = no window
created_by           INTEGER REFERENCES users(id)
created_at           TEXT    DEFAULT datetime('now')
```

---

## API Design

All routes are prefixed `/api`. All protected routes require `Authorization: Bearer <JWT>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Register faculty account |
| POST | `/login` | None | Login, returns JWT + user |
| GET | `/me` | Any | Return current user from token |
| PUT | `/profile` | Any | Update own profile |

### Achievements — `/api/achievements`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/types` | Any | List all 7 achievement categories |
| GET | `/` | Any | List achievements (faculty: own; admin/hod: all) |
| GET | `/:id` | Any | Get single achievement with files |
| POST | `/` | Any | Create achievement + upload files (multipart) |
| PUT | `/:id` | Any | Update pending achievement + append files |
| DELETE | `/:id` | Any | Delete pending achievement + files from disk |
| GET | `/files/:filename` | Any | Serve uploaded file |

### Milestones — `/api/milestones`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any | List all milestone templates |
| GET | `/:id` | Any | Get single milestone |
| POST | `/` | admin/hod | Create milestone template |
| PUT | `/:id` | admin/hod | Update milestone template |
| DELETE | `/:id` | admin/hod | Delete milestone template |
| GET | `/progress/:userId` | Any* | Compute milestone progress for a user |

*Faculty may only request their own userId.

### Admin — `/api/admin` (requires admin or hod)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | admin/hod | List all users (filterable) |
| POST | `/users` | admin only | Create any-role user account |
| DELETE | `/users/:id` | admin only | Delete user account |
| GET | `/achievements` | admin/hod | All achievements (filterable) |
| POST | `/achievements/:id/review` | admin/hod | Approve or reject |
| GET | `/overview` | admin/hod | Per-faculty achievement count summary |
| GET | `/departments` | admin/hod | List distinct departments |

### Reports — `/api/reports`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/faculty/:userId` | Any* | Full career report data for PDF generation |
| GET | `/dashboard/:userId` | Any* | Lightweight dashboard stats |

*Faculty may only request their own userId.

---

## Frontend Architecture

### Auth Flow

```
User visits / → RootRedirect → /api/auth/me
  ├── Token valid → role === 'faculty' → /dashboard
  ├── Token valid → role === 'admin'/'hod' → /admin/overview
  └── No token / invalid → /login
```

### Route Guards

Three guard components in `App.jsx`:

| Guard | Allows | Redirects |
|---|---|---|
| `RequireAuth` | Any authenticated user | → /login if unauthenticated |
| `RequireFaculty` | `role === 'faculty'` | → /login or /admin/overview |
| `RequireStaff` | `role === 'admin'` or `'hod'` | → /login or /dashboard |

### State Management

No external state library. State is managed at two levels:
- **Global**: `AuthContext` (user identity, login/logout/register, role helpers)
- **Local**: `useState` / `useEffect` per page component, fetching from the API on mount

### Axios Client (`src/api/client.js`)

- Base URL: `/api` (proxied to `http://localhost:3001` in dev via Vite config)
- Request interceptor: Attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: On HTTP 401, clears localStorage and redirects to `/login`

### PDF Export (`pages/Report.jsx`)

Client-side only using jsPDF + jspdf-autotable. No server-side PDF generation. The export function:
1. Creates an A4 portrait document
2. Writes a profile header (name, designation, department, date)
3. Renders milestone progress table using `autoTable`
4. Renders one table per achievement category (only non-empty categories)
5. Saves as `<Name>_Career_Profile.pdf`

---

## File Upload Design

**Storage**: Local disk at `server/uploads/`. Files are stored with a unique name `<timestamp>-<random>.<ext>`.

**Multer configuration** (in `routes/achievements.js`):
- Max 5 files per request
- Max 10 MB per file
- Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`

**Cascading delete**: `achievement_files` has `ON DELETE CASCADE` on `achievement_id`. When an achievement is deleted, DB records are cleaned up automatically. The route handler additionally unlinks files from disk.

---

## Progress Computation Design

Progress is computed on-the-fly by `GET /api/milestones/progress/:userId`:

```
For each milestone_template:
  count = SELECT COUNT(*) FROM achievements
          WHERE user_id = :userId
            AND type_code = milestone.type_code
            AND status = 'approved'
            [AND date_achieved >= date('now', '-N months') IF time_window_months IS SET]

  percentage = min(100, round(count / required_count × 100))
  achieved   = count >= required_count
```

This is intentionally computed live from the database — no cached or pre-computed progress table. This keeps the implementation simple and ensures data consistency.

---

## Design Decisions & Constraints

| Decision | Rationale |
|---|---|
| sql.js over better-sqlite3 | No native build tools (node-gyp) available in the build environment |
| In-memory + persist-to-disk pattern | Required by sql.js; `persist()` is called after every write |
| No state management library (Redux, Zustand) | Unnecessary at this scale; Context + useState is sufficient |
| Client-side PDF generation | Simpler than server-side; no additional dependencies; no server load |
| Milestone rules in DB, not code | Ensures institution can configure without a deployment; satisfies REQ-NF-4 |
| JWT in localStorage | Acceptable for an intranet faculty portal; trade-off noted |
| Fixed 7 achievement types | Categories are stable reference data; admin UI for types adds complexity without value at MVP |

---

## Existing Functionality — Must Not Change

The following is fully implemented and working. Implementation tasks must not break any of these:

1. **Database schema** — all 5 tables with existing columns and constraints
2. **Auth routes** — login, register, `/me`, profile update
3. **JWT middleware** — `authenticate` and `requireRole` in `server/src/middleware/auth.js`
4. **Achievements CRUD** — create, read, update, delete, file upload via multer
5. **Milestone templates CRUD** — create, read, update, delete by admin/hod
6. **Progress computation** — `GET /api/milestones/progress/:userId`
7. **Admin verification** — approve/reject with review note
8. **Admin overview** — per-faculty achievement count table
9. **Reports API** — dashboard stats and full career report data
10. **All frontend pages** — Login, Dashboard, Achievements, AddEditAchievement, Milestones, Progress, Report, FacultyOverview, VerifyAchievements, MilestoneConfig, ManageUsers, FacultyProgress
11. **PDF export** — client-side jsPDF generation in `Report.jsx`
12. **Seed data** — 5 demo accounts, 8 milestones, 15 achievements
13. **CSS design system** — all variables, layout classes, and component styles in `index.css`
14. **Vite proxy** — `/api` and `/uploads` forwarded to port 3001 in dev
