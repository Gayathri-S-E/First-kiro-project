/**
 * Test: requireRole middleware authorization logic
 *
 * Authorization rule under test (REQ-AUTH-3, REQ-AUTH-4, backend-conventions):
 *   "Only users whose role matches one of the allowed roles may access a
 *    protected route. Any other role, or the absence of an authenticated user,
 *    must be rejected with the correct HTTP status code."
 *
 * This rule is enforced by requireRole() in server/src/middleware/auth.js:
 *
 *   function requireRole(...roles) {
 *     return (req, res, next) => {
 *       if (!req.user) return res.status(401).json({ error: "Not authenticated" });
 *       if (!roles.includes(req.user.role))
 *         return res.status(403).json({ error: "Insufficient permissions" });
 *       next();
 *     };
 *   }
 *
 * requireRole() is the single middleware called on every elevated route:
 *   - requireRole("admin")        — admin-only: POST/DELETE /api/admin/users
 *   - requireRole("admin","hod")  — staff: all other /api/admin/* and milestone writes
 *
 * Despite being the authorization foundation for the entire application, the
 * function's behavior has never been unit-tested.
 *
 * Approach:
 *   We call the exported requireRole factory directly, passing synthetic
 *   req/res/next objects — no HTTP server, no sql.js, no network.
 *   This keeps the test purely focused on the middleware contract.
 *
 *   Scenarios covered:
 *   1. Allowed role(s) call next() — not res.status().
 *   2. Disallowed role returns 403 with { error: "Insufficient permissions" }.
 *   3. Missing req.user returns 401 with { error: "Not authenticated" }.
 *   4. Every FCAT role is tested against every requireRole configuration
 *      actually used in the application.
 *   5. Edge-case role strings (empty, numeric, SQL injection) are always blocked.
 *
 *   No application source files are modified.
 *   No new dependencies are introduced.
 *   Pattern follows the existing test files: single top-level async test()
 *   with awaited sub-tests.
 */

"use strict";

const { test }     = require("node:test");
const assert       = require("node:assert/strict");
const path         = require("node:path");

// Import the real middleware — no mocking, no substitution.
const { requireRole } = require(
  path.resolve(__dirname, "../middleware/auth.js")
);

// ── Minimal req/res/next helpers ─────────────────────────────────────────────

/**
 * makeMocks(role) — build synthetic req, res, next for one invocation.
 *
 * res.status(n) returns a chainable object with .json(body) that records
 * the call so assertions can inspect it.
 */
function makeMocks(role) {
  const req = { user: role !== undefined ? { role } : undefined };

  const calls = { statusCode: null, body: null, nextCalled: false };

  const res = {
    status(code) {
      calls.statusCode = code;
      return {
        json(body) {
          calls.body = body;
          return this;
        },
      };
    },
  };

  const next = () => { calls.nextCalled = true; };

  return { req, res, next, calls };
}

/**
 * invoke(allowedRoles, callerRole) — run the middleware and return the call log.
 * Pass callerRole = undefined to simulate a missing req.user.
 */
function invoke(allowedRoles, callerRole) {
  const { req, res, next, calls } = makeMocks(callerRole);
  const middleware = requireRole(...allowedRoles);
  middleware(req, res, next);
  return calls;
}

// ── The two requireRole configurations used in routes/ ───────────────────────
// Taken directly from admin.js and milestones.js:
//   requireRole("admin")          → POST/DELETE /api/admin/users
//   requireRole("admin", "hod")   → all other /api/admin/* + milestone writes

const ADMIN_ONLY  = ["admin"];
const STAFF       = ["admin", "hod"];

// The three real FCAT roles
const ALL_ROLES   = ["faculty", "hod", "admin"];

// Edge-case role strings that must never be granted access
const ROGUE_ROLES = [
  "",           // empty string
  "Admin",      // wrong case
  "ADMIN",
  "HOD",
  "Faculty",
  "FACULTY",
  "superadmin",
  "root",
  "administrator",
  " admin",     // leading space
  "admin ",     // trailing space
  "0",
  "1",
  "true",
  "null",
  "undefined",
  "admin' OR '1'='1",                  // SQL injection probe
  "'; DROP TABLE users; --",
];

// ── Test suite ────────────────────────────────────────────────────────────────

