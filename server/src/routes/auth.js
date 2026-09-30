const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET || "fcat_secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, department, designation, role = "faculty" } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email and password are required" });

    // Only allow admin to create admin/hod accounts
    if (["admin", "hod"].includes(role)) {
      return res.status(403).json({ error: "Use admin panel to create admin/HOD accounts" });
    }

    const existing = db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const id = db.insert(
      "INSERT INTO users (name, email, password, role, department, designation) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, "faculty", department || null, designation || null]
    );

    const user = db.get("SELECT id, name, email, role, department, designation FROM users WHERE id = ?", [id]);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const user = db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — return current user from token
router.get("/me", authenticate, (req, res) => {
  const user = db.get(
    "SELECT id, name, email, role, department, designation, created_at FROM users WHERE id = ?",
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// PUT /api/auth/profile — update own profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { name, department, designation, password } = req.body;
    const user = db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newName        = name        || user.name;
    const newDept        = department  !== undefined ? department  : user.department;
    const newDesig       = designation !== undefined ? designation : user.designation;
    const newPassword    = password ? await bcrypt.hash(password, 10) : user.password;

    db.run(
      "UPDATE users SET name=?, department=?, designation=?, password=? WHERE id=?",
      [newName, newDept, newDesig, newPassword, req.user.id]
    );

    const updated = db.get(
      "SELECT id, name, email, role, department, designation, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
