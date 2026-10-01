# Tasks — Faculty Career Advancement Tracker

> **Scope:** The FCAT codebase is fully implemented. These tasks verify every
> requirement and acceptance criterion against the running system, confirm the
> build and seed pipeline, and address the small gaps found during inspection.
> No application code is modified unless a task explicitly says so.

---

## Phase 1 — Environment & Bootstrap Verification

Confirm the dev environment starts cleanly and the seed pipeline works.

- [ ] **1.1** Run `npm run seed` from the workspace root on a fresh (deleted) `server/fcat.db`
      and confirm all 5 demo accounts, 8 milestone templates, and 15 achievements are created
      without errors. (`server/src/seed.js`)
- [ ] **1.2** Run `npm run dev:server` and verify the server starts on port 3001 with
      `✓ Database ready` and `✓ Server running on http://localhost:3001`.
- [ ] **1.3** Run `npm run dev:client` and verify Vite starts on port 5173 with no
      compilation errors.
- [ ] **1.4** Run `npm run build:client` and confirm the build completes without errors
      and outputs `client/dist/`. (`client/vite.config.js`)
- [ ] **1.5** Hit `GET /api/health` and confirm `{ status: "ok", timestamp: "…" }` is returned.
      (`server/src/index.js`)

---

## Phase 2 — Authentication (REQ-AUTH-*)

- [ ] **2.1** `POST /api/auth/register` with valid body → HTTP 201, returns `{ token, user }`;
      `user.role` must be `"faculty"` regardless of any `role` field in the request body.
- [ ] **2.2** `POST /api/auth/register` with a duplicate email → HTTP 409
      `{ error: "Email already registered" }`.
- [ ] **2.3** `POST /api/auth/register` with `role: "admin"` → HTTP 403
      (self-registration of elevated roles is blocked). (`server/src/routes/auth.js`)
- [ ] **2.4** `POST /api/auth/login` with correct credentials → HTTP 200, JWT valid for 7 days.
- [ ] **2.5** `POST /api/auth/login` with wrong password → HTTP 401
      `{ error: "Invalid credentials" }`.
- [ ] **2.6** Any protected route called without a token → HTTP 401.
- [ ] **2.7** Faculty token on `GET /api/admin/users` → HTTP 403.
- [ ] **2.8** `GET /api/auth/me` with a valid token → returns current user object (no password field).
- [ ] **2.9** `PUT /api/auth/profile` updates name/department/designation; password change uses
      bcrypt (cost 10). (`server/src/routes/auth.js`, `server/src/middleware/auth.js`)
- [ ] **2.10** On the client, navigate to any protected route with an expired/missing token;
      confirm redirect to `/login`. (`client/src/api/client.js` — 401 interceptor)

---

## Phase 3 — Achievement Submission & CRUD (REQ-ACH-*)

- [ ] **3.1** `POST /api/achievements` with `title` and `type_code` → HTTP 201, `status = "pending"`.
- [ ] **3.2** `POST /api/achievements` without `title` → HTTP 400.
- [ ] **3.3** `POST /api/achievements` with an invalid `type_code` → HTTP 400.
- [ ] **3.4** `GET /api/achievements` as faculty → returns only that faculty member's own records.
- [ ] **3.5** `GET /api/achievements` as admin/hod → returns all records across users.
- [ ] **3.6** `GET /api/achievements?type_code=publication&status=pending` → filtered results.
- [ ] **3.7** `PUT /api/achievements/:id` on a `pending` achievement owned by the faculty → HTTP 200.
- [ ] **3.8** `PUT /api/achievements/:id` on an `approved` achievement by faculty → HTTP 400
      `{ error: "Cannot edit an already-reviewed achievement" }`.
- [ ] **3.9** `DELETE /api/achievements/:id` on a pending achievement: DB record removed **and**
      associated files deleted from `server/uploads/`.
- [ ] **3.10** `DELETE /api/achievements/:id` on an approved achievement by faculty → HTTP 400.
- [ ] **3.11** Faculty accessing another faculty member's achievement via `GET /api/achievements/:id`
      → HTTP 403.
- [ ] **3.12** In the UI (`/achievements/add`), confirm the category `<select>` is populated
      dynamically from `GET /api/achievements/types` — not hardcoded strings.
      (`client/src/pages/AddEditAchievement.jsx`)
- [ ] **3.13** In the UI (`/achievements`), confirm the filter bar works for both category and
      status. (`client/src/pages/Achievements.jsx`)
- [ ] **3.14** Rejected achievements in the faculty list show the `review_note` inline beneath the
      title. (REQ-VER-6; `client/src/pages/Achievements.jsx`)

---

## Phase 4 — Proof File Upload (REQ-FILE-*)