test("Authorization rule: requireRole middleware", async (t) => {

  // ── Scenario 1: requireRole("admin") ─────────────────────────────────────
  await t.test('requireRole("admin") — admin-only routes', async (t2) => {

    await t2.test("admin role: calls next(), does not set status", () => {
      const calls = invoke(ADMIN_ONLY, "admin");
      assert.strictEqual(calls.nextCalled, true,  "Expected next() to be called for admin");
      assert.strictEqual(calls.statusCode, null,  "Expected no status code set for admin");
    });

    await t2.test("hod role: returns 403 Insufficient permissions", () => {
      const calls = invoke(ADMIN_ONLY, "hod");
      assert.strictEqual(calls.nextCalled, false, "Expected next() NOT called for hod");
      assert.strictEqual(calls.statusCode, 403,   "Expected HTTP 403 for hod");
      assert.strictEqual(calls.body?.error, "Insufficient permissions");
    });

    await t2.test("faculty role: returns 403 Insufficient permissions", () => {
      const calls = invoke(ADMIN_ONLY, "faculty");
      assert.strictEqual(calls.nextCalled, false, "Expected next() NOT called for faculty");
      assert.strictEqual(calls.statusCode, 403,   "Expected HTTP 403 for faculty");
      assert.strictEqual(calls.body?.error, "Insufficient permissions");
    });

    await t2.test("missing req.user: returns 401 Not authenticated", () => {
      const calls = invoke(ADMIN_ONLY, undefined);
      assert.strictEqual(calls.nextCalled, false, "Expected next() NOT called when no user");
      assert.strictEqual(calls.statusCode, 401,   "Expected HTTP 401 when req.user is missing");
      assert.strictEqual(calls.body?.error, "Not authenticated");
    });
  });

  // ── Scenario 2: requireRole("admin", "hod") ───────────────────────────────
  await t.test('requireRole("admin","hod") — staff routes', async (t2) => {

    await t2.test("admin role: calls next()", () => {
      const calls = invoke(STAFF, "admin");
      assert.strictEqual(calls.nextCalled, true,  "Expected next() called for admin");
      assert.strictEqual(calls.statusCode, null,  "Expected no status code for admin");
    });

    await t2.test("hod role: calls next()", () => {
      const calls = invoke(STAFF, "hod");
      assert.strictEqual(calls.nextCalled, true,  "Expected next() called for hod");
      assert.strictEqual(calls.statusCode, null,  "Expected no status code for hod");
    });

    await t2.test("faculty role: returns 403 Insufficient permissions", () => {
      const calls = invoke(STAFF, "faculty");
      assert.strictEqual(calls.nextCalled, false, "Expected next() NOT called for faculty");
      assert.strictEqual(calls.statusCode, 403,   "Expected HTTP 403 for faculty");
      assert.strictEqual(calls.body?.error, "Insufficient permissions");
    });

    await t2.test("missing req.user: returns 401 Not authenticated", () => {
      const calls = invoke(STAFF, undefined);
      assert.strictEqual(calls.nextCalled, false, "Expected next() NOT called when no user");
      assert.strictEqual(calls.statusCode, 401,   "Expected HTTP 401 when req.user is missing");
      assert.strictEqual(calls.body?.error, "Not authenticated");
    });
  });

  // ── Scenario 3: each FCAT role tested against both configurations ─────────
  await t.test("Each FCAT role produces the correct decision for every route configuration", async (t2) => {
    const configs = [
      { label: 'requireRole("admin")',       roles: ADMIN_ONLY, allowed: ["admin"],         blocked: ["hod","faculty"] },
      { label: 'requireRole("admin","hod")', roles: STAFF,      allowed: ["admin","hod"],    blocked: ["faculty"]       },
    ];

    for (const { label, roles, allowed, blocked } of configs) {
      for (const role of allowed) {
        await t2.test(`${label}: '${role}' is ALLOWED → next() called`, () => {
          const calls = invoke(roles, role);
          assert.strictEqual(calls.nextCalled, true,
            `Expected next() for allowed role '${role}' on ${label}`);
        });
      }
      for (const role of blocked) {
        await t2.test(`${label}: '${role}' is BLOCKED → 403`, () => {
          const calls = invoke(roles, role);
          assert.strictEqual(calls.statusCode, 403,
            `Expected 403 for blocked role '${role}' on ${label}`);
          assert.strictEqual(calls.nextCalled, false,
            `Expected next() NOT called for blocked role '${role}' on ${label}`);
        });
      }
    }
  });

  // ── Scenario 4: rogue / edge-case role strings are always blocked ─────────
  await t.test("Edge-case and rogue role strings are blocked by all route configurations", async (t2) => {
    for (const rogue of ROGUE_ROLES) {
      const label = JSON.stringify(rogue).slice(0, 50);

      await t2.test(`requireRole("admin"): rogue role ${label} → 403`, () => {
        const calls = invoke(ADMIN_ONLY, rogue);
        assert.strictEqual(calls.statusCode, 403,
          `Expected 403 for rogue role ${label} on admin-only route`);
        assert.strictEqual(calls.nextCalled, false);
      });

      await t2.test(`requireRole("admin","hod"): rogue role ${label} → 403`, () => {
        const calls = invoke(STAFF, rogue);
        assert.strictEqual(calls.statusCode, 403,
          `Expected 403 for rogue role ${label} on staff route`);
        assert.strictEqual(calls.nextCalled, false);
      });
    }
  });

  // ── Scenario 5: middleware is a factory — each call returns a fresh function
  await t.test("requireRole is a factory: each call returns an independent middleware function", async (t2) => {

    await t2.test("two calls to requireRole produce independent functions", () => {
      const mw1 = requireRole("admin");
      const mw2 = requireRole("admin", "hod");
      assert.notStrictEqual(mw1, mw2,
        "Each requireRole() call must return a distinct function");
    });

    await t2.test("allowing one role in one instance does not affect the other", () => {
      const adminOnly = requireRole("admin");
      const staff     = requireRole("admin", "hod");

      // hod: blocked by adminOnly, allowed by staff
      const { req: req1, res: res1, next: next1, calls: calls1 } = makeMocks("hod");
      adminOnly(req1, res1, next1);
      assert.strictEqual(calls1.statusCode, 403,  "adminOnly should block hod");
      assert.strictEqual(calls1.nextCalled,  false);

      const { req: req2, res: res2, next: next2, calls: calls2 } = makeMocks("hod");
      staff(req2, res2, next2);
      assert.strictEqual(calls2.nextCalled,  true, "staff should allow hod");
      assert.strictEqual(calls2.statusCode,  null);
    });
  });

});
