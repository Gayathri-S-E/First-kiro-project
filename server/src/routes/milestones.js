const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/milestones — list all milestone templates
router.get("/", authenticate, (_req, res) => {
  const milestones = db.all(
    `SELECT m.*, u.name as created_by_name, t.label as type_label
     FROM milestone_templates m
     LEFT JOIN users u ON m.created_by = u.id
     LEFT JOIN achievement_types t ON m.type_code = t.code
     ORDER BY m.type_code, m.name`
  );
  res.json({ milestones });
});

// GET /api/milestones/progress/:userId — compute milestone progress for a faculty member
// MUST be declared before /:id to prevent Express matching "progress" as an id.
router.get("/progress/:userId", authenticate, (req, res) => {
  const targetId = Number(req.params.userId);

  // Faculty can only see their own progress
  if (req.user.role === "faculty" && req.user.id !== targetId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const user = db.get("SELECT id, name, department, designation FROM users WHERE id = ?", [targetId]);
  if (!user) return res.status(404).json({ error: "User not found" });

  const milestones = db.all("SELECT * FROM milestone_templates ORDER BY type_code, name");

  const progress = milestones.map((m) => {
    let countQuery =
      "SELECT COUNT(*) as cnt FROM achievements WHERE user_id = ? AND type_code = ? AND status = 'approved'";
    const params = [targetId, m.type_code];

    // If a time window is set, restrict to that window
    if (m.time_window_months) {
      countQuery += " AND date_achieved >= date('now', ? || ' months')";
      params.push(`-${m.time_window_months}`);
    }

    const row     = db.get(countQuery, params);
    const current = row ? row.cnt : 0;
    const achieved = current >= m.required_count;

    return {
      milestone_id:    m.id,
      milestone_name:  m.name,
      description:     m.description,
      type_code:       m.type_code,
      required_count:  m.required_count,
      time_window_months: m.time_window_months,
      current_count:   current,
      percentage:      Math.min(100, Math.round((current / m.required_count) * 100)),
      achieved,
    };
  });

  res.json({ user, progress });
});

// GET /api/milestones/:id
router.get("/:id", authenticate, (req, res) => {
  const m = db.get(
    `SELECT m.*, t.label as type_label FROM milestone_templates m
     LEFT JOIN achievement_types t ON m.type_code = t.code
     WHERE m.id = ?`,
    [req.params.id]
  );
  if (!m) return res.status(404).json({ error: "Milestone not found" });
  res.json({ milestone: m });
});

// POST /api/milestones — admin/hod creates a milestone template
router.post("/", authenticate, requireRole("admin", "hod"), (req, res) => {
  const { name, description, type_code, required_count, time_window_months } = req.body;

  if (!name || !type_code || !required_count)
    return res.status(400).json({ error: "name, type_code and required_count are required" });

  const validType = db.get("SELECT code FROM achievement_types WHERE code = ?", [type_code]);
  if (!validType) return res.status(400).json({ error: "Invalid type_code" });

  const id = db.insert(
    `INSERT INTO milestone_templates (name, description, type_code, required_count, time_window_months, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description || null, type_code, Number(required_count),
     time_window_months ? Number(time_window_months) : null, req.user.id]
  );

  const milestone = db.get("SELECT * FROM milestone_templates WHERE id = ?", [id]);
  res.status(201).json({ milestone });
});

// PUT /api/milestones/:id — admin/hod updates a milestone template
router.put("/:id", authenticate, requireRole("admin", "hod"), (req, res) => {
  const m = db.get("SELECT * FROM milestone_templates WHERE id = ?", [req.params.id]);
  if (!m) return res.status(404).json({ error: "Milestone not found" });

  const { name, description, type_code, required_count, time_window_months } = req.body;

  if (type_code) {
    const validType = db.get("SELECT code FROM achievement_types WHERE code = ?", [type_code]);
    if (!validType) return res.status(400).json({ error: "Invalid type_code" });
  }

  db.run(
    `UPDATE milestone_templates SET name=?, description=?, type_code=?, required_count=?, time_window_months=?
     WHERE id=?`,
    [
      name              || m.name,
      description       !== undefined ? description       : m.description,
      type_code         || m.type_code,
      required_count    !== undefined ? Number(required_count) : m.required_count,
      time_window_months!== undefined ? (time_window_months ? Number(time_window_months) : null) : m.time_window_months,
      m.id,
    ]
  );

  const updated = db.get("SELECT * FROM milestone_templates WHERE id = ?", [m.id]);
  res.json({ milestone: updated });
});

// DELETE /api/milestones/:id — admin/hod
router.delete("/:id", authenticate, requireRole("admin", "hod"), (req, res) => {
  const m = db.get("SELECT id FROM milestone_templates WHERE id = ?", [req.params.id]);
  if (!m) return res.status(404).json({ error: "Milestone not found" });
  db.run("DELETE FROM milestone_templates WHERE id = ?", [m.id]);
  res.json({ success: true });
});

module.exports = router;
