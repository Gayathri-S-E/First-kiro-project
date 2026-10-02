/**
 * Test: coordinator role authorization
 *
 * Authorization rules under test:
 *   1. requireRole("coordinator") allows ONLY the coordinator role.
 *   2. faculty, hod, and admin are each blocked with HTTP 403.
 *   3. A missing req.user (unauthenticated) is rejected with HTTP 401.
 *   4. requireRole("coordinator") is independent of requireRole("admin","hod")
 *      — allowing coordinator on one route does not bleed into staff routes.
 *   5. Edge-case / rogue role strings are always blocked.
 *
 * Approach:
 *   Direct unit test of the exported requireRole factory using synthetic
 *   req/res/next objects — no HTTP server, no sql.js, no network.
 *   Identical pattern to role-authorization.test.js (existing passing test).
 *
 *   No application source files are modified.
 *   No new dependencies are introduced.
 */

"use strict";

const { test } = require("node:test");
const assert   = require("node:assert/strict");
const path     = require("node:path");

const { requireRole } = require(
  path.resolve(__dirname, "../middleware/auth.js")
);

// ── Helpers (identical to role-authorization.test.js) ─────────────────────

function makeMocks(role) {
  const req   = { user: role !== undefined ? { role } : undefined };
  const calls = { statusCode: null, body: null, nextCalled: false };
  const res   = {
    status(code) {
      calls.statusCode = code;
      return { json(body) { calls.body = body; return this; } };
    },
  };
  const next  = () => { calls.nextCalled = true; };
  return { req, res, next, calls };
}

function invoke(allowedRoles, callerRole) {
  const { req, res, next, calls } = makeMocks(callerRole);
  requireRole(...allowedRoles)(req, res, next);
  return calls;
}

// ── Route configurations under test ───────────────────────────────────────
const COORDINATOR_ONLY = ["coordinator"];
const STAFF            = ["admin", "hod"];   // existing — must be unaffected
const ADMIN_ONLY       = ["admin"];           // existing — must be unaffected

// All four concrete FCAT roles now that coordinator exists
const ALL_ROLES = ["faculty", "hod", "admin", "coordinator"];

// Edge-case strings that must never be granted access
const ROGUE_ROLES = [
  "",
  "Coordinator", "COORDINATOR",
  " coordinator", "coordinator ",
  "coord",
  "Admin", "ADMIN", "Hod", "HOD", "Faculty", "FACULTY",
  "superadmin", "root",
  "0", "1", "true", "null", "undefined",
  "coordinator' OR '1'='1",
  "'; DROP TABLE users; --",
];

// ── Test suite ─────────────────────────────────────────────────────────────

