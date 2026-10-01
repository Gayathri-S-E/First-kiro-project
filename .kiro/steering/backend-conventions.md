# FCAT --- Backend Conventions

## Database Module (server/src/db.js)

sql.js holds the entire database in memory. Every write calls persist() which exports
the binary and writes it to DB_PATH. Always use the four exported helpers -- never import
sql.js directly in route files.

| Helper | Returns |
|---|---|
| db.run(sql, params) | void (fire-and-forget write) |
| db.all(sql, params) | array of plain objects |
| db.get(sql, params) | first row object or null |
| db.insert(sql, params) | new row id (integer) |

Rules:
- Always pass params as the second argument array -- never interpolate values into SQL strings.
- db.get returns null (not undefined) when no row found -- check with: if (!row)
- PRAGMA foreign_keys = ON is set at startup; honour FK constraints in schema changes.
- Add new tables in createSchema() in db.js using CREATE TABLE IF NOT EXISTS.

## Schema Summary

| Table | Key Columns |
|---|---|
| users | id, name, email, password (bcrypt), role (faculty/admin/hod), department, designation |
| achievement_types | id, code (unique), label, description, sort_order |
| achievements | id, user_id->users, type_code, title, status (pending/approved/rejected), reviewed_by->users |
| achievement_files | id, achievement_id->achievements (CASCADE DELETE), filename, original_name, mime_type, size_bytes |
| milestone_templates | id, name, type_code, required_count, time_window_months (nullable), created_by->users |

type_code columns are validated in application code via a SELECT on achievement_types --
there is no DB-level FK for them.

## Authentication Middleware (server/src/middleware/auth.js)

Exports: authenticate, requireRole

Usage patterns:
  router.get('/route', authenticate, handler)
  router.post('/admin-route', authenticate, requireRole('admin'), handler)
  router.use(authenticate, requireRole('admin', 'hod'))   // router-level protection

JWT payload shape: { id, email, role, name }. Default expiry: 7d.
req.user is set by authenticate and available in all subsequent handlers.

## Route File Conventions

- One Express Router per domain: auth.js, achievements.js, milestones.js, admin.js, reports.js
- Mounted in index.js under /api/<domain>
- Role checks: use router.use(authenticate, requireRole(...)) for uniform protection,
  or per-route middleware when only some methods need elevation
- Error responses always: { error: "message string" } -- never throw unhandled
- Catch errors with try/catch and return res.status(500).json({ error: err.message })

## File Upload (Multer)

- Config lives in achievements.js -- diskStorage to UPLOADS_DIR, 10 MB limit
- Allowed extensions: .pdf .jpg .jpeg .png .doc .docx
- Field name: "files", max 5 per request via upload.array("files", 5)
- Stored filename pattern: <timestamp>-<random>.<ext>
- Original filename preserved in achievement_files.original_name
- On achievement delete: manually fs.unlinkSync each file before db.run("DELETE ...")

## API Response Shapes

Lists:   { achievements: [...] } | { users: [...] } | { milestones: [...] } | { types: [...] }
Single:  { achievement: {...} } | { user: {...} } | { milestone: {...} }
Auth:    { token: "...", user: {...} }
Delete:  { success: true }
Error:   { error: "message string" }

## HTTP Status Codes

200 Reads and updates
201 Creates
400 Validation failure or bad state (e.g. editing an approved achievement)
401 Missing or invalid JWT
403 Wrong role or accessing another user's data
404 Resource not found
409 Duplicate email on register
500 Unhandled server error