- [ ] **4.1** Upload a `.pdf` file with a new achievement → file appears in `server/uploads/`
      with a `<timestamp>-<random>.pdf` name; `achievement_files` row has correct
      `original_name`, `mime_type`, and `size_bytes`.
- [ ] **4.2** Upload a `.exe` file → rejected with an error (multer fileFilter).
      (`server/src/routes/achievements.js`)
- [ ] **4.3** Upload a file over 10 MB → rejected (multer size limit).
- [ ] **4.4** Upload more than 5 files in a single request → only 5 accepted or request rejected.
- [ ] **4.5** Uploaded files are accessible via `/uploads/:filename` (static middleware) in dev.
      (`server/src/index.js`)
- [ ] **4.6** In the admin verify view (`/admin/verify`), proof file links open in a new tab.
      (`client/src/pages/admin/VerifyAchievements.jsx`)
- [ ] **4.7** Deleting an achievement via `DELETE /api/achievements/:id` removes both the DB
      record and the physical file from `server/uploads/`.

---

## Phase 5 — Career Milestones (REQ-MS-*)

- [ ] **5.1** `POST /api/milestones` by HOD or admin → HTTP 201 with the new milestone.
- [ ] **5.2** `POST /api/milestones` by faculty → HTTP 403.
- [ ] **5.3** `PUT /api/milestones/:id` updates `required_count` and `time_window_months`.
- [ ] **5.4** `DELETE /api/milestones/:id` removes the template; existing achievements are
      unaffected.
- [ ] **5.5** A milestone with `time_window_months = 36` only counts approved achievements
      where `date_achieved >= date('now', '-36 months')`. (`server/src/routes/milestones.js`)
- [ ] **5.6** Faculty `GET /api/milestones` → HTTP 200, read-only list.
- [ ] **5.7** In the UI (`/milestones`), confirm milestones are grouped by category and the
      list is read-only for faculty. (`client/src/pages/Milestones.jsx`)
- [ ] **5.8** In the admin UI (`/admin/milestones`), confirm create/edit/delete controls are
      visible to HOD and admin only. (`client/src/pages/admin/MilestoneConfig.jsx`)

---

## Phase 6 — Progress Tracking (REQ-PROG-*)

- [ ] **6.1** `GET /api/milestones/progress/:userId` as the same faculty → HTTP 200 with
      `{ user, progress[] }`.
- [ ] **6.2** Faculty requesting another user's progress → HTTP 403.
- [ ] **6.3** Admin/HOD requesting any user's progress → HTTP 200.
- [ ] **6.4** Progress computation: 3 approved publications against a milestone of 5 →
      `current_count = 3`, `percentage = 60`, `achieved = false`.
- [ ] **6.5** After two more approvals, same milestone → `achieved = true`, `percentage = 100`.
- [ ] **6.6** Only `status = 'approved'` achievements count; `pending` and `rejected` are excluded.
- [ ] **6.7** Faculty progress page (`/progress`) shows overall summary: total milestones,
      number achieved, overall %. (`client/src/pages/Progress.jsx`,
      `client/src/components/ProgressBar.jsx`)
- [ ] **6.8** Admin progress page (`/admin/progress/:userId`) renders correctly for a chosen
      faculty member. (`client/src/pages/admin/FacultyProgress.jsx`)

---

## Phase 7 — Report Generation (REQ-REP-*)

- [ ] **7.1** `GET /api/reports/faculty/:userId` as same faculty → HTTP 200 with keys
      `user`, `achievementsByType`, `summary`, `milestoneProgress`, `generatedAt`.
- [ ] **7.2** Faculty requesting another user's report → HTTP 403.
- [ ] **7.3** Admin/HOD requesting any user's report → HTTP 200.
- [ ] **7.4** `achievementsByType` contains only `status = 'approved'` achievements; pending
      and rejected must not appear.
- [ ] **7.5** PDF export from `/report` produces a valid PDF; filename is `<Name>_Career_Profile.pdf`.
      (`client/src/pages/Report.jsx` — `exportPdf` function)
- [ ] **7.6** PDF contains: profile header, milestone progress table, one section per non-empty
      achievement category.
- [ ] **7.7** Admin/HOD can generate a report for any faculty via `/admin/report/:userId`.
- [ ] **7.8** `GET /api/reports/dashboard/:userId` returns `statusCounts`, `typeCounts`,
      `recent` (≤ 5), and `monthly` (last 12 months). (`server/src/routes/reports.js`)

---

## Phase 8 — Admin & HOD Verification (REQ-VER-*)

- [ ] **8.1** `GET /api/admin/achievements` returns all achievements; filter by `status=pending`
      returns only pending records.
- [ ] **8.2** `POST /api/admin/achievements/:id/review` with `status = "approved"` sets
      `status`, `reviewed_by`, `reviewed_at` correctly.
