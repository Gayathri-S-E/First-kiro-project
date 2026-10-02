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
      return {
        id:                  f.id,
        name:                f.name,
        department:          f.department,
        designation:         f.designation,
        total_achievements:  totals.approved + totals.pending + totals.rejected,
        approved:            totals.approved,
        pending:             totals.pending,
        rejected:            totals.rejected,
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

module.exports = router;
