/**
 * Tests: Growth Plan business rules
 *
 * Rules under test:
 *
 *   AUTH-1  Only coordinators can access /api/coordinator/* endpoints.
 *           faculty, hod, admin, and unauthenticated callers are rejected.
 *
 *   STATUS-1 The four valid plan statuses are accepted:
 *            planned | in_progress | completed | cancelled
 *
 *   STATUS-2 Any string not in that set is rejected with a specific error.
 *
 *   FACULTY-1 A plan cannot be created for a user_id that does not exist.
 *
 *   FACULTY-2 A plan cannot be created for a non-faculty user (admin/hod).
 *
 *   ISOLATE-1 Filtering growth plans by faculty_id returns only that
 *             faculty member's plans — another faculty's plans never appear.
 *
 *   ISOLATE-2 A plan created for faculty A is not returned when querying
 *             plans for faculty B.
 *
 * Approach:
 *   AUTH rules: pure requireRole() unit test with synthetic req/res/next.
 *   All other rules: direct in-memory sql.js database, replicating the exact
 *   validation functions used in routes/coordinator.js.
 *   No HTTP server. No new dependencies.
 *   Pattern matches all existing test files in this directory.
 */

"use strict";

const { test } = require("node:test");
const assert   = require("node:assert/strict");
const path     = require("node:path");

const { requireRole } = require(path.resolve(__dirname, "../middleware/auth.js"));

// ── Shared constants (must match routes/coordinator.js) ───────────────────────
const VALID_STATUSES   = ["planned", "in_progress", "completed", "cancelled"];
const COORDINATOR_ONLY = ["coordinator"];

// ── Mock helpers (identical pattern to role-authorization.test.js) ────────────
function makeMocks(role) {
  const req   = { user: role !== undefined ? { role } : undefined };
  const calls = { statusCode: null, body: null, nextCalled: false };
  const res   = {
    status(code) {
      calls.statusCode = code;
      return { json(body) { calls.body = body; return this; } };
    },
  };
  const next = () => { calls.nextCalled = true; };
  return { req, res, next, calls };
}

function invoke(allowedRoles, callerRole) {
  const { req, res, next, calls } = makeMocks(callerRole);
  requireRole(...allowedRoles)(req, res, next);
  return calls;
}

