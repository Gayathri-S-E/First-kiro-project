# Requirements — Faculty Career Advancement Tracker

## Overview

The Faculty Career Advancement Tracker (FCAT) is a web application that allows faculty members to record, upload proof for, and track their professional achievements toward institution-defined career milestones. HODs and Admins verify submissions and manage the milestone configuration. The application supports a complete end-to-end workflow from login through report generation.

---

## User Roles

| Role | Description |
|---|---|
| `faculty` | Submits achievements, tracks progress, generates personal reports |
| `hod` | Verifies achievements, configures milestones, views all faculty progress |
| `admin` | All HOD capabilities plus user management (create/delete accounts) |

---

## Functional Requirements

### 1. Authentication

**REQ-AUTH-1** Faculty must be able to register a new account with name, email, password, department, and designation.

**REQ-AUTH-2** All users must be able to log in with email and password and receive a JWT valid for 7 days.

**REQ-AUTH-3** The system must reject unauthenticated requests to all protected routes with HTTP 401.

**REQ-AUTH-4** Faculty must not be able to create admin or HOD accounts through self-registration. Admin accounts can only be created by an existing admin.

**REQ-AUTH-5** Users must be able to update their own profile (name, department, designation, password).

**REQ-AUTH-6** The frontend must validate the stored token on page load via `GET /api/auth/me` and redirect to login if the token is invalid or expired.

#### Acceptance Criteria
- Given a valid email and password, login returns a JWT and user object
- Given an invalid password, login returns HTTP 401 with `"Invalid credentials"`
- Given a duplicate email, registration returns HTTP 409
- Given no token, any protected route returns HTTP 401
- Given a faculty token on an admin route, the server returns HTTP 403

---

### 2. Faculty Dashboard

**REQ-DASH-1** The dashboard must show a summary of the faculty member's own achievement counts, broken down by status (pending, approved, rejected).

**REQ-DASH-2** The dashboard must show a bar chart of approved achievements by category.

**REQ-DASH-3** The dashboard must show a bar chart of monthly approved activity over the last 12 months.

**REQ-DASH-4** The dashboard must show the 5 most recently submitted achievements with title, category, status, and date.

**REQ-DASH-5** The dashboard must provide a quick-access button to add a new achievement.

**REQ-DASH-6** The dashboard must provide quick-link cards to Milestones, My Progress, and Generate Report.

#### Acceptance Criteria
- Dashboard loads all stat data from `GET /api/reports/dashboard/:userId`
- Status counts reflect the current database state
- Charts render correctly when data exists; show a placeholder message when no data
- Recent achievements list shows a maximum of 5 entries

---

### 3. Achievement Submission

**REQ-ACH-1** Faculty must be able to submit an achievement with: title (required), category (required), date achieved, issuer/publisher/organiser, description, and URL/DOI.

**REQ-ACH-2** The system must support the following 7 fixed achievement categories: Publications, Certifications, Conferences, Workshops, Research Projects, Patents, Academic/Teaching Activities.

**REQ-ACH-3** Faculty must be able to upload up to 5 proof files per achievement. Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX. Maximum file size: 10 MB each.

**REQ-ACH-4** New achievements are created with `status = 'pending'` and require verification.

**REQ-ACH-5** Faculty must be able to edit their own achievements while they are in `pending` status. Editing an `approved` or `rejected` achievement must be blocked with an appropriate error message.

**REQ-ACH-6** Faculty must be able to delete their own `pending` achievements. Deleting must also remove all associated proof files from disk.

**REQ-ACH-7** Faculty must be able to filter their achievements list by category and status.

**REQ-ACH-8** Faculty must only be able to see their own achievements. Admin and HOD can see all achievements.

#### Acceptance Criteria
- `POST /api/achievements` with valid body returns HTTP 201 and the created achievement
- Uploading a `.exe` file returns an error (file type not allowed)
- Uploading a file over 10 MB is rejected
- `PUT /api/achievements/:id` on an approved achievement by faculty returns HTTP 400
- `DELETE /api/achievements/:id` removes the database record and the file from `server/uploads/`
- Faculty querying `GET /api/achievements` only see their own records

---

### 4. Proof File Upload

**REQ-FILE-1** Proof files are stored in `server/uploads/` using a unique timestamped filename.

**REQ-FILE-2** The original filename, MIME type, and size in bytes must be preserved in the `achievement_files` table.

**REQ-FILE-3** Admin and HOD must be able to view and open proof files when reviewing an achievement.

**REQ-FILE-4** Proof files must be served at `/uploads/:filename` (static) or via `GET /api/achievements/files/:filename` (authenticated).

**REQ-FILE-5** When an achievement is deleted, all associated proof files must also be deleted from disk.

#### Acceptance Criteria
- Uploaded file appears in `server/uploads/` with a unique name
- File record appears in `achievement_files` with correct `original_name` and `mime_type`
- Link to the file in the admin verify view opens the file in a new tab
- Deleting an achievement removes files from `server/uploads/`

---

### 5. Career Milestones

**REQ-MS-1** Admin and HOD must be able to create milestone templates with: name (required), category (required), required count (required, ≥ 1), optional time window in months, and optional description.

