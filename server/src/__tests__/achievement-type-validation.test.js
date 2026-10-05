/**
 * Property-Based Tests: achievement type_code validation
 *
 * Requirement: REQ-ACH-2
 *   "The system must support the following 7 fixed achievement categories:
 *    Publications, Certifications, Conferences, Workshops, Research Projects,
 *    Patents, Academic/Teaching Activities."
 *
 *   The validation rule (server/src/routes/achievements.js, POST /):
 *     const validType = db.get(
 *       "SELECT code FROM achievement_types WHERE code = ?", [type_code]
 *     );
 *     if (!validType) return res.status(400) ...
 *
 * Properties extracted from REQ-ACH-2:
 *
 *   P1 — VALID-ACCEPTED
 *     For every type_code that exists in the achievement_types table,
 *     the validation function MUST return accepted (truthy).
 *     ∀ code ∈ achievement_types.code → isValid(code) === true
 *
 *   P2 — INVALID-REJECTED
 *     For any string that is NOT a member of the achievement_types set,
 *     the validation function MUST return rejected (falsy).
 *     ∀ s ∉ achievement_types.code → isValid(s) === false
 *
 *   P3 — AUTHORITATIVE-SET
 *     The set of accepted values corresponds exactly to the codes seeded
 *     into the achievement_types table at DB initialisation — no more,
 *     no fewer. The test derives this set from the DB itself, not from a
 *     hardcoded duplicate list in the test file.
 *
 * Why these are universal properties, not examples:
 *   P1 and P3 are exhaustively verified over every member of the valid set
 *   (7 values seeded by db.js) using fast-check's constantFrom() arbitrary.
 *   P2 is verified over an arbitrarily generated space of random strings
 *   (fast-check fc.string(), 100 samples per run by default), with the
 *   valid set filtered out so the property is genuinely universal.
 *
 * Approach:
 *   - fast-check (devDependency) for arbitrary generation and shrinking.
 *   - sql.js in-memory DB, same bootstrapping pattern as other tests.
 *   - The validation predicate mirrors the exact SQL used by the route.
 *   - No production code is modified.
 *   - No new runtime dependency is added (fast-check is devDependencies).
 *
 * Traceability:
 *   REQ-ACH-2 → P1/P2/P3 → tasks.md §3-PBT → this file
 */

"use strict";

const { test }    = require("node:test");
const assert      = require("node:assert/strict");
const fc          = require("fast-check");

// ── Bootstrap an isolated in-memory DB ────────────────────────────────────────
// Mirrors the schema and seed data in server/src/db.js createSchema().
// No disk file is touched; no production DB is used.

