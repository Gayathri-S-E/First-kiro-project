const express = require("express");
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/reports/faculty/:userId
 * Returns structured data for a faculty career report.
 * Faculty can view their own; admin/hod can view anyone's.
 */
router.get("/faculty/:userId", authenticate, (req, res) => {
  const targetId = Number(req.params.userId);

  if (req.user.role === "faculty" && req.user.id !== targetId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const user = db.get(
    "SELECT id, name, email, department, designation, created_at FROM users WHERE id = ?",
    [targetId]
  );
  if (!user) return res.status(404).json({ error: "User not found" });

  // All approved achievements grouped by type
  const types = db.all("SELECT * FROM achievement_types ORDER BY sort_order");

  const achievementsByType = {};
  for (const t of types) {
    const items = db.all(
      `SELECT id, title, description, date_achieved, issuer, url, created_at
       FROM achievements
       WHERE user_id = ? AND type_code = ? AND status = 'approved'
       ORDER BY date_achieved DESC, created_at DESC`,
      [targetId, t.code]
    );
    achievementsByType[t.code] = { label: t.label, items };
  }

  // Summary counts
  const summary = db.all(
    `SELECT type_code, status, COUNT(*) as count
     FROM achievements WHERE user_id = ?
     GROUP BY type_code, status`,
    [targetId]
  );

  // Milestone progress
  const milestones = db.all("SELECT * FROM milestone_templates ORDER BY type_code, name");
  const milestoneProgress = milestones.map((m) => {
    let countQuery =
      "SELECT COUNT(*) as cnt FROM achievements WHERE user_id = ? AND type_code = ? AND status = 'approved'";
    const params = [targetId, m.type_code];
    if (m.time_window_months) {
      countQuery += " AND date_achieved >= date('now', ? || ' months')";
      params.push(`-${m.time_window_months}`);
    }
    const row     = db.get(countQuery, params);
    const current = row ? row.cnt : 0;
    return {
      name:            m.name,
      type_code:       m.type_code,
      required_count:  m.required_count,
      current_count:   current,
      achieved:        current >= m.required_count,
      percentage:      Math.min(100, Math.round((current / m.required_count) * 100)),
    };
  });

  res.json({
    user,
    achievementsByType,
    summary,
    milestoneProgress,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/reports/dashboard/:userId
 * Lightweight dashboard stats (recent activity + counts).
 */
router.get("/dashboard/:userId", authenticate, (req, res) => {
  const targetId = Number(req.params.userId);

  if (req.user.role === "faculty" && req.user.id !== targetId) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Count by status
  const statusCounts = db.all(
    "SELECT status, COUNT(*) as count FROM achievements WHERE user_id = ? GROUP BY status",
    [targetId]
  );

  // Count by type (approved only)
  const typeCounts = db.all(
    `SELECT a.type_code, t.label, COUNT(*) as count
     FROM achievements a
     JOIN achievement_types t ON a.type_code = t.code
     WHERE a.user_id = ? AND a.status = 'approved'
     GROUP BY a.type_code
     ORDER BY t.sort_order`,
    [targetId]
  );

  // Recent achievements (last 5)
  const recent = db.all(
    `SELECT a.id, a.title, a.type_code, a.status, a.date_achieved, a.created_at, t.label as type_label
     FROM achievements a
     JOIN achievement_types t ON a.type_code = t.code
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC LIMIT 5`,
    [targetId]
  );

  // Activity by month (last 12 months, approved)
  const monthly = db.all(
    `SELECT strftime('%Y-%m', COALESCE(date_achieved, created_at)) as month, COUNT(*) as count
     FROM achievements
     WHERE user_id = ? AND status = 'approved'
       AND COALESCE(date_achieved, created_at) >= date('now', '-12 months')
     GROUP BY month ORDER BY month`,
    [targetId]
  );

  res.json({ statusCounts, typeCounts, recent, monthly });
});

module.exports = router;
