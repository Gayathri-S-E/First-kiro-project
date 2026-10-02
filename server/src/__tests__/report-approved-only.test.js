/**
 * Test: Report data contains only approved achievements
 *
 * Business rule under test (REQ-REP-1, REQ-REP-5):
 *   "The career report must only include approved achievements.
 *    Pending and rejected achievements must never appear in
 *    achievementsByType, regardless of how many exist in the database."
 *
 * This rule is enforced in routes/reports.js via:
 *
 *   SELECT ... FROM achievements
 *   WHERE user_id = ? AND type_code = ? AND status = 'approved'
 *   ORDER BY date_achieved DESC, created_at DESC
 *
 * This query populates achievementsByType — the primary payload consumed by
 * Report.jsx to build the faculty PDF export.
 *
 * Approach:
 *   We replicate the exact query from the route against an in-memory sql.js
 *   database seeded with achievements in all three statuses, then verify:
 *
 *   1. Approved achievements appear in achievementsByType.
 *   2. Pending achievements are completely absent.
 *   3. Rejected achievements are completely absent.
 *   4. All 7 categories are always present as keys (even when empty).
 *   5. A user with zero approved achievements produces empty arrays, not
 *      null / undefined / missing keys.
 *   6. Approved achievements for OTHER users do not bleed into the result.
 *
 *   No HTTP server is started. No application source files are modified.
 *   No new dependencies are introduced.
 *   Pattern follows achievement-type-validation.test.js and
 *   achievement-status-guard.test.js: single top-level async test() that
 *   awaits DB setup before registering sub-tests.
 */

"use strict";

const { test } = require("node:test");
const assert   = require("node:assert/strict");

// ── The 7 fixed achievement categories (matches db.js seed) ──────────────────
const VALID_TYPES = [
  { code: "publication",   label: "Publications"                  },
  { code: "certification", label: "Certifications"                },
  { code: "conference",    label: "Conferences"                   },
  { code: "workshop",      label: "Workshops"                     },
  { code: "research",      label: "Research Projects"             },
  { code: "patent",        label: "Patents"                       },
  { code: "teaching",      label: "Academic/Teaching Activities"  },
];

// ── sql.js multi-row helper ───────────────────────────────────────────────────
// sql.js prepared statements must not be reused across .bind() calls without
// calling .reset() first. Using exec() with a bound query helper avoids that
// pitfall and closely mirrors the db.all() helper in server/src/db.js.

function queryAll(db, sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params) {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// ── Bootstrap an isolated in-memory DB ───────────────────────────────────────

async function buildTestDb() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  const db  = new SQL.Database();

  db.run("PRAGMA foreign_keys = ON;");

  db.run(`
    CREATE TABLE users (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE achievement_types (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      code       TEXT    NOT NULL UNIQUE,
      label      TEXT    NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE achievements (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      type_code     TEXT    NOT NULL,
      title         TEXT    NOT NULL,
      description   TEXT,
      date_achieved TEXT,
      issuer        TEXT,
      url           TEXT,
      status        TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','approved','rejected')),
      created_at    TEXT    DEFAULT (datetime('now'))
    )
  `);

  // Seed the 7 achievement types
  for (let i = 0; i < VALID_TYPES.length; i++) {
    const { code, label } = VALID_TYPES[i];
    db.run(
      "INSERT INTO achievement_types (code, label, sort_order) VALUES (?, ?, ?)",
      [code, label, i]
    );
  }

  // Two faculty users
  db.run("INSERT INTO users (name) VALUES ('Dr. Target Faculty')");   // id 1
  db.run("INSERT INTO users (name) VALUES ('Dr. Other Faculty')");    // id 2

  // Dr. Target (user 1): one achievement per type in each of the 3 statuses
  for (const { code } of VALID_TYPES) {
    for (const status of ["pending", "approved", "rejected"]) {
      db.run(
        "INSERT INTO achievements (user_id, type_code, title, status) VALUES (?, ?, ?, ?)",
        [1, code, `${code}:${status}:target`, status]
      );
    }
  }

  // Dr. Other (user 2): one approved achievement per type
  // These must never appear in user 1's report.
  for (const { code } of VALID_TYPES) {
    db.run(
      "INSERT INTO achievements (user_id, type_code, title, status) VALUES (?, ?, ?, 'approved')",
      [2, code, `${code}:approved:other`]
    );
  }

  /**
   * buildAchievementsByType(userId)
   *
   * Mirrors the exact query loop in routes/reports.js
   * GET /api/reports/faculty/:userId.
   *
   * For each achievement type, SELECT only approved rows for the given user,
   * ordered by date_achieved DESC, created_at DESC.
   */
  function buildAchievementsByType(userId) {
    const types = queryAll(
      db,
      "SELECT * FROM achievement_types ORDER BY sort_order",
      []
    );

    const achievementsByType = {};
    for (const t of types) {
      const items = queryAll(
        db,
        `SELECT id, title, description, date_achieved, issuer, url, created_at
         FROM achievements
         WHERE user_id = ? AND type_code = ? AND status = 'approved'
         ORDER BY date_achieved DESC, created_at DESC`,
        [userId, t.code]
      );
      achievementsByType[t.code] = { label: t.label, items };
    }
    return achievementsByType;
  }

  return { db, buildAchievementsByType };
}