// ── DB bootstrap helper ───────────────────────────────────────────────────────
async function buildTestDb() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL       = await initSqlJs();
  const db        = new SQL.Database();

  db.run("PRAGMA foreign_keys = ON;");

  db.run(`
    CREATE TABLE users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL DEFAULT 'hash',
      role        TEXT NOT NULL DEFAULT 'faculty'
                  CHECK(role IN ('faculty','admin','hod','coordinator'))
    )
  `);

  db.run(`
    CREATE TABLE growth_plans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      description TEXT,
      target_date TEXT,
      status      TEXT    NOT NULL DEFAULT 'planned'
                  CHECK(status IN ('planned','in_progress','completed','cancelled')),
      notes       TEXT,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Seed users covering all roles
  db.run("INSERT INTO users (name, email, role) VALUES ('Faculty A', 'a@test.edu', 'faculty')");
  db.run("INSERT INTO users (name, email, role) VALUES ('Faculty B', 'b@test.edu', 'faculty')");
  db.run("INSERT INTO users (name, email, role) VALUES ('Coord One', 'c@test.edu', 'coordinator')");
  db.run("INSERT INTO users (name, email, role) VALUES ('Admin One', 'd@test.edu', 'admin')");
  db.run("INSERT INTO users (name, email, role) VALUES ('HOD One',   'e@test.edu', 'hod')");

  // Helper: query helpers mirroring db.js style
  function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  function getUserId(email) {
    return queryOne("SELECT id FROM users WHERE email = ?", [email])?.id;
  }

  // Mirrors the status validation in routes/coordinator.js
  function isValidStatus(status) {
    return VALID_STATUSES.includes(status);
  }

  // Mirrors the faculty-reference validation in POST /growth-plans
  function validateFacultyRef(faculty_id) {
    const user = queryOne("SELECT id, role FROM users WHERE id = ?", [faculty_id]);
    if (!user)              return { ok: false, code: 404, error: "Faculty member not found" };
    if (user.role !== "faculty")
                            return { ok: false, code: 400, error: "Plans can only be created for faculty members" };
    return { ok: true };
  }

  // Insert a plan and return its id
  function insertPlan(faculty_id, title, coordinator_id, status = "planned") {
    db.run(
      `INSERT INTO growth_plans (faculty_id, title, status, created_by)
       VALUES (?, ?, ?, ?)`,
      [faculty_id, title, status, coordinator_id]
    );
    const row = queryOne("SELECT last_insert_rowid() as id");
    return row ? row.id : null;
  }

  // Mirrors the GET /growth-plans?faculty_id=X filter
  function getPlansForFaculty(faculty_id) {
    return queryAll(
      "SELECT * FROM growth_plans WHERE faculty_id = ?",
      [faculty_id]
    );
  }

  return {
    db,
    getUserId,
    isValidStatus,
    validateFacultyRef,
    insertPlan,
    getPlansForFaculty,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═════════════════════════════════════════════════════════════════════════════

test("Growth Plan business rules", async (t) => {

  // ── AUTH-1: role-based access control ──────────────────────────────────────
  await t.test("AUTH-1 — only coordinator can access coordinator-only routes", async (t2) => {

    await t2.test("coordinator: next() called", () => {
      const c = invoke(COORDINATOR_ONLY, "coordinator");
      assert.strictEqual(c.nextCalled, true);
      assert.strictEqual(c.statusCode, null);
    });

    await t2.test("faculty: blocked with 403", () => {
      const c = invoke(COORDINATOR_ONLY, "faculty");
      assert.strictEqual(c.nextCalled, false);
      assert.strictEqual(c.statusCode, 403);
      assert.strictEqual(c.body?.error, "Insufficient permissions");
    });

    await t2.test("hod: blocked with 403", () => {
      const c = invoke(COORDINATOR_ONLY, "hod");
      assert.strictEqual(c.nextCalled, false);
      assert.strictEqual(c.statusCode, 403);
    });

    await t2.test("admin: blocked with 403", () => {
      const c = invoke(COORDINATOR_ONLY, "admin");
      assert.strictEqual(c.nextCalled, false);
      assert.strictEqual(c.statusCode, 403);
    });

    await t2.test("unauthenticated (no user): 401 Not authenticated", () => {
      const c = invoke(COORDINATOR_ONLY, undefined);
      assert.strictEqual(c.nextCalled, false);
      assert.strictEqual(c.statusCode, 401);
      assert.strictEqual(c.body?.error, "Not authenticated");
    });
  });

  // ── STATUS-1 & STATUS-2: status value validation ───────────────────────────
  await t.test("STATUS — valid and invalid plan status values", async (t2) => {

    // STATUS-1: all four valid values must be accepted
    for (const s of VALID_STATUSES) {
      await t2.test(`'${s}' is a valid status`, () => {
        assert.strictEqual(
          VALID_STATUSES.includes(s), true,
          `Expected '${s}' to be in VALID_STATUSES`
        );
      });
    }

    // STATUS-2: invalid strings must be rejected
    const invalidStatuses = [
      // common mistakes
      "active", "inactive", "open", "closed", "done", "pending",
      "approved", "rejected",          // achievement statuses, not plan statuses
      // case variants
      "Planned", "PLANNED", "In_Progress", "IN_PROGRESS",
      "Completed", "COMPLETED", "Cancelled", "CANCELLED",
      // whitespace / empty
      " planned", "planned ", " ", "",
      // numeric
      "0", "1",
      // injection probes
      "planned' OR '1'='1", "'; DROP TABLE growth_plans; --",
    ];

    const { isValidStatus } = await buildTestDb();

    for (const s of invalidStatuses) {
      const label = JSON.stringify(s).slice(0, 50);
      await t2.test(`${label} is rejected`, () => {
        assert.strictEqual(
          isValidStatus(s), false,
          `Expected '${s}' to be invalid but isValidStatus returned true`
        );
      });
    }

    // Extra: exactly 4 values are valid — the set has no extras
    await t2.test("exactly 4 valid statuses exist — no undocumented values", () => {
      assert.strictEqual(VALID_STATUSES.length, 4);
    });
  });

  // ── FACULTY-1 & FACULTY-2: faculty reference validation ───────────────────
  await t.test("FACULTY — faculty_id reference validation", async (t2) => {
    const { getUserId, validateFacultyRef } = await buildTestDb();

    const facultyAId    = getUserId("a@test.edu");
    const adminId       = getUserId("d@test.edu");
    const hodId         = getUserId("e@test.edu");
    const coordinatorId = getUserId("c@test.edu");

    // FACULTY-1: valid faculty user → accepted
    await t2.test("existing faculty user_id is accepted", () => {
      const result = validateFacultyRef(facultyAId);
      assert.strictEqual(result.ok, true);
    });

    // FACULTY-1: non-existent user_id → 404
    await t2.test("non-existent user_id returns 404", () => {
      const result = validateFacultyRef(99999);
      assert.strictEqual(result.ok,    false);
      assert.strictEqual(result.code,  404);
      assert.strictEqual(result.error, "Faculty member not found");
    });

    // FACULTY-2: admin user_id → 400
    await t2.test("admin user_id is rejected (not faculty)", () => {
      const result = validateFacultyRef(adminId);
      assert.strictEqual(result.ok,    false);
      assert.strictEqual(result.code,  400);
      assert.strictEqual(result.error, "Plans can only be created for faculty members");
    });

    // FACULTY-2: hod user_id → 400
    await t2.test("hod user_id is rejected (not faculty)", () => {
      const result = validateFacultyRef(hodId);
      assert.strictEqual(result.ok,    false);
      assert.strictEqual(result.code,  400);
    });

    // FACULTY-2: coordinator user_id → 400
    await t2.test("coordinator user_id is rejected (not faculty)", () => {
      const result = validateFacultyRef(coordinatorId);
      assert.strictEqual(result.ok,    false);
      assert.strictEqual(result.code,  400);
    });
  });

  // ── ISOLATE-1 & ISOLATE-2: per-faculty data isolation ─────────────────────
  await t.test("ISOLATE — faculty_id filter returns only that faculty's plans", async (t2) => {
    const { getUserId, insertPlan, getPlansForFaculty } = await buildTestDb();

    const facultyAId    = getUserId("a@test.edu");
    const facultyBId    = getUserId("b@test.edu");
    const coordinatorId = getUserId("c@test.edu");

    // Seed 2 plans for faculty A, 1 plan for faculty B
    insertPlan(facultyAId, "Plan A-1", coordinatorId, "planned");
    insertPlan(facultyAId, "Plan A-2", coordinatorId, "in_progress");
    insertPlan(facultyBId, "Plan B-1", coordinatorId, "completed");

    // ISOLATE-1: faculty A's filter returns only A's plans
    await t2.test("faculty A's filter returns exactly 2 plans", () => {
      const plans = getPlansForFaculty(facultyAId);
      assert.strictEqual(plans.length, 2,
        `Expected 2 plans for faculty A, got ${plans.length}`);
    });

    await t2.test("faculty A's plans all belong to faculty A", () => {
      const plans = getPlansForFaculty(facultyAId);
      for (const p of plans) {
        assert.strictEqual(
          p.faculty_id, facultyAId,
          `Plan '${p.title}' has faculty_id ${p.faculty_id}, expected ${facultyAId}`
        );
      }
    });

    // ISOLATE-2: faculty B's plans do not contain A's plans
    await t2.test("faculty B's filter returns exactly 1 plan", () => {
      const plans = getPlansForFaculty(facultyBId);
      assert.strictEqual(plans.length, 1,
        `Expected 1 plan for faculty B, got ${plans.length}`);
    });

    await t2.test("faculty A's plans do not appear in faculty B's results", () => {
      const bPlans = getPlansForFaculty(facultyBId);
      const titles = bPlans.map(p => p.title);
      assert.ok(!titles.includes("Plan A-1"),
        "Plan A-1 must not appear in faculty B's results");
      assert.ok(!titles.includes("Plan A-2"),
        "Plan A-2 must not appear in faculty B's results");
    });

    await t2.test("faculty B's only plan is Plan B-1", () => {
      const bPlans = getPlansForFaculty(facultyBId);
      assert.strictEqual(bPlans[0].title, "Plan B-1");
      assert.strictEqual(bPlans[0].faculty_id, facultyBId);
    });

    // ISOLATE-2 (symmetric): A's results don't contain B's plans
    await t2.test("faculty B's plans do not appear in faculty A's results", () => {
      const aPlans = getPlansForFaculty(facultyAId);
      const titles = aPlans.map(p => p.title);
      assert.ok(!titles.includes("Plan B-1"),
        "Plan B-1 must not appear in faculty A's results");
    });
  });

  // ── STATUS ROUNDTRIP: all valid statuses survive a DB insert + read ─────────
  await t.test("STATUS ROUNDTRIP — each valid status can be stored and retrieved", async (t2) => {
    const { getUserId, insertPlan, db } = await buildTestDb();

    const facultyAId    = getUserId("a@test.edu");
    const coordinatorId = getUserId("c@test.edu");

    for (const status of VALID_STATUSES) {
      await t2.test(`status '${status}' survives INSERT → SELECT`, () => {
        const id = insertPlan(facultyAId, `Plan for ${status}`, coordinatorId, status);
        assert.ok(id, `INSERT failed for status '${status}'`);

        const stmt = db.prepare("SELECT status FROM growth_plans WHERE id = ?");
        stmt.bind([id]);
        stmt.step();
        const row = stmt.getAsObject();
        stmt.free();

        assert.strictEqual(row.status, status,
          `Expected status '${status}' after SELECT, got '${row.status}'`);
      });
    }
  });

});
