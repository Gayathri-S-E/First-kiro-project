# FCAT --- Extension Rules

Rules for safely adding features to this project. Read before making any changes.

## General

- Do not introduce new dependencies without explicit user approval.
- Do not change existing API response shapes -- frontend components depend on them.
- Do not alter the DB schema destructively (no DROP TABLE, no removing columns).
- Do not change the auth flow, JWT structure, or localStorage key names (fcat_token, fcat_user).
- Do not replace sql.js with another DB driver -- the entire db.js module depends on it.
- Do not add Tailwind, CSS Modules, or any CSS-in-JS library.
- Do not switch from axios to fetch() or add a second HTTP client.

## Adding a New Backend Route

1. Create a new file in server/src/routes/ or add to an existing one if tightly related.
2. Mount it in server/src/index.js: app.use('/api/<domain>', require('./routes/<file>'))
3. Apply authenticate middleware to every route. Add requireRole where needed.
4. Use db.run / db.all / db.get / db.insert -- never import sql.js directly.
5. Return errors as { error: "message" } with the correct HTTP status code.
6. Validate required fields at the top of the handler before touching the DB.

## Adding a New Frontend Page

1. Create the file in client/src/pages/ (or pages/admin/ for admin-only pages).
2. Import it in App.jsx and add a Route inside AppRoutes.
3. Wrap with the appropriate guard: RequireAuth, RequireFaculty, or RequireStaff.
4. Wrap with Layout: <RequireX><Layout><NewPage /></Layout></RequireX>
5. If the page belongs in the sidebar nav, add a NavLink inside Layout.jsx under
   the correct role-conditional section (faculty or admin).
6. All API calls go through api (import api from '../api/client').

## Adding a New DB Table

1. Add CREATE TABLE IF NOT EXISTS inside createSchema() in server/src/db.js.
2. Place it after the tables it depends on (respect FK order).
3. If seeding default rows, guard with: const existing = db.get('SELECT id FROM <table> LIMIT 1'); if (!existing) { ... }
4. Do not run raw migrations -- the schema is created fresh from createSchema() on first run.

## Role and Access Control

- Faculty: can only read/write their own data. Enforce with: if (req.user.role === 'faculty' && row.user_id !== req.user.id)
- HOD: same access as admin except cannot create/delete user accounts.
- Admin: full access.
- Never trust user-supplied user_id for faculty routes -- always use req.user.id.

## Achievement Status Rules

- Faculty can only edit or delete achievements with status = 'pending'.
- Only admin/hod can change status (via POST /api/admin/achievements/:id/review).
- Valid statuses: 'pending', 'approved', 'rejected' -- enforced by DB CHECK constraint.

## achievement_types

The seven types (publication, certification, conference, workshop, research, patent, teaching)
are seeded at DB init and are not editable via UI. Do not hardcode type_code strings in
new features -- always fetch from GET /api/achievements/types and render dynamically.

## CSS

- Add new component styles to index.css following the existing section comments.
- Reuse existing design tokens (--primary, --gray-*, --radius, --shadow-*) -- do not hardcode hex colors.
- Reuse .card, .btn-*, .badge, .alert, .modal classes before creating new ones.
- Responsive breakpoint is 768px -- test any layout changes at mobile width.

## File Uploads

- New upload endpoints must reuse the existing multer config in achievements.js,
  or create a new multer instance with the same allowed extensions and 10 MB limit.
- Always store files in UPLOADS_DIR (from process.env or ./uploads default).
- Always clean up disk files when deleting the parent DB record.

## Progress Computation

- Milestone progress is computed live (no cache table). Each GET /api/milestones/progress/:userId
  runs one COUNT query per milestone template.
- If adding new progress features, follow the same pattern: COUNT approved achievements
  matching type_code, optionally filtered by date_achieved >= date('now', '-N months').

## What NOT to Change

- server/src/db.js persist() mechanism -- it is the only durability layer.
- client/src/api/client.js interceptors -- they handle auth token injection and 401 logout.
- The RequireAuth / RequireFaculty / RequireStaff guard components in App.jsx.
- The isStaff = isAdmin || isHod pattern in AuthContext -- other components rely on it.
- The manual chunk split in vite.config.js -- it keeps initial bundle size manageable.
