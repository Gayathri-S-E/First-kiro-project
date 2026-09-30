const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// Configure multer for proof file uploads
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || "./uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, images, and Word documents are allowed"));
  },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function enrichAchievement(ach) {
  if (!ach) return null;
  const files = db.all(
    "SELECT id, filename, original_name, mime_type, size_bytes, uploaded_at FROM achievement_files WHERE achievement_id = ?",
    [ach.id]
  );
  return { ...ach, files };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/achievements/types — list all achievement types
router.get("/types", authenticate, (_req, res) => {
  const types = db.all("SELECT * FROM achievement_types ORDER BY sort_order");
  res.json({ types });
});

// GET /api/achievements — faculty: own; admin/hod: all (filterable)
router.get("/", authenticate, (req, res) => {
  const { type_code, status, user_id } = req.query;
  let where = [];
  let params = [];

  // Faculty can only see their own achievements
  if (req.user.role === "faculty") {
    where.push("a.user_id = ?");
    params.push(req.user.id);
  } else if (user_id) {
    where.push("a.user_id = ?");
    params.push(Number(user_id));
  }

  if (type_code) { where.push("a.type_code = ?"); params.push(type_code); }
  if (status)    { where.push("a.status = ?");    params.push(status);    }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const achievements = db.all(
    `SELECT a.*, u.name as faculty_name, u.department, u.designation,
            r.name as reviewer_name
     FROM achievements a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN users r ON a.reviewed_by = r.id
     ${whereClause}
     ORDER BY a.created_at DESC`,
    params
  );

  res.json({ achievements: achievements.map(enrichAchievement) });
});

// GET /api/achievements/:id
router.get("/:id", authenticate, (req, res) => {
  const ach = db.get(
    `SELECT a.*, u.name as faculty_name, u.department, u.designation,
            r.name as reviewer_name
     FROM achievements a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN users r ON a.reviewed_by = r.id
     WHERE a.id = ?`,
    [req.params.id]
  );

  if (!ach) return res.status(404).json({ error: "Achievement not found" });

  // Faculty can only view their own
  if (req.user.role === "faculty" && ach.user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json({ achievement: enrichAchievement(ach) });
});

// POST /api/achievements — create new achievement with optional file upload
router.post("/", authenticate, upload.array("files", 5), (req, res) => {
  try {
    const { title, type_code, description, date_achieved, issuer, url } = req.body;

    if (!title || !type_code)
      return res.status(400).json({ error: "title and type_code are required" });

    const validType = db.get("SELECT code FROM achievement_types WHERE code = ?", [type_code]);
    if (!validType) return res.status(400).json({ error: "Invalid type_code" });

    const id = db.insert(
      `INSERT INTO achievements (user_id, type_code, title, description, date_achieved, issuer, url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, type_code, title, description || null,
       date_achieved || null, issuer || null, url || null]
    );

    // Save uploaded proof files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        db.insert(
          `INSERT INTO achievement_files (achievement_id, filename, original_name, mime_type, size_bytes)
           VALUES (?, ?, ?, ?, ?)`,
          [id, file.filename, file.originalname, file.mimetype, file.size]
        );
      }
    }

    const achievement = db.get(
      `SELECT a.*, u.name as faculty_name, u.department FROM achievements a
       JOIN users u ON a.user_id = u.id WHERE a.id = ?`,
      [id]
    );

    res.status(201).json({ achievement: enrichAchievement(achievement) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/achievements/:id — faculty edits own pending achievement
router.put("/:id", authenticate, upload.array("files", 5), (req, res) => {
  try {
    const ach = db.get("SELECT * FROM achievements WHERE id = ?", [req.params.id]);
    if (!ach) return res.status(404).json({ error: "Achievement not found" });

    if (req.user.role === "faculty") {
      if (ach.user_id !== req.user.id)
        return res.status(403).json({ error: "Access denied" });
      if (ach.status !== "pending")
        return res.status(400).json({ error: "Cannot edit an already-reviewed achievement" });
    }

    const { title, type_code, description, date_achieved, issuer, url } = req.body;
    db.run(
      `UPDATE achievements SET title=?, type_code=?, description=?, date_achieved=?,
       issuer=?, url=? WHERE id=?`,
      [
        title        || ach.title,
        type_code    || ach.type_code,
        description  !== undefined ? description  : ach.description,
        date_achieved!== undefined ? date_achieved: ach.date_achieved,
        issuer       !== undefined ? issuer       : ach.issuer,
        url          !== undefined ? url          : ach.url,
        ach.id,
      ]
    );

    // Append new files if provided
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        db.insert(
          `INSERT INTO achievement_files (achievement_id, filename, original_name, mime_type, size_bytes)
           VALUES (?, ?, ?, ?, ?)`,
          [ach.id, file.filename, file.originalname, file.mimetype, file.size]
        );
      }
    }

    const updated = db.get(
      `SELECT a.*, u.name as faculty_name, u.department FROM achievements a
       JOIN users u ON a.user_id = u.id WHERE a.id = ?`,
      [ach.id]
    );
    res.json({ achievement: enrichAchievement(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/achievements/:id — faculty deletes own pending; admin can delete any
router.delete("/:id", authenticate, (req, res) => {
  const ach = db.get("SELECT * FROM achievements WHERE id = ?", [req.params.id]);
  if (!ach) return res.status(404).json({ error: "Achievement not found" });

  if (req.user.role === "faculty") {
    if (ach.user_id !== req.user.id)
      return res.status(403).json({ error: "Access denied" });
    if (ach.status !== "pending")
      return res.status(400).json({ error: "Cannot delete a reviewed achievement" });
  }

  // Remove associated files from disk
  const files = db.all("SELECT filename FROM achievement_files WHERE achievement_id = ?", [ach.id]);
  for (const f of files) {
    const filePath = path.join(UPLOADS_DIR, f.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.run("DELETE FROM achievements WHERE id = ?", [ach.id]);
  res.json({ success: true });
});

// GET /api/achievements/files/:filename — serve uploaded proof file
router.get("/files/:filename", authenticate, (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filePath);
});

module.exports = router;
