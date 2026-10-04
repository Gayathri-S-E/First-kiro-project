/**
 * Database module — uses sql.js (pure-JS SQLite, no native build needed).
 * The DB is persisted to disk as a binary file (DB_PATH from .env).
 */
const path = require("path");
const fs   = require("fs");
require("dotenv").config();

const DB_PATH = path.resolve(process.env.DB_PATH || "./fcat.db");

let db;      // sql.js Database instance
let sqlJs;   // initSqlJs function

/**
 * Persist the in-memory SQLite database to disk.
 * Called after every write operation.
 */
function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * Thin wrapper: run a statement and persist.
 */
function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

/**
 * Execute a query and return all rows as plain objects.
 */
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Execute a query and return the first row, or null.
 */
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a statement and return lastInsertRowid.
 */
function insert(sql, params = []) {
  db.run(sql, params);
  const result = get("SELECT last_insert_rowid() as id");
  persist();
  return result ? result.id : null;
}

/**
 * Initialize the database — load from disk if exists, else create fresh.
 * Returns a promise that resolves when the DB is ready.
 */
async function initDb() {
  if (!sqlJs) {
    sqlJs = (await import("sql.js")).default;
  }
  const SQL = await sqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-like behaviour (sql.js is in-memory so PRAGMA is cosmetic, but good practice)
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA foreign_keys = ON;");

  createSchema();
  persist();
  return db;
}

function createSchema() {
  // Users — faculty, admin, HOD, and coordinator
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'faculty' CHECK(role IN ('faculty','admin','hod','coordinator')),
      department  TEXT,
      designation TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Migration: widen role CHECK to include 'coordinator' on existing DBs ──
  // CREATE TABLE IF NOT EXISTS does not alter an existing table's CHECK
  // constraint. We inspect sqlite_master and, if the stored DDL does not yet
  // contain 'coordinator', rebuild the table with the new constraint while
  // preserving every existing row.
  //
  // Safety measures:
  //   • PRAGMA foreign_keys = OFF during the swap (SQLite requirement).
  //   • All existing rows are copied verbatim via INSERT INTO ... SELECT *.
  //   • The guard runs exactly once: subsequent startups find 'coordinator'
  //     in the DDL and skip the block entirely.
  const usersDdl = get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
  );
  if (usersDdl && !usersDdl.sql.includes("coordinator")) {
    db.run("PRAGMA foreign_keys = OFF");
    db.run(`
      CREATE TABLE users_new (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        email       TEXT    NOT NULL UNIQUE,
        password    TEXT    NOT NULL,
        role        TEXT    NOT NULL DEFAULT 'faculty'
                    CHECK(role IN ('faculty','admin','hod','coordinator')),
        department  TEXT,
        designation TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.run("INSERT INTO users_new SELECT * FROM users");
    db.run("DROP TABLE users");
    db.run("ALTER TABLE users_new RENAME TO users");
    db.run("PRAGMA foreign_keys = ON");
  }

  // Achievement categories (configurable labels, not hardcoded logic)
  db.run(`
    CREATE TABLE IF NOT EXISTS achievement_types (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT    NOT NULL UNIQUE,
      label       TEXT    NOT NULL,
      description TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Achievements submitted by faculty
  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      type_code     TEXT    NOT NULL,
      title         TEXT    NOT NULL,
      description   TEXT,
      date_achieved TEXT,
      issuer        TEXT,
      url           TEXT,
      status        TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reviewed_by   INTEGER REFERENCES users(id),
      review_note   TEXT,
      reviewed_at   TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Proof files attached to achievements
  db.run(`
    CREATE TABLE IF NOT EXISTS achievement_files (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      filename       TEXT    NOT NULL,
      original_name  TEXT    NOT NULL,
      mime_type      TEXT,
      size_bytes     INTEGER,
      uploaded_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Milestone templates — configurable by admin/HOD (not hardcoded rules)
  db.run(`
    CREATE TABLE IF NOT EXISTS milestone_templates (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      description  TEXT,
      type_code    TEXT    NOT NULL,
      required_count INTEGER NOT NULL DEFAULT 1,
      time_window_months INTEGER,
      created_by   INTEGER REFERENCES users(id),
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Growth plans — coordinator-managed development plans for faculty
  db.run(`
    CREATE TABLE IF NOT EXISTS growth_plans (
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

  // Seed default achievement types
  const existing = get("SELECT id FROM achievement_types LIMIT 1");
  if (!existing) {
    const types = [
      ["publication",   "Publications",          "Journal articles, book chapters, conference papers",  1],
      ["certification", "Certifications",         "Professional certifications and credentials",         2],
      ["conference",    "Conferences",            "Conference presentations and keynotes",               3],
      ["workshop",      "Workshops",              "Workshops attended or conducted",                     4],
      ["research",      "Research Projects",      "Funded or collaborative research projects",           5],
      ["patent",        "Patents",                "Patents filed or granted",                            6],
      ["teaching",      "Academic/Teaching",      "Course development, innovations, awards",             7],
    ];
    for (const [code, label, description, sort_order] of types) {
      db.run(
        "INSERT INTO achievement_types (code, label, description, sort_order) VALUES (?, ?, ?, ?)",
        [code, label, description, sort_order]
      );
    }
  }
}

module.exports = { initDb, run, all, get, insert, persist };
