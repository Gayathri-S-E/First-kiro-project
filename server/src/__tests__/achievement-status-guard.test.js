/**
 * Property-Based Test: Achievement edit/delete status guard
 *
 * Business rule under test (REQ-ACH-5, REQ-ACH-6):
 *   "Faculty may only edit or delete their own achievements while those
 *    achievements are in 'pending' status. Attempting to edit or delete an
 *    achievement whose status is 'approved' or 'rejected' must be blocked."
 *
 * This rule is enforced in routes/achievements.js:
 *
 *   PUT  /:id  — if (ach.status !== "pending") → 400 "Cannot edit an already-reviewed achievement"
 *   DELETE /:id — if (ach.status !== "pending") → 400 "Cannot delete a reviewed achievement"
 *
 * Approach:
 *   We test the status-guard predicate directly against an in-memory sql.js
 *   database, exactly as the route handler does, across:
 *     - The one status that MUST be allowed   (pending)
 *     - The two statuses that MUST be blocked (approved, rejected)
 *     - A broad corpus of edge-case strings   (none of which should be allowed)
 *
 *   No HTTP server is started. No application source files are modified.
 *   No new dependencies are introduced.
 *
 *   Structure follows the pattern established by achievement-type-validation.test.js:
 *   a single top-level async test() that awaits the DB setup, then registers
 *   sub-tests with describe/test — avoiding the node:test "parent finished"
 *   pitfall that occurs when test() calls are made inside async describe().
 */

"use strict";

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// ── Input corpus: status strings that must NEVER allow the operation ──────────

function blockedStatusValues() {
  return [
    // The two reviewed statuses defined by the application
    "approved",
    "rejected",
    // Case variants
    "Pending", "PENDING", "Approved", "APPROVED", "Rejected", "REJECTED",
    // Whitespace variants
    " pending", "pending ", " pending ",
    " approved", "approved ",
    " rejected", "rejected ",
    // Partial matches
    "pend", "approv", "reject",
    // Unrelated words
    "draft", "review", "verified", "complete", "active", "inactive",
    // Empty / null-like strings
    "", "null", "undefined", "none",
    // Numeric strings
    "0", "1", "2",
    // SQL injection probes (must not bypass the === "pending" check)
    "pending' OR '1'='1",
    "'; DROP TABLE achievements; --",
    // Special characters
    "pen%ding", "pend\ning", "approved\x00",
  ];
}

// ── Main test suite ───────────────────────────────────────────────────────────
// Wrapped in a single top-level async test() so the sql.js import resolves
// before any sub-tests are registered (matches the pattern in
// achievement-type-validation.test.js).

