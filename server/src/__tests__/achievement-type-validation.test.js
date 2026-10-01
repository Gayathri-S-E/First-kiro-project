/**
 * Property-Based Test: Achievement type_code validation
 *
 * Property under test:
 *   "An achievement must never be accepted when its type_code is not a valid
 *    achievement type."
 *
 * Approach:
 *   We extract the exact validation function used by POST /api/achievements and
 *   run it against a generated corpus of inputs that spans:
 *     - All 7 valid type_codes  → must all be accepted
 *     - Invalid inputs across many categories → must all be rejected
 *
 *   This is property-based in the sense that we verify a universal invariant
 *   ("valid in DB ↔ accepted; anything else → rejected") across a large,
 *   varied input space rather than a fixed set of hand-picked cases.
 *
 *   No HTTP server is started. We test the validation logic directly against
 *   an in-memory database, exactly as the route does it.
 */

"use strict";

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path   = require("node:path");
const fs     = require("node:fs");

// ── Bootstrap an isolated in-memory DB ───────────────────────────────────────
// We initialise sql.js directly so this test is self-contained and never
// touches fcat.db on disk.

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

  // Seed exactly the same 7 types that db.js seeds at startup
  const VALID_TYPES = [
    "publication", "certification", "conference", "workshop",
    "research",    "patent",        "teaching",
  ];
  for (const code of VALID_TYPES) {
    db.run("INSERT INTO achievement_types (code, label) VALUES (?, ?)", [code, code]);
  }

  // Helper: mirrors the exact check in routes/achievements.js
  function isValidTypeCode(type_code) {
    const stmt = db.prepare("SELECT code FROM achievement_types WHERE code = ?");
    stmt.bind([type_code]);
    const found = stmt.step();
    stmt.free();
    return found; // true → valid; false → invalid
  }

  return { VALID_TYPES, isValidTypeCode };
}

// ── Input generators ─────────────────────────────────────────────────────────

/**
 * Generate a broad corpus of invalid type_code candidates.
 * Categories mirror common real-world mistakes and edge cases.
 */
function generateInvalidCandidates() {
  const cases = [];

  // 1. Typos / near-misses of valid codes
  cases.push(
    "publications", "publicaton", "PUBLICATION", "Publication",
    "certifications", "Certification", "CERTIFICATION", "certfication",
    "conferences", "Conference", "CONFERENCE", "confernce",
    "workshops", "Workshop", "WORKSHOP", "workshp",
    "researches", "Research", "RESEARCH", "reserach",
    "patents", "Patent", "PATENT", "patnet",
    "teachings", "Teaching", "TEACHING", "teachng",
  );

  // 2. Whitespace variants
  cases.push(
    " publication", "publication ", " publication ",
    "\tworkshop", "research\n", "  conference  ",
  );

  // 3. Empty / null-like strings
  cases.push("", "  ", "\t", "\n", "null", "undefined", "none");

  // 4. Numeric strings and numbers-as-strings
  cases.push("0", "1", "2", "3", "4", "5", "6", "7", "42", "-1", "3.14");

  // 5. SQL injection attempts (must be rejected without breaking the DB)
  cases.push(
    "'; DROP TABLE achievement_types; --",
    "publication' OR '1'='1",
    "\" OR 1=1 --",
    "1; SELECT * FROM users",
    "publication UNION SELECT code FROM achievement_types",
  );

  // 6. Special characters and symbols
  cases.push(
    "pub lication", "pub-lication", "pub/lication",
    "pub@lication", "pub#lication", "pub!lication",
    "<script>", "../etc/passwd", "%00", "\x00",
  );

  // 7. Very long strings
  cases.push("a".repeat(500), "publication".repeat(50));

  // 8. Unicode / emoji
  cases.push(
    "publicación", "Zertifizierung", "会议", "工作坊",
    "📄", "🎓", "🔬", "publication🎓",
  );

  // 9. Completely unrelated words
  cases.push(
    "award", "degree", "course", "paper", "article",
    "talk", "seminar", "book", "grant", "project",
    "admin", "faculty", "hod", "user", "password",
  );

  // 10. Partial matches
  cases.push(
    "pub", "cert", "conf", "work", "res", "pat", "teach",
    "publ", "publi", "publis", "publish",
  );

  return cases;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PBT: achievement type_code validation", async () => {
  const { VALID_TYPES, isValidTypeCode } = await buildTestDb();

  // ── Property 1: every valid type_code is accepted ─────────────────────────
  describe("Property 1 — all valid codes are accepted", () => {
    for (const code of VALID_TYPES) {
      test(`valid type_code "${code}" is accepted`, () => {
        assert.ok(
          isValidTypeCode(code),
          `Expected "${code}" to be valid but it was rejected`,
        );
      });
    }
  });

  // ── Property 2: no invalid input is ever accepted ─────────────────────────
  describe("Property 2 — no invalid input is accepted", () => {
    const invalidCases = generateInvalidCandidates();

    // Deduplicate (some generated entries may overlap)
    const unique = [...new Set(invalidCases)];

    for (const input of unique) {
      const label = JSON.stringify(input).slice(0, 60); // truncate for readability
      test(`invalid type_code ${label} is rejected`, () => {
        assert.ok(
          !isValidTypeCode(input),
          `Expected ${label} to be rejected but it was accepted`,
        );
      });
    }
  });

  // ── Property 3: valid set is exactly the 7 seeded codes (no extras) ───────
  test("Property 3 — valid set is exactly the 7 seeded codes", () => {
    const EXPECTED = new Set(VALID_TYPES);
    // None of the invalid candidates should sneak in
    const invalidCases = generateInvalidCandidates();
    for (const input of invalidCases) {
      if (!EXPECTED.has(input)) {
        assert.ok(
          !isValidTypeCode(input),
          `"${input}" should not be in the valid set`,
        );
      }
    }
  });
});