// ── Test suite ────────────────────────────────────────────────────────────────

test("Business rule: report achievementsByType contains only approved achievements", async (t) => {

  const { db, buildAchievementsByType } = await buildTestDb();
  const TARGET_USER = 1;
  const result      = buildAchievementsByType(TARGET_USER);

  // ── Rule 1: approved achievements appear in the report ───────────────────
  await t.test("Rule 1 — approved achievements are present in achievementsByType", async (t2) => {
    for (const { code } of VALID_TYPES) {
      await t2.test(`type '${code}' contains exactly one approved item`, () => {
        const { items } = result[code];
        assert.strictEqual(
          items.length,
          1,
          `Expected exactly 1 approved item for type '${code}', got ${items.length}`
        );
        // Title was seeded as "<code>:approved:target"
        assert.ok(
          items[0].title.includes(":approved:"),
          `Expected title to contain ':approved:', got: "${items[0].title}"`
        );
      });
    }
  });

  // ── Rule 2: pending achievements are absent ───────────────────────────────
  await t.test("Rule 2 — pending achievements are absent from achievementsByType", async (t2) => {
    for (const { code } of VALID_TYPES) {
      await t2.test(`type '${code}' contains no pending items`, () => {
        const { items } = result[code];
        const hasPending = items.some(item => item.title.includes(":pending:"));
        assert.strictEqual(
          hasPending,
          false,
          `Type '${code}' unexpectedly contains a pending achievement`
        );
      });
    }
  });

  // ── Rule 3: rejected achievements are absent ──────────────────────────────
  await t.test("Rule 3 — rejected achievements are absent from achievementsByType", async (t2) => {
    for (const { code } of VALID_TYPES) {
      await t2.test(`type '${code}' contains no rejected items`, () => {
        const { items } = result[code];
        const hasRejected = items.some(item => item.title.includes(":rejected:"));
        assert.strictEqual(
          hasRejected,
          false,
          `Type '${code}' unexpectedly contains a rejected achievement`
        );
      });
    }
  });

  // ── Rule 4: all 7 categories always present as keys ───────────────────────
  await t.test("Rule 4 — achievementsByType contains a key for every achievement type", async (t2) => {
    for (const { code, label } of VALID_TYPES) {
      await t2.test(`key '${code}' is present with correct label and items array`, () => {
        assert.ok(
          Object.prototype.hasOwnProperty.call(result, code),
          `Expected key '${code}' to be present in achievementsByType`
        );
        assert.strictEqual(
          result[code].label,
          label,
          `Expected label '${label}' for type '${code}', got '${result[code].label}'`
        );
        assert.ok(
          Array.isArray(result[code].items),
          `Expected result['${code}'].items to be an array`
        );
      });
    }
  });

  // ── Rule 5: user with zero approved achievements gets empty arrays ─────────
  await t.test(
    "Rule 5 — user with no approved achievements gets empty item arrays for every type",
    async (t2) => {
      // Insert a third user with only pending achievements into the shared DB
      db.run("INSERT INTO users (name) VALUES ('Dr. No Approvals')"); // id 3
      for (const { code } of VALID_TYPES) {
        db.run(
          "INSERT INTO achievements (user_id, type_code, title, status) VALUES (?, ?, ?, 'pending')",
          [3, code, `${code}:pending:noapprovals`]
        );
      }
      // buildAchievementsByType closes over the same db, so user 3's rows are visible
      const emptyResult = buildAchievementsByType(3);

      for (const { code } of VALID_TYPES) {
        await t2.test(`type '${code}' items is an empty array, not null or missing`, () => {
          assert.ok(
            Object.prototype.hasOwnProperty.call(emptyResult, code),
            `Key '${code}' must exist even when there are no approved achievements`
          );
          assert.ok(
            Array.isArray(emptyResult[code].items),
            `items for '${code}' must be an array, not ${typeof emptyResult[code].items}`
          );
          assert.strictEqual(
            emptyResult[code].items.length,
            0,
            `Expected 0 items for '${code}', got ${emptyResult[code].items.length}`
          );
        });
      }
    }
  );

  // ── Rule 6: another user's approved achievements do not appear ────────────
  await t.test(
    "Rule 6 — approved achievements from other users are excluded from the report",
    async (t2) => {
      // result was built for TARGET_USER (1).
      // Dr. Other (user 2) also has 1 approved item per type.
      // Each type must still show exactly 1 item (target's), never 2.
      for (const { code } of VALID_TYPES) {
        await t2.test(`type '${code}' shows only target user's item, not other user's`, () => {
          const { items } = result[code];
          assert.strictEqual(
            items.length,
            1,
            `Type '${code}' has ${items.length} items — other user's data may have leaked in`
          );
          assert.ok(
            items[0].title.endsWith(":target"),
            `Expected title to end with ':target', got: "${items[0].title}"`
          );
        });
      }
    }
  );

});