**REQ-MS-2** Admin and HOD must be able to edit and delete existing milestone templates.

**REQ-MS-3** Milestone requirements must not be hardcoded. All thresholds are stored in the `milestone_templates` table and configurable through the UI.

**REQ-MS-4** The system must support a time window constraint: when set, only approved achievements with `date_achieved` within the specified number of months from today count toward the milestone.

**REQ-MS-5** Faculty must be able to view all active milestone requirements in a read-only list grouped by category.

#### Acceptance Criteria
- `POST /api/milestones` by HOD creates a milestone; same request by faculty returns HTTP 403
- A milestone with `required_count = 3` and `time_window_months = 36` only counts achievements from the last 36 months
- Deleting a milestone removes it from the database but does not modify any achievement records
- Faculty `GET /api/milestones` returns all templates; `POST` returns 403

---

### 6. Progress Tracking

**REQ-PROG-1** Faculty must be able to view their progress against every active milestone, showing current count, required count, and percentage complete.

**REQ-PROG-2** A milestone is marked "Achieved" when `current_count >= required_count`.

**REQ-PROG-3** Progress must only count achievements with `status = 'approved'`.

**REQ-PROG-4** The progress view must display an overall summary: total milestones, number achieved, and overall completion percentage.

**REQ-PROG-5** Admin and HOD must be able to view any faculty member's progress at `/admin/progress/:userId`.

#### Acceptance Criteria
- `GET /api/milestones/progress/:userId` returns progress for all active milestones
- A faculty member with 3 approved publications and a milestone requiring 5 shows `current_count = 3`, `percentage = 60`, `achieved = false`
- After a 4th and 5th approval, the same milestone shows `achieved = true`
- A faculty token requesting another faculty member's progress returns HTTP 403

---

### 7. Report Generation

**REQ-REP-1** Faculty must be able to generate a career profile report showing their profile, all approved achievements grouped by category, and milestone progress.

**REQ-REP-2** The report must be exportable as a PDF containing: faculty profile header, milestone progress table, and one section per achievement category listing titles, issuers, and dates.

**REQ-REP-3** The PDF filename must be `<Name>_Career_Profile.pdf`.

**REQ-REP-4** Admin and HOD must be able to generate a report for any faculty member via `/admin/report/:userId`.

**REQ-REP-5** The report data endpoint `GET /api/reports/faculty/:userId` must return: user profile, `achievementsByType` (approved only), `summary` counts, `milestoneProgress`, and `generatedAt` timestamp.

#### Acceptance Criteria
- Faculty accessing `GET /api/reports/faculty/:userId` for another user returns HTTP 403
- PDF download produces a valid PDF file named `Name_Career_Profile.pdf`
- Report only includes approved achievements; pending and rejected are excluded
- Admin accessing any faculty's report returns HTTP 200

---

### 8. Admin / HOD Verification

**REQ-VER-1** Admin and HOD must be able to view all submitted achievements with filters for status and category.

**REQ-VER-2** Admin and HOD must be able to approve or reject any `pending` achievement.

**REQ-VER-3** A rejection must require a review note explaining the reason.

**REQ-VER-4** Approval is optional with a review note.

**REQ-VER-5** Once reviewed (approved or rejected), the achievement must record the reviewer's user ID, their name, and the review timestamp.

**REQ-VER-6** Faculty must be able to see the review note on rejected achievements in their achievements list.

**REQ-VER-7** Admin and HOD must be able to view a faculty overview table showing per-faculty counts of approved achievements broken down by category.

**REQ-VER-8** Admin must be able to create and delete user accounts. HOD cannot delete accounts.

#### Acceptance Criteria
- `POST /api/admin/achievements/:id/review` with `status = "approved"` sets `status`, `reviewed_by`, `reviewed_at`
- Rejection without `review_note` is blocked at the frontend (field required); backend accepts it gracefully
- Faculty achievements list shows rejection note inline under the rejected achievement title
- Admin `GET /api/admin/overview` returns a row per faculty with `byType` breakdown and `totalApproved`
- HOD calling `DELETE /api/admin/users/:id` returns HTTP 403

---

## Non-Functional Requirements

**REQ-NF-1 Performance** Dashboard and list pages must load within 2 seconds on localhost.

**REQ-NF-2 Security** Passwords are hashed with bcrypt (cost factor 10). JWTs are signed with a configurable secret from `.env`. No password is returned in any API response.

**REQ-NF-3 Data Integrity** Foreign key constraints are enforced. Achievement files are deleted from disk when their parent achievement is deleted (cascade).

**REQ-NF-4 Configurability** All milestone thresholds are institution-defined through the UI. No government or institutional promotion rules are hardcoded in the application.

**REQ-NF-5 Portability** The database uses sql.js (pure-JS SQLite) so no native build tools or cloud database services are required.

**REQ-NF-6 Build** `npm run build` in `client/` must complete without errors. `npm run seed` in `server/` must complete without errors on a fresh database.

---

## Out of Scope

- Email notifications
- AI/ML features
- Cloud storage (S3, etc.)
- Multi-tenancy / multiple institutions
- Government-mandated promotion rule automation
- OAuth / SSO