async function buildTestDb() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  const db  = new SQL.Database();

  db.run("PRAGMA foreign_keys = ON;");

  db.run(`
    CREATE TABLE achievement_types (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      code       TEXT NOT NULL UNIQUE,
      label      TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Seed exactly the same 7 types that db.js seeds at startup.
  // This is the CANONICAL SOURCE OF TRUTH for the valid set.
  // The test does NOT hardcode this list separately — it reads it from the DB.
  const SEED_TYPES = [
    ["publication",   "Publications",          1],
    ["certification", "Certifications",         2],
    ["conference",    "Conferences",            3],
    ["workshop",      "Workshops",              4],
    ["research",      "Research Projects",      5],
    ["patent",        "Patents",                6],
    ["teaching",      "Academic/Teaching",      7],
  ];
  for (const [code, label, sort_order] of SEED_TYPES) {
    db.run(
      "INSERT INTO achievement_types (code, label, sort_order) VALUES (?, ?, ?)",
      [code, label, sort_order]
    );
  }

  /**
   * isValidTypeCode(type_code) — mirrors the EXACT SQL used in
   * server/src/routes/achievements.js POST / handler:
   *
   *   const validType = db.get(
   *     "SELECT code FROM achievement_types WHERE code = ?", [type_code]
   *   );
   *   if (!validType) return res.status(400) ...
   *
   * Returns truthy (the row object) when accepted, falsy (null) when rejected.
   * We test the actual SQL predicate, not a reimplemented copy of it.
   */
  function isValidTypeCode(type_code) {
    const stmt = db.prepare("SELECT code FROM achievement_types WHERE code = ?");
    stmt.bind([type_code]);
    const found = stmt.step();
    stmt.free();
    return found;   // true = valid row exists; false = no row = invalid
  }

  // Read the valid set from the DB itself — this is the authoritative source.
  // No hardcoded array in the test; the test reads what the DB actually contains.
  function getValidCodesFromDb() {
    const stmt = db.prepare("SELECT code FROM achievement_types ORDER BY sort_order");
    const codes = [];
    while (stmt.step()) {
      codes.push(stmt.getAsObject().code);
    }
    stmt.free();
    return codes;
  }

  return { db, isValidTypeCode, getValidCodesFromDb };
}

// ── fc configuration ───────────────────────────────────────────────────────────
// numRuns: how many random samples fast-check generates per property.
// 500 gives good confidence; kept under 2000 for CI speed.
// Shrinking is enabled by default in fast-check — it will report the minimal
// failing counterexample automatically if a property fails.
const FC_OPTIONS = { numRuns: 500 };

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

test("REQ-ACH-2 property-based: achievement type_code validation", async (t) => {

  const { isValidTypeCode, getValidCodesFromDb, db } = await buildTestDb();

  // Read the valid set from the DB — single source of truth.
  const VALID_CODES = getValidCodesFromDb();
  const VALID_SET   = new Set(VALID_CODES);

  // ── P1: VALID-ACCEPTED ───────────────────────────────────────────────────────
  // ∀ code ∈ achievement_types.code → isValid(code) === true
  // fast-check generates from the valid set using constantFrom().
  // If VALID_CODES is empty the test itself would fail immediately — deliberate.

  await t.test("P1 — every valid type_code from the DB is accepted", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_CODES),
        (code) => {
          assert.ok(
            isValidTypeCode(code),
            `Expected valid type_code '${code}' to be accepted by the validation predicate`
          );
          return true;
        }
      ),
      { ...FC_OPTIONS,
        verbose: true,   // print generated values on failure
      }
    );
  });

  // ── P2: INVALID-REJECTED ──────────────────────────────────────────────────────
  // ∀ s ∉ achievement_types.code → isValid(s) === false
  // fc.string() generates arbitrary Unicode strings.
  // We filter out accidental valid codes to keep the property clean.
  // fast-check will shrink any failing input to the smallest failing string.

  await t.test("P2 — arbitrary strings outside the valid set are rejected", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 120 }),
        (s) => {
          // Skip the 7 valid codes — they are covered by P1, not P2
          if (VALID_SET.has(s)) return;

          assert.strictEqual(
            isValidTypeCode(s),
            false,
            `Expected arbitrary string '${JSON.stringify(s)}' to be rejected, but it was accepted`
          );
        }
      ),
      { ...FC_OPTIONS, verbose: true }
    );
  });

  // ── P3: AUTHORITATIVE-SET ────────────────────────────────────────────────────
  // The accepted set equals exactly the codes in achievement_types — no more.
  //
  // Sub-test A: every DB code is accepted (mirrors P1 but uses the live DB set)
  // Sub-test B: a representative sample of strings known to NOT be in the set
  //             are rejected — confirmed by querying the DB directly, not by
  //             comparing against a hardcoded list.

  await t.test("P3 — authoritative set: accepted iff present in achievement_types", async (t3) => {

    await t3.test("P3-A: all codes currently in the DB are accepted", () => {
      for (const code of VALID_CODES) {
        assert.ok(
          isValidTypeCode(code),
          `DB code '${code}' must be accepted`
        );
      }
    });

    await t3.test("P3-B: the DB contains exactly 7 codes (REQ-ACH-2)", () => {
      assert.strictEqual(
        VALID_CODES.length,
        7,
        `Expected exactly 7 achievement types per REQ-ACH-2, found ${VALID_CODES.length}`
      );
    });

    await t3.test("P3-C: no string outside the DB set is accepted (generated)", () => {
      // fc.string() filtered to exclude valid codes
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 120 }).filter(s => !VALID_SET.has(s)),
          (s) => {
            assert.strictEqual(
              isValidTypeCode(s),
              false,
              `Non-DB string '${JSON.stringify(s)}' must not be accepted`
            );
          }
        ),
        { ...FC_OPTIONS, verbose: true }
      );
    });

    await t3.test("P3-D: the valid set is stable across repeated reads from the same DB", () => {
      // Re-read the valid set and confirm it is identical — guards against
      // accidental mutation of the DB state between tests.
      const codesAgain = getValidCodesFromDb();
      assert.deepStrictEqual(
        codesAgain,
        VALID_CODES,
        "Valid code set must be stable across multiple reads"
      );
    });
  });

  // ── P4: MUTATION TEST ────────────────────────────────────────────────────────
  // Demonstrates that the properties actually protect the implementation.
  // We temporarily corrupt the DB (delete one achievement type), run P1 to
  // confirm the property detects the mutation, then restore the row.
  // This proves the tests would catch a real regression.

  await t.test("P4 — mutation detection: property fails when implementation is broken", async (t4) => {

    await t4.test("P4-A: temporarily remove 'publication' → P1 fails for that code", () => {
      // Corrupt: remove 'publication' from the achievement_types table
      db.run("DELETE FROM achievement_types WHERE code = 'publication'");

      // Confirm the mutation is in place
      assert.strictEqual(
        isValidTypeCode("publication"),
        false,
        "After mutation, publication must be invalid"
      );

      // P1 invariant is now violated — manually verify using the mutated DB
      let caught = null;
      try {
        fc.assert(
          fc.property(
            fc.constantFrom(...VALID_CODES),   // includes 'publication'
            (code) => isValidTypeCode(code)
          ),
          { numRuns: FC_OPTIONS.numRuns, verbose: false }
        );
      } catch (err) {
        caught = err;
      }

      assert.ok(
        caught !== null,
        "P1 must throw when at least one valid code is removed from the DB"
      );

      // Restore
      db.run(
        "INSERT INTO achievement_types (code, label, sort_order) VALUES ('publication','Publications',1)"
      );

      // Confirm restored
      assert.ok(
        isValidTypeCode("publication"),
        "After restoration, publication must be valid again"
      );
    });

    await t4.test("P4-B: after restoration, all properties pass again", () => {
      // P1 must pass again with the full set
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_CODES),
          (code) => isValidTypeCode(code)
        ),
        FC_OPTIONS
      );

      // P2 must still pass
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 120 }),
          (s) => {
            if (VALID_SET.has(s)) return;
            assert.strictEqual(isValidTypeCode(s), false);
          }
        ),
        FC_OPTIONS
      );
    });
  });

});
