const express = require("express");
const bcrypt  = require("bcryptjs");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// All admin routes require admin or hod role
router.use(authenticate, requireRole("admin", "hod"));

// ─── Users Management ───────────────────────────────────────────────────────

// GET /api/admin/users — list all faculty
router.get("/users", (req, res) => {
  const { department, role } = req.query;
  let where = [];
  let params = [];

  if (department) { where.push("department = ?"); params.push(department); }
  if (role)       { where.push("role = ?");       params.push(role);       }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const users = db.all(
    `SELECT id, name, email, role, department, designation, created_at
     FROM users ${whereClause} ORDER BY name`,
    params
  );
  res.json({ users });
});

// POST /api/admin/users — create admin/hod accounts
router.post("/users", requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role, department, designation } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "name, email, password and role are required" });

    const existing = db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const id = db.insert(
      "INSERT INTO users (name, email, password, role, department, designation) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, role, department || null, designation || null]
    );

    const user = db.get("SELECT id, name, email, role, department, designation FROM users WHERE id = ?", [id]);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireRole("admin"), (req, res) => {
  const user = db.get("SELECT id, role FROM users WHERE id = ?", [req.params.id]);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  db.run("DELETE FROM users WHERE id = ?", [user.id]);
  res.json({ success: true });
});

// ─── Achievement Verification ────────────────────────────────────────────────

// GET /api/admin/achievements — all achievements (admin review queue)
router.get("/achievements", (req, res) => {
  const { status, type_code, user_id } = req.query;
  let where = [];
  let params = [];

  if (status)    { where.push("a.status = ?");    params.push(status);         }
  if (type_code) { where.push("a.type_code = ?"); params.push(type_code);      }
  if (user_id)   { where.push("a.user_id = ?");   params.push(Number(user_id));}

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const achievements = db.all(
    `SELECT a.*, u.name as faculty_name, u.department, u.designation,
            r.name as reviewer_name, t.label as type_label
     FROM achievements a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN users r ON a.reviewed_by = r.id
     LEFT JOIN achievement_types t ON a.type_code = t.code
     ${whereClause}
     ORDER BY a.created_at DESC`,
    params
  );

  // Attach files
  const enriched = achievements.map((ach) => {
    const files = db.all(
      "SELECT id, filename, original_name, mime_type, size_bytes FROM achievement_files WHERE achievement_id = ?",
      [ach.id]
    );
    return { ...ach, files };
  });

  res.json({ achievements: enriched });
});

// POST /api/admin/achievements/:id/review — approve or reject
router.post("/achievements/:id/review", (req, res) => {
  const { status, review_note } = req.body;

  if (!["approved", "rejected"].includes(status))
    return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });

  const ach = db.get("SELECT * FROM achievements WHERE id = ?", [req.params.id]);
  if (!ach) return res.status(404).json({ error: "Achievement not found" });

  db.run(
    `UPDATE achievements SET status=?, reviewed_by=?, review_note=?, reviewed_at=datetime('now')
     WHERE id=?`,
    [status, req.user.id, review_note || null, ach.id]
  );

  const updated = db.get(
    `SELECT a.*, u.name as faculty_name, r.name as reviewer_name
     FROM achievements a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN users r ON a.reviewed_by = r.id
     WHERE a.id = ?`,
    [ach.id]
  );
  res.json({ achievement: updated });
});

// ─── Department Overview ─────────────────────────────────────────────────────

// GET /api/admin/overview — summary stats per faculty
router.get("/overview", (_req, res) => {
  const faculty = db.all(
    "SELECT id, name, email, department, designation FROM users WHERE role = 'faculty' ORDER BY name"
  );

  const overview = faculty.map((f) => {
    const counts = db.all(
      `SELECT type_code, status, COUNT(*) as cnt
       FROM achievements WHERE user_id = ?
       GROUP BY type_code, status`,
      [f.id]
    );

    const byType = {};
    for (const row of counts) {
      if (!byType[row.type_code]) byType[row.type_code] = { pending: 0, approved: 0, rejected: 0 };
      byType[row.type_code][row.status] = row.cnt;
    }

    const totalApproved = counts
      .filter(r => r.status === "approved")
      .reduce((s, r) => s + r.cnt, 0);

    return { ...f, byType, totalApproved };
  });

  res.json({ overview });
});

// GET /api/admin/departments — list unique departments
router.get("/departments", (_req, res) => {
  const rows = db.all("SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department");
  res.json({ departments: rows.map(r => r.department) });
});

module.exports = router;
