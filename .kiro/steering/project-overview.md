# FCAT — Project Overview

## What This Is

**Faculty Career Advancement Tracker (FCAT)** is an intranet web application for an academic institution. Faculty members log professional achievements, upload proof documents, track progress against career milestones, and generate PDF career reports. HODs and Admins review submissions and configure milestone requirements.

## Architecture

Monorepo with two sub-packages:

```
First-kiro-project/
├── client/   # React 18 SPA (Vite, port 5173 in dev)
├── server/   # Node.js/Express REST API (port 3001)
└── package.json  # root orchestrator scripts only
```

In **development**: Vite proxies `/api` and `/uploads` to `http://localhost:3001` — the client never uses an absolute backend URL.  
In **production**: Express serves the React build from `client/dist` and handles `*` with `index.html`.

## User Roles

| Role | Description |
|---|---|
| `faculty` | Default role. Submits achievements, views own data, generates own report. |
| `hod` | Head of Department. Reviews achievements, configures milestones, views all faculty. |
| `admin` | All HOD capabilities plus user management (create/delete any-role accounts). |

- Faculty self-register via `POST /api/auth/register` (always gets role `faculty`).
- Admin/HOD accounts are created only via the admin panel (`POST /api/admin/users`).

## Achievement Types (fixed, seeded at DB init)

`publication`, `certification`, `conference`, `workshop`, `research`, `patent`, `teaching`

These are stored in the `achievement_types` table. They are **not editable via UI** — do not build UI to add/remove them without understanding the downstream FK implications.

## Achievement Lifecycle

1. Faculty submits → `status = 'pending'`
2. Admin/HOD reviews → `status = 'approved'` or `'rejected'`
3. Faculty can edit/delete only their own `pending` achievements.

## Key File Paths

- Server entry: `server/src/index.js`
- DB module: `server/src/db.js`
- Auth middleware: `server/src/middleware/auth.js`
- Routes: `server/src/routes/{auth,achievements,milestones,admin,reports}.js`
- React entry: `client/src/main.jsx`
- App + routing: `client/src/App.jsx`
- Auth context: `client/src/context/AuthContext.jsx`
- API client: `client/src/api/client.js`
- Design tokens + all CSS: `client/src/index.css`