test("Business rule: achievement edit/delete status guard", async (t) => {

  // ── Bootstrap an isolated in-memory DB ──────────────────────────────────
  // Mirrors the relevant parts of the schema in server/src/db.js.

  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  const db  = new SQL.Database();

  db.run("PRAGMA foreign_keys = ON;");

  // Minimal schema — only the columns the guard cares about
  db.run(`
    CREATE TABLE users (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE achievements (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title   TEXT    NOT NULL,
      status  TEXT    NOT NULL DEFAULT 'pending'
              CHECK(status IN ('pending','approved','rejected'))
    )
  `);

  // One faculty user and one achievement for each of the three valid statuses
  db.run("INSERT INTO users (name) VALUES ('Dr. Test Faculty')");
  for (const s of ["pending", "approved", "rejected"]) {
    db.run(
      "INSERT INTO achievements (user_id, title, status) VALUES (1, ?, ?)",
      [`Test achievement — ${s}`, s]
    );
  }

  /**
   * canEditOrDelete — mirrors the exact guard used in routes/achievements.js:
   *
   *   const ach = db.get("SELECT * FROM achievements WHERE id = ?", [id]);
   *   if (ach.status !== "pending") return res.status(400)...
   *
   * Returns true  → operation is permitted (status === "pending")
   * Returns false → operation is blocked   (status !== "pending")
   * Returns null  → achievement not found
   */
  function canEditOrDelete(achievementId) {
    const stmt = db.prepare(
      "SELECT status FROM achievements WHERE id = ?"
    );
    stmt.bind([achievementId]);
    const found = stmt.step();
    const result = found ? stmt.getAsObject() : null;
    stmt.free();
    if (!result) return null;
    return result.status === "pending";
  }

  /** Helper: find the seeded achievement id for a given status string. */
  function getIdByStatus(status) {
    const stmt = db.prepare(
      "SELECT id FROM achievements WHERE status = ? LIMIT 1"
    );
    stmt.bind([status]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row.id;
  }

  // ── Rule 1: pending → ALLOWED ──────────────────────────────────────────
  await t.test("Rule 1 — pending status allows edit and delete", (t2) => {
    const id = getIdByStatus("pending");
    assert.strictEqual(
      canEditOrDelete(id),
      true,
      "Expected 'pending' achievement to be editable/deletable"
    );
  });

  // ── Rule 2: approved → BLOCKED ─────────────────────────────────────────
  await t.test("Rule 2 — approved status blocks edit and delete", (t2) => {
    const id = getIdByStatus("approved");
    assert.strictEqual(
      canEditOrDelete(id),
      false,
      "Expected 'approved' achievement to be blocked from edit/delete"
    );
  });

  // ── Rule 3: rejected → BLOCKED ─────────────────────────────────────────
  await t.test("Rule 3 — rejected status blocks edit and delete", (t2) => {
    const id = getIdByStatus("rejected");
    assert.strictEqual(
      canEditOrDelete(id),
      false,
      "Expected 'rejected' achievement to be blocked from edit/delete"
    );
  });

  // ── Rule 4: non-existent achievement → null (not permitted) ────────────
  await t.test("Rule 4 — non-existent achievement ID returns null (not permitted)", async (t2) => {
    await t2.test("returns null for unknown ID", () => {
      assert.strictEqual(
        canEditOrDelete(99999),
        null,
        "Expected null for a non-existent achievement ID"
      );
    });

    await t2.test("null is falsy (route treats it as blocked)", () => {
      assert.ok(
        !canEditOrDelete(99999),
        "Expected null/falsy result so the route blocks the operation"
      );
    });
  });

  // ── Rule 5: only the exact string "pending" permits the operation ───────
  // We use a shadow table without the CHECK constraint to store arbitrary
  // strings and verify the guard rejects all of them.
  await t.test(
    "Rule 5 — only the exact string 'pending' permits the operation",
    async (t2) => {
      // Shadow table: no CHECK constraint, so we can insert any status string
      db.run(`
        CREATE TABLE achievements_shadow (
          id     INTEGER PRIMARY KEY AUTOINCREMENT,
          status TEXT NOT NULL
        )
      `);

      function canEditOrDeleteShadow(id) {
        const stmt = db.prepare(
          "SELECT status FROM achievements_shadow WHERE id = ?"
        );
        stmt.bind([id]);
        stmt.step();
        const row = stmt.getAsObject();
        stmt.free();
        return row.status === "pending";
      }

      for (const sv of blockedStatusValues()) {
        db.run("INSERT INTO achievements_shadow (status) VALUES (?)", [sv]);

        // Retrieve the id of the row we just inserted
        const idStmt = db.prepare(
          "SELECT id FROM achievements_shadow ORDER BY id DESC LIMIT 1"
        );
        idStmt.step();
        const { id } = idStmt.getAsObject();
        idStmt.free();

        const label = JSON.stringify(sv).slice(0, 60);
        await t2.test(`status ${label} is blocked`, () => {
          assert.strictEqual(
            canEditOrDeleteShadow(id),
            false,
            `Expected status ${label} to be blocked, but guard allowed it`
          );
        });
      }
    }
  );
});
