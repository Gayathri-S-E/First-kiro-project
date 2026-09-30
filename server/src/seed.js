/**
 * Seed script — creates demo users, achievements and milestone templates.
 * Run: node src/seed.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { initDb, get, insert, run } = require("./db");

async function seed() {
  await initDb();
  console.log("Seeding database...");

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = [
    { name: "Admin User",       email: "admin@fcat.edu",    password: "admin123",    role: "admin",   department: "Administration", designation: "System Admin" },
    { name: "Dr. Head of Dept", email: "hod@fcat.edu",      password: "hod123",      role: "hod",     department: "Computer Science", designation: "HOD" },
    { name: "Dr. Priya Sharma", email: "priya@fcat.edu",    password: "faculty123",  role: "faculty", department: "Computer Science", designation: "Associate Professor" },
    { name: "Dr. Arjun Mehta",  email: "arjun@fcat.edu",    password: "faculty123",  role: "faculty", department: "Computer Science", designation: "Assistant Professor" },
    { name: "Dr. Meena Iyer",   email: "meena@fcat.edu",    password: "faculty123",  role: "faculty", department: "Mathematics",      designation: "Professor" },
  ];

  const userIds = {};
  for (const u of users) {
    let existing = get("SELECT id FROM users WHERE email = ?", [u.email]);
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      const id = insert(
        "INSERT INTO users (name, email, password, role, department, designation) VALUES (?, ?, ?, ?, ?, ?)",
        [u.name, u.email, hashed, u.role, u.department, u.designation]
      );
      userIds[u.email] = id;
      console.log(`  Created user: ${u.email} (${u.role})`);
    } else {
      userIds[u.email] = existing.id;
      console.log(`  Exists: ${u.email}`);
    }
  }

  // ── Milestone Templates ────────────────────────────────────────────────────
  const templates = [
    { name: "Junior Research Milestone",   description: "5 publications required for career progression",      type_code: "publication",   required_count: 5,  time_window_months: null },
    { name: "Senior Research Milestone",   description: "10 publications required for professorship",          type_code: "publication",   required_count: 10, time_window_months: null },
    { name: "Professional Certification",  description: "At least 2 professional certifications",              type_code: "certification", required_count: 2,  time_window_months: null },
    { name: "Conference Engagement",       description: "Present at 3 conferences per promotion cycle",        type_code: "conference",    required_count: 3,  time_window_months: 36  },
    { name: "Workshop Participation",      description: "Attend or conduct 4 workshops",                       type_code: "workshop",      required_count: 4,  time_window_months: null },
    { name: "Research Leadership",         description: "Lead or co-lead 2 research projects",                 type_code: "research",      required_count: 2,  time_window_months: null },
    { name: "Innovation & IP",             description: "File at least 1 patent",                              type_code: "patent",        required_count: 1,  time_window_months: null },
    { name: "Teaching Excellence",         description: "5 teaching/academic activities for senior grade",     type_code: "teaching",      required_count: 5,  time_window_months: null },
  ];

  const adminId = userIds["admin@fcat.edu"];
  for (const t of templates) {
    const existing = get("SELECT id FROM milestone_templates WHERE name = ?", [t.name]);
    if (!existing) {
      insert(
        `INSERT INTO milestone_templates (name, description, type_code, required_count, time_window_months, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [t.name, t.description, t.type_code, t.required_count, t.time_window_months, adminId]
      );
      console.log(`  Created milestone: ${t.name}`);
    }
  }

  // ── Sample Achievements ───────────────────────────────────────────────────
  const priyaId = userIds["priya@fcat.edu"];
  const arjunId = userIds["arjun@fcat.edu"];

  const sampleAchievements = [
    // Priya - approved publications
    { user_id: priyaId, type_code: "publication",   title: "Deep Learning for Medical Image Segmentation",     date_achieved: "2024-03-15", issuer: "IEEE Transactions", status: "approved" },
    { user_id: priyaId, type_code: "publication",   title: "Federated Learning in Healthcare Systems",          date_achieved: "2024-07-20", issuer: "Springer",          status: "approved" },
    { user_id: priyaId, type_code: "publication",   title: "Edge Computing Architectures for IoT",              date_achieved: "2025-01-10", issuer: "Elsevier",          status: "approved" },
    { user_id: priyaId, type_code: "certification", title: "AWS Solutions Architect Professional",             date_achieved: "2024-06-01", issuer: "Amazon Web Services", status: "approved" },
    { user_id: priyaId, type_code: "conference",    title: "NeurIPS 2024 — Poster Presentation",               date_achieved: "2024-12-10", issuer: "NeurIPS",           status: "approved" },
    { user_id: priyaId, type_code: "conference",    title: "ICML 2025 — Workshop Presenter",                   date_achieved: "2025-07-18", issuer: "ICML",              status: "approved" },
    { user_id: priyaId, type_code: "research",      title: "AI-Assisted Diagnostics — DST Funded Project",     date_achieved: "2024-04-01", issuer: "DST India",         status: "approved" },
    { user_id: priyaId, type_code: "teaching",      title: "Developed ML Elective Curriculum",                 date_achieved: "2024-08-01", issuer: "Institution",       status: "approved" },
    { user_id: priyaId, type_code: "publication",   title: "Quantum-Inspired Algorithms for Optimization",     date_achieved: "2025-03-05", issuer: "ACM",               status: "pending"  },
    // Arjun - mixed statuses
    { user_id: arjunId, type_code: "publication",   title: "Blockchain for Supply Chain Transparency",          date_achieved: "2024-05-22", issuer: "IEEE",              status: "approved" },
    { user_id: arjunId, type_code: "workshop",      title: "Conducted Python Data Science Workshop",            date_achieved: "2024-09-14", issuer: "Institution",       status: "approved" },
    { user_id: arjunId, type_code: "workshop",      title: "Attended DevOps Best Practices Bootcamp",           date_achieved: "2025-02-10", issuer: "NASSCOM",           status: "approved" },
    { user_id: arjunId, type_code: "certification", title: "Google Professional Data Engineer",                date_achieved: "2025-01-15", issuer: "Google",            status: "approved" },
    { user_id: arjunId, type_code: "patent",        title: "Smart Energy Monitoring System",                   date_achieved: "2025-04-01", issuer: "Patent Office",     status: "pending"  },
    { user_id: arjunId, type_code: "conference",    title: "ICDCS 2025 — Paper Presentation",                  date_achieved: "2025-06-20", issuer: "ICDCS",             status: "rejected", review_note: "Proof document unclear — please re-upload" },
  ];

  const hodId = userIds["hod@fcat.edu"];
  for (const a of sampleAchievements) {
    const existingAch = get("SELECT id FROM achievements WHERE user_id = ? AND title = ?", [a.user_id, a.title]);
    if (!existingAch) {
      const id = insert(
        `INSERT INTO achievements (user_id, type_code, title, date_achieved, issuer, status, reviewed_by, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.user_id, a.type_code, a.title, a.date_achieved, a.issuer || null,
          a.status,
          a.status !== "pending" ? hodId : null,
          a.status !== "pending" ? "2025-06-01 10:00:00" : null,
        ]
      );
      if (a.review_note) {
        run("UPDATE achievements SET review_note = ? WHERE id = ?", [a.review_note, id]);
      }
      console.log(`  Achievement: ${a.title.slice(0, 50)}`);
    }
  }

  console.log("\n✓ Seed complete. Demo accounts:");
  console.log("  admin@fcat.edu  / admin123  (Admin)");
  console.log("  hod@fcat.edu    / hod123    (HOD)");
  console.log("  priya@fcat.edu  / faculty123 (Faculty)");
  console.log("  arjun@fcat.edu  / faculty123 (Faculty)");
  console.log("  meena@fcat.edu  / faculty123 (Faculty)");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
