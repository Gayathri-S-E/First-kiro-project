/**
 * Coordinator routes — /api/coordinator/*
 *
 * All routes require the 'coordinator' role via router-level middleware
 * (same pattern as admin.js). No existing route, response shape, or
 * business logic is modified.
 *
 * Phase 1 exposes a single dashboard-summary endpoint that derives
 * everything from existing tables:
 *
 *   GET /api/coordinator/dashboard
 *     → { faculty_count, achievement_counts, milestone_count,
 *          faculty_progress[] }
 */

"use strict";

const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// All coordinator routes require the coordinator role.
// Mirrors the router.use pattern used in admin.js.
router.use(authenticate, requireRole("coordinator"));

// ─── GET /api/coordinator/dashboard ──────────────────────────────────────────
// Returns a read-only summary derived entirely from existing tables.
// No new data is created or modified.
//
// Response shape:
// {
//   faculty_count   : number,          — total faculty users
//   achievement_counts: {              — across ALL faculty
//     total    : number,
//     approved : number,
//     pending  : number,
//     rejected : number,
//   },
//   milestone_count : number,          — total active milestone templates
//   faculty_progress: [                — one entry per faculty member
//     {
//       id, name, department, designation,
//       total_achievements : number,
//       approved           : number,
//       pending            : number,
//       rejected           : number,
//     }, …
//   ]
// }
router.get("/dashboard", (req, res) => {
  try {
    // Total faculty users
    const facultyRow = db.get(
      "SELECT COUNT(*) as cnt FROM users WHERE role = 'faculty'"
    );
    const faculty_count = facultyRow ? facultyRow.cnt : 0;

    // Aggregate achievement counts across all faculty
    const achCounts = db.all(
      `SELECT status, COUNT(*) as cnt
       FROM achievements
       GROUP BY status`
    );
    const achievement_counts = { total: 0, approved: 0, pending: 0, rejected: 0 };
    for (const row of achCounts) {
      if (row.status === "approved") achievement_counts.approved = row.cnt;
      if (row.status === "pending")  achievement_counts.pending  = row.cnt;
      if (row.status === "rejected") achievement_counts.rejected = row.cnt;
      achievement_counts.total += row.cnt;
    }

    // Total milestone templates
    const msRow = db.get(
      "SELECT COUNT(*) as cnt FROM milestone_templates"
    );
    const milestone_count = msRow ? msRow.cnt : 0;

    // Per-faculty achievement breakdown
    const facultyList = db.all(
      `SELECT id, name, department, designation
       FROM users WHERE role = 'faculty' ORDER BY name`
    );

    const faculty_progress = facultyList.map((f) => {
      const counts = db.all(
        `SELECT status, COUNT(*) as cnt
         FROM achievements WHERE user_id = ?
         GROUP BY status`,
        [f.id]
      );
      const totals = { approved: 0, pending: 0, rejected: 0 };
      for (const row of counts) {
        if (totals[row.status] !== undefined) totals[row.status] = row.cnt;
      }

      // Compute overall milestone completion percentage for this faculty member.
      // Mirrors the same COUNT logic used by GET /api/milestones/progress/:userId.
      const milestones = db.all("SELECT * FROM milestone_templates");
      let achievedCount = 0;
      for (const m of milestones) {
        let cq = "SELECT COUNT(*) as cnt FROM achievements WHERE user_id = ? AND type_code = ? AND status = 'approved'";
        const cp = [f.id, m.type_code];
        if (m.time_window_months) {
          cq += " AND date_achieved >= date('now', ? || ' months')";
          cp.push(`-${m.time_window_months}`);
        }
        const cr = db.get(cq, cp);
        if (cr && cr.cnt >= m.required_count) achievedCount++;
      }
      const milestone_pct = milestones.length > 0
        ? Math.round((achievedCount / milestones.length) * 100)
        : 0;

      return {
        id:                  f.id,
        name:                f.name,
        department:          f.department,
        designation:         f.designation,
        total_achievements:  totals.approved + totals.pending + totals.rejected,
        approved:            totals.approved,
        pending:             totals.pending,
        rejected:            totals.rejected,
        milestone_pct,       // overall milestone completion %
        milestones_achieved: achievedCount,
        milestones_total:    milestones.length,
      };
    });

    res.json({
      faculty_count,
      achievement_counts,
      milestone_count,
      faculty_progress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── helpers ───────────────────────────────────────────────────────────────────
const VALID_STATUSES = ["planned", "in_progress", "completed", "cancelled"];

function enrichPlan(plan) {
  if (!plan) return null;
  // attach faculty and creator names without exposing passwords
  const faculty = db.get(
    "SELECT id, name, email, department, designation FROM users WHERE id = ?",
    [plan.faculty_id]
  );
  const creator = db.get(
    "SELECT id, name FROM users WHERE id = ?",
    [plan.created_by]
  );
  return { ...plan, faculty, creator };
}

// ── GET /api/coordinator/faculty ──────────────────────────────────────────────
// Returns the list of faculty members the coordinator can assign plans to.
// No passwords or tokens are included.
router.get("/faculty", (req, res) => {
  try {
    const { department } = req.query;
    let sql    = "SELECT id, name, email, department, designation FROM users WHERE role = 'faculty'";
    const params = [];
    if (department) { sql += " AND department = ?"; params.push(department); }
    sql += " ORDER BY name";
    const faculty = db.all(sql, params);
    res.json({ faculty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/coordinator/growth-plans ────────────────────────────────────────
// List all growth plans (optionally filtered by faculty_id or status).
router.get("/growth-plans", (req, res) => {
  try {
    const { faculty_id, status } = req.query;
    const where  = [];
    const params = [];

    if (faculty_id) { where.push("g.faculty_id = ?"); params.push(Number(faculty_id)); }
    if (status)     {
      if (!VALID_STATUSES.includes(status))
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
      where.push("g.status = ?"); params.push(status);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const plans = db.all(
      `SELECT g.*,
              f.name  AS faculty_name,  f.department  AS faculty_department,
              f.designation AS faculty_designation,
              c.name  AS creator_name
       FROM growth_plans g
       JOIN users f ON g.faculty_id = f.id
       JOIN users c ON g.created_by = c.id
       ${whereClause}
       ORDER BY g.created_at DESC`,
      params
    );
    res.json({ growth_plans: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/coordinator/growth-plans/:id ────────────────────────────────────
router.get("/growth-plans/:id", (req, res) => {
  try {
    const plan = db.get(
      `SELECT g.*,
              f.name AS faculty_name, f.department AS faculty_department,
              f.designation AS faculty_designation,
              c.name AS creator_name
       FROM growth_plans g
       JOIN users f ON g.faculty_id = f.id
       JOIN users c ON g.created_by = c.id
       WHERE g.id = ?`,
      [req.params.id]
    );
    if (!plan) return res.status(404).json({ error: "Growth plan not found" });
    res.json({ growth_plan: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/coordinator/growth-plans ───────────────────────────────────────
// Create a new growth plan for a faculty member.
router.post("/growth-plans", (req, res) => {
  try {
    const { faculty_id, title, description, target_date, status = "planned", notes } = req.body;

    // Required field validation
    if (!faculty_id || !title)
      return res.status(400).json({ error: "faculty_id and title are required" });

    // Status validation
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });

    // Verify the referenced user exists and is faculty
    const faculty = db.get(
      "SELECT id, role FROM users WHERE id = ?",
      [Number(faculty_id)]
    );
    if (!faculty)
      return res.status(404).json({ error: "Faculty member not found" });
    if (faculty.role !== "faculty")
      return res.status(400).json({ error: "Plans can only be created for faculty members" });

    const id = db.insert(
      `INSERT INTO growth_plans
         (faculty_id, title, description, target_date, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(faculty_id),
        title,
        description || null,
        target_date || null,
        status,
        notes || null,
        req.user.id,
      ]
    );

    const plan = db.get(
      `SELECT g.*,
              f.name AS faculty_name, f.department AS faculty_department,
              f.designation AS faculty_designation,
              c.name AS creator_name
       FROM growth_plans g
       JOIN users f ON g.faculty_id = f.id
       JOIN users c ON g.created_by = c.id
       WHERE g.id = ?`,
      [id]
    );
    res.status(201).json({ growth_plan: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/coordinator/growth-plans/:id ────────────────────────────────────
// Update a growth plan (all fields optional — patch semantics).
router.put("/growth-plans/:id", (req, res) => {
  try {
    const existing = db.get("SELECT * FROM growth_plans WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Growth plan not found" });

    const { title, description, target_date, status, notes } = req.body;

    // Validate status if provided
    if (status !== undefined && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });

    db.run(
      `UPDATE growth_plans
       SET title       = ?,
           description = ?,
           target_date = ?,
           status      = ?,
           notes       = ?,
           updated_at  = datetime('now')
       WHERE id = ?`,
      [
        title       !== undefined ? title       : existing.title,
        description !== undefined ? description : existing.description,
        target_date !== undefined ? target_date : existing.target_date,
        status      !== undefined ? status      : existing.status,
        notes       !== undefined ? notes       : existing.notes,
        existing.id,
      ]
    );

    const updated = db.get(
      `SELECT g.*,
              f.name AS faculty_name, f.department AS faculty_department,
              f.designation AS faculty_designation,
              c.name AS creator_name
       FROM growth_plans g
       JOIN users f ON g.faculty_id = f.id
       JOIN users c ON g.created_by = c.id
       WHERE g.id = ?`,
      [existing.id]
    );
    res.json({ growth_plan: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/coordinator/growth-plans/:id ─────────────────────────────────
router.delete("/growth-plans/:id", (req, res) => {
  try {
    const existing = db.get("SELECT id FROM growth_plans WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Growth plan not found" });
    db.run("DELETE FROM growth_plans WHERE id = ?", [existing.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/coordinator/faculty/:userId ─────────────────────────────────────
// Read-only faculty career detail for coordinator review.
// Returns: profile, achievement summary, achievements by type, milestone
// progress, and any growth plans for this faculty member.
// Auth: coordinator only (inherited from router.use above).
// Faculty data isolation: only faculty role users are served; returns 404 for
// non-faculty IDs so coordinators cannot probe admin/hod accounts.
router.get("/faculty/:userId", (req, res) => {
  try {
    const targetId = Number(req.params.userId);
    if (!targetId) return res.status(400).json({ error: "Invalid userId" });

    // Only expose data for actual faculty accounts
    const user = db.get(
      `SELECT id, name, email, department, designation, created_at
       FROM users WHERE id = ? AND role = 'faculty'`,
      [targetId]
    );
    if (!user) return res.status(404).json({ error: "Faculty member not found" });

    // Achievements — all statuses, ordered most recent first
    const achievements = db.all(
      `SELECT a.id, a.type_code, a.title, a.description, a.date_achieved,
              a.issuer, a.url, a.status, a.review_note, a.reviewed_at,
              t.label as type_label
       FROM achievements a
       LEFT JOIN achievement_types t ON a.type_code = t.code
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [targetId]
    );

    // Achievement counts by status
    const statusCounts = { total: achievements.length, approved: 0, pending: 0, rejected: 0 };
    const byType = {};
    for (const a of achievements) {
      if (statusCounts[a.status] !== undefined) statusCounts[a.status]++;
      if (!byType[a.type_code]) byType[a.type_code] = { label: a.type_label || a.type_code, items: [] };
      byType[a.type_code].items.push(a);
    }

    // Milestone progress — same logic as GET /api/milestones/progress/:userId
    const milestones = db.all("SELECT * FROM milestone_templates ORDER BY type_code, name");
    const milestoneProgress = milestones.map((m) => {
      let cq = "SELECT COUNT(*) as cnt FROM achievements WHERE user_id = ? AND type_code = ? AND status = 'approved'";
      const cp = [targetId, m.type_code];
      if (m.time_window_months) {
        cq += " AND date_achieved >= date('now', ? || ' months')";
        cp.push(`-${m.time_window_months}`);
      }
      const cr    = db.get(cq, cp);
      const current  = cr ? cr.cnt : 0;
      const achieved = current >= m.required_count;
      return {
        milestone_id:        m.id,
        milestone_name:      m.name,
        description:         m.description,
        type_code:           m.type_code,
        required_count:      m.required_count,
        time_window_months:  m.time_window_months,
        current_count:       current,
        percentage:          Math.min(100, Math.round((current / m.required_count) * 100)),
        achieved,
      };
    });

    const achievedCount = milestoneProgress.filter(m => m.achieved).length;
    const overallPct    = milestones.length > 0
      ? Math.round((achievedCount / milestones.length) * 100)
      : 0;

    // Growth plans for this faculty member
    const growthPlans = db.all(
      `SELECT g.id, g.title, g.description, g.target_date, g.status,
              g.notes, g.created_at, g.updated_at,
              c.name AS creator_name
       FROM growth_plans g
       JOIN users c ON g.created_by = c.id
       WHERE g.faculty_id = ?
       ORDER BY g.created_at DESC`,
      [targetId]
    );

    res.json({
      user,
      statusCounts,
      achievements,
      byType,
      milestoneProgress,
      milestonesSummary: {
        total:    milestones.length,
        achieved: achievedCount,
        overall_pct: overallPct,
      },
      growthPlans,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