- [ ] **8.3** `POST /api/admin/achievements/:id/review` with `status = "rejected"` and a
      `review_note` sets all three fields.
- [ ] **8.4** `POST /api/admin/achievements/:id/review` with an invalid status string → HTTP 400.
- [ ] **8.5** In the verify UI (`/admin/verify`), the rejection form requires a review note
      before submission. (`client/src/pages/admin/VerifyAchievements.jsx`)
- [ ] **8.6** `GET /api/admin/overview` returns one row per faculty with `byType` breakdown
      and `totalApproved`.
- [ ] **8.7** `POST /api/admin/users` by admin → creates a user of any role (HTTP 201).
- [ ] **8.8** `POST /api/admin/users` by HOD → HTTP 403 (HOD cannot create accounts).
- [ ] **8.9** `DELETE /api/admin/users/:id` by admin → HTTP 200 `{ success: true }`.
- [ ] **8.10** `DELETE /api/admin/users/:id` by HOD → HTTP 403.
- [ ] **8.11** Admin cannot delete their own account (`DELETE /api/admin/users/:self`) → HTTP 400.

---

## Phase 9 — Dashboard (REQ-DASH-*)

- [ ] **9.1** Dashboard (`/dashboard`) loads within 2 seconds on localhost (REQ-NF-1).
- [ ] **9.2** Status summary counts (pending / approved / rejected) match the database state.
- [ ] **9.3** Bar chart of approved achievements by category renders; shows a placeholder when
      no approved data exists. (`client/src/pages/Dashboard.jsx`)
- [ ] **9.4** Monthly activity chart covers the last 12 months.
- [ ] **9.5** "Recent Achievements" list shows at most 5 entries with title, category, status,
      and date.
- [ ] **9.6** "Add Achievement" quick-access button navigates to `/achievements/add`.
- [ ] **9.7** Quick-link cards for Milestones, My Progress, and Generate Report are visible.

---

## Phase 10 — Non-Functional & Security (REQ-NF-*)

- [ ] **10.1** No password hash is returned in any API response (register, login, profile,
      user list). (REQ-NF-2)
- [ ] **10.2** `server/.env` and `server/fcat.db` are listed in `.gitignore` and not tracked
      by git. (REQ-NF-2, REQ-NF-5; `.gitignore`)
- [ ] **10.3** `PRAGMA foreign_keys = ON` is set at DB init; verify cascade delete works:
      deleting an achievement also removes its `achievement_files` rows. (REQ-NF-3;
      `server/src/db.js`)
- [ ] **10.4** Milestone thresholds are stored in `milestone_templates` and configurable via
      the UI — no promotion rules are hardcoded in application code. (REQ-NF-4)
- [ ] **10.5** `npm run build:client` completes with no chunk-size warnings (limit set to 1600 kB
      in `client/vite.config.js`). (REQ-NF-6)
- [ ] **10.6** `npm run seed` completes without errors on a fresh database. (REQ-NF-6)

---

## Phase 11 — Known Gap: Authenticated File Serving Route

During inspection, the route `GET /api/achievements/files/:filename` is registered
**after** `GET /api/achievements/:id` in `achievements.js`. Express will match `/:id`
first, causing a 404 for `files/:filename`. Files are accessible via the static
`/uploads` middleware instead (which is unauthenticated in dev).

- [ ] **11.1** Verify whether `GET /api/achievements/files/:filename` is actually reachable
      at runtime (it may be shadowed by `/:id`). (`server/src/routes/achievements.js`)
- [ ] **11.2** If shadowed: move the `/files/:filename` route **above** `/:id` in
      `achievements.js` so the authenticated file endpoint works as designed. (REQ-FILE-4)
- [ ] **11.3** Confirm that after the fix, `GET /api/achievements/files/:filename` with a
      valid token serves the file, and without a token returns HTTP 401.

---

## Phase 12 — Seed Data Integrity Check

- [ ] **12.1** After `npm run seed`, confirm demo account credentials work:
      `admin@fcat.edu / admin123`, `hod@fcat.edu / hod123`,
      `priya@fcat.edu / faculty123`, `arjun@fcat.edu / faculty123`,
      `meena@fcat.edu / faculty123`. (`server/src/seed.js`)
- [ ] **12.2** Confirm Dr. Priya Sharma has 8 approved achievements and 1 pending.
- [ ] **12.3** Confirm Dr. Arjun Mehta has 4 approved, 1 pending, and 1 rejected (with review
      note visible in the faculty view).
- [ ] **12.4** Confirm 8 milestone templates are seeded and visible at `/admin/milestones`.
- [ ] **12.5** Re-running `npm run seed` on an existing database is idempotent — no duplicates
      are created.