test("Authorization rule: coordinator role", async (t) => {

  // ── 1. requireRole("coordinator") — coordinator-only routes ──────────────
  await t.test('requireRole("coordinator") — coordinator routes', async (t2) => {

    await t2.test("coordinator role: calls next(), does not set status", () => {
      const c = invoke(COORDINATOR_ONLY, "coordinator");
      assert.strictEqual(c.nextCalled,  true,  "coordinator must call next()");
      assert.strictEqual(c.statusCode,  null,  "no status code expected for coordinator");
    });

    await t2.test("faculty role: returns 403 Insufficient permissions", () => {
      const c = invoke(COORDINATOR_ONLY, "faculty");
      assert.strictEqual(c.nextCalled,  false);
      assert.strictEqual(c.statusCode,  403);
      assert.strictEqual(c.body?.error, "Insufficient permissions");
    });

    await t2.test("hod role: returns 403 Insufficient permissions", () => {
      const c = invoke(COORDINATOR_ONLY, "hod");
      assert.strictEqual(c.nextCalled,  false);
      assert.strictEqual(c.statusCode,  403);
      assert.strictEqual(c.body?.error, "Insufficient permissions");
    });

    await t2.test("admin role: returns 403 Insufficient permissions", () => {
      const c = invoke(COORDINATOR_ONLY, "admin");
      assert.strictEqual(c.nextCalled,  false);
      assert.strictEqual(c.statusCode,  403);
      assert.strictEqual(c.body?.error, "Insufficient permissions");
    });

    await t2.test("missing req.user: returns 401 Not authenticated", () => {
      const c = invoke(COORDINATOR_ONLY, undefined);
      assert.strictEqual(c.nextCalled,  false);
      assert.strictEqual(c.statusCode,  401);
      assert.strictEqual(c.body?.error, "Not authenticated");
    });
  });

  // ── 2. Every FCAT role vs COORDINATOR_ONLY — exhaustive matrix ───────────
  await t.test("Exhaustive role matrix against requireRole(\"coordinator\")", async (t2) => {
    const allowed = ["coordinator"];
    const blocked = ["faculty", "hod", "admin"];

    for (const role of allowed) {
      await t2.test(`'${role}' is ALLOWED`, () => {
        const c = invoke(COORDINATOR_ONLY, role);
        assert.strictEqual(c.nextCalled, true,  `${role} must be allowed`);
        assert.strictEqual(c.statusCode, null);
      });
    }

    for (const role of blocked) {
      await t2.test(`'${role}' is BLOCKED → 403`, () => {
        const c = invoke(COORDINATOR_ONLY, role);
        assert.strictEqual(c.nextCalled, false, `${role} must be blocked`);
        assert.strictEqual(c.statusCode, 403);
      });
    }
  });

  // ── 3. Coordinator is blocked from existing staff/admin-only routes ───────
  await t.test("coordinator is blocked from existing staff and admin-only routes", async (t2) => {

    await t2.test('requireRole("admin","hod"): coordinator → 403', () => {
      const c = invoke(STAFF, "coordinator");
      assert.strictEqual(c.nextCalled, false, "coordinator must not access staff routes");
      assert.strictEqual(c.statusCode, 403);
      assert.strictEqual(c.body?.error, "Insufficient permissions");
    });

    await t2.test('requireRole("admin"): coordinator → 403', () => {
      const c = invoke(ADMIN_ONLY, "coordinator");
      assert.strictEqual(c.nextCalled, false, "coordinator must not access admin-only routes");
      assert.strictEqual(c.statusCode, 403);
      assert.strictEqual(c.body?.error, "Insufficient permissions");
    });
  });

  // ── 4. Existing role decisions are unaffected ──────────────────────────────
  // Confirms adding coordinator to the codebase did not change how
  // requireRole behaves for the three pre-existing roles.
  await t.test("existing role decisions are unchanged", async (t2) => {

    await t2.test('requireRole("admin"): admin still allowed', () => {
      const c = invoke(ADMIN_ONLY, "admin");
      assert.strictEqual(c.nextCalled, true);
      assert.strictEqual(c.statusCode, null);
    });

    await t2.test('requireRole("admin"): hod still blocked', () => {
      const c = invoke(ADMIN_ONLY, "hod");
      assert.strictEqual(c.statusCode, 403);
    });

    await t2.test('requireRole("admin"): faculty still blocked', () => {
      const c = invoke(ADMIN_ONLY, "faculty");
      assert.strictEqual(c.statusCode, 403);
    });

    await t2.test('requireRole("admin","hod"): admin still allowed', () => {
      const c = invoke(STAFF, "admin");
      assert.strictEqual(c.nextCalled, true);
    });

    await t2.test('requireRole("admin","hod"): hod still allowed', () => {
      const c = invoke(STAFF, "hod");
      assert.strictEqual(c.nextCalled, true);
    });

    await t2.test('requireRole("admin","hod"): faculty still blocked', () => {
      const c = invoke(STAFF, "faculty");
      assert.strictEqual(c.statusCode, 403);
    });
  });

  // ── 5. Factory independence ────────────────────────────────────────────────
  await t.test("requireRole factory independence", async (t2) => {

    await t2.test("coordinator and staff instances are distinct functions", () => {
      const mw1 = requireRole("coordinator");
      const mw2 = requireRole("admin", "hod");
      assert.notStrictEqual(mw1, mw2,
        "Each requireRole() call must return a distinct middleware function");
    });

    await t2.test("allowing coordinator does not grant staff access", () => {
      // coordinator allowed by coordinatorMw, blocked by staffMw
      const coordinatorMw = requireRole("coordinator");
      const staffMw       = requireRole("admin", "hod");

      const { req: r1, res: res1, next: n1, calls: c1 } = makeMocks("coordinator");
      coordinatorMw(r1, res1, n1);
      assert.strictEqual(c1.nextCalled, true,  "coordinator allowed by coordinatorMw");

      const { req: r2, res: res2, next: n2, calls: c2 } = makeMocks("coordinator");
      staffMw(r2, res2, n2);
      assert.strictEqual(c2.statusCode, 403,   "coordinator blocked by staffMw");
      assert.strictEqual(c2.nextCalled, false);
    });

    await t2.test("allowing staff does not grant coordinator access", () => {
      const staffMw       = requireRole("admin", "hod");
      const coordinatorMw = requireRole("coordinator");

      const { req: r1, res: res1, next: n1, calls: c1 } = makeMocks("hod");
      staffMw(r1, res1, n1);
      assert.strictEqual(c1.nextCalled, true, "hod allowed by staffMw");

      const { req: r2, res: res2, next: n2, calls: c2 } = makeMocks("hod");
      coordinatorMw(r2, res2, n2);
      assert.strictEqual(c2.statusCode, 403,  "hod blocked by coordinatorMw");
    });
  });

  // ── 6. Rogue / edge-case role strings ─────────────────────────────────────
  await t.test("rogue and edge-case role strings are always blocked", async (t2) => {
    for (const rogue of ROGUE_ROLES) {
      const label = JSON.stringify(rogue).slice(0, 50);
      await t2.test(`requireRole("coordinator"): ${label} → 403`, () => {
        const c = invoke(COORDINATOR_ONLY, rogue);
        assert.strictEqual(c.statusCode,  403,   `Expected 403 for ${label}`);
        assert.strictEqual(c.nextCalled,  false);
      });
    }
  });

});
