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

  // ── Extended Demo Data ────────────────────────────────────────────────────
  // Five additional faculty members with varied progress states, plus a demo
  // coordinator account. All emails use @demo.fcat.edu so they never collide
  // with real institutional accounts.
  //
  // Run command:  npm run seed  (from project root)
  // Safe to re-run: every insert is guarded by an email/title uniqueness check.
  // To reset: delete server/fcat.db and re-run `npm run seed`.

  const demoUsers = [
    // Coordinator (created via admin endpoint logic in seed, not self-register)
    {
      name: "Dr. Sanya Krishnan", email: "coordinator@demo.fcat.edu",
      password: "demo1234", role: "coordinator",
      department: "Academic Affairs", designation: "Faculty Development Coordinator",
    },
    // Faculty — HIGH progress (On Track / Excellent)
    {
      name: "Dr. Arun Kumar",  email: "arun.kumar@demo.fcat.edu",
      password: "demo1234", role: "faculty",
      department: "Computer Science", designation: "Assistant Professor",
    },
    // Faculty — MEDIUM progress (Developing)
    {
      name: "Dr. Priya Devi",  email: "priya.devi@demo.fcat.edu",
      password: "demo1234", role: "faculty",
      department: "Data Science", designation: "Assistant Professor",
    },
    // Faculty — VERY HIGH progress (Excellent)
    {
      name: "Dr. Meena S",     email: "meena.s@demo.fcat.edu",
      password: "demo1234", role: "faculty",
      department: "Information Technology", designation: "Associate Professor",
    },
    // Faculty — LOW progress (Needs Attention)
    {
      name: "Dr. Rahul Kumar", email: "rahul.kumar@demo.fcat.edu",
      password: "demo1234", role: "faculty",
      department: "Computer Applications", designation: "Assistant Professor",
    },
    // Faculty — MEDIUM-HIGH progress (On Track)
    {
      name: "Dr. Kavitha R",   email: "kavitha.r@demo.fcat.edu",
      password: "demo1234", role: "faculty",
      department: "Computer Science", designation: "Associate Professor",
    },
  ];

  const demoIds = {};
  for (const u of demoUsers) {
    let existing = get("SELECT id FROM users WHERE email = ?", [u.email]);
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      const id = insert(
        "INSERT INTO users (name, email, password, role, department, designation) VALUES (?, ?, ?, ?, ?, ?)",
        [u.name, u.email, hashed, u.role, u.department, u.designation]
      );
      demoIds[u.email] = id;
      console.log(`  Created demo user: ${u.email} (${u.role})`);
    } else {
      demoIds[u.email] = existing.id;
      console.log(`  Exists: ${u.email}`);
    }
  }

  const coordId = demoIds["coordinator@demo.fcat.edu"];
  const arunId  = demoIds["arun.kumar@demo.fcat.edu"];
  const priyaDId = demoIds["priya.devi@demo.fcat.edu"];
  const meenaSId = demoIds["meena.s@demo.fcat.edu"];
  const rahulId  = demoIds["rahul.kumar@demo.fcat.edu"];
  const kavithaId = demoIds["kavitha.r@demo.fcat.edu"];

  // Use the HOD account to review achievements (mirrors existing seed pattern)
  const reviewerId = userIds["hod@fcat.edu"];
  const REVIEWED_AT = "2025-06-15 10:00:00";

  const demoAchievements = [
    // ── Dr. Arun Kumar — HIGH PROGRESS (On Track, ~70% milestone completion) ──
    { user_id: arunId, type_code: "certification", title: "Python for Data Science — NPTEL Certification",     date_achieved: "2024-02-10", issuer: "NPTEL / IIT Madras",       status: "approved" },
    { user_id: arunId, type_code: "certification", title: "AWS Certified Developer Associate",                  date_achieved: "2024-08-20", issuer: "Amazon Web Services",     status: "approved" },
    { user_id: arunId, type_code: "workshop",      title: "National Workshop on Deep Learning Applications",    date_achieved: "2024-03-18", issuer: "IEEE Chapter, VIT",       status: "approved" },
    { user_id: arunId, type_code: "workshop",      title: "Conducted Hands-On Python Workshop for Students",    date_achieved: "2024-11-05", issuer: "Institution",            status: "approved" },
    { user_id: arunId, type_code: "workshop",      title: "Faculty Development Programme — AI & ML",            date_achieved: "2025-01-20", issuer: "AICTE / QualityHub",     status: "approved" },
    { user_id: arunId, type_code: "workshop",      title: "Attended Cloud Computing Bootcamp",                  date_achieved: "2025-03-10", issuer: "AWS Educate",            status: "approved" },
    { user_id: arunId, type_code: "conference",    title: "ICPC 2024 — Conference Participation",               date_achieved: "2024-07-15", issuer: "ICPC",                   status: "approved" },
    { user_id: arunId, type_code: "conference",    title: "National Conference on Computer Vision",              date_achieved: "2024-10-22", issuer: "NIT Trichy",             status: "approved" },
    { user_id: arunId, type_code: "publication",   title: "A Survey of Transfer Learning Techniques in NLP",   date_achieved: "2024-06-30", issuer: "Springer LNCS",          status: "approved" },
    { user_id: arunId, type_code: "publication",   title: "Efficient Graph Neural Networks for Social Media",   date_achieved: "2025-02-14", issuer: "IEEE Access",            status: "approved" },
    { user_id: arunId, type_code: "research",      title: "IoT-Enabled Smart Campus Monitoring System",        date_achieved: "2024-09-01", issuer: "Institutional Grant",    status: "approved" },
    { user_id: arunId, type_code: "teaching",      title: "Developed Advanced Algorithms Course Material",      date_achieved: "2024-04-15", issuer: "Institution",            status: "approved" },
    { user_id: arunId, type_code: "teaching",      title: "Mentored Final Year Project Students (2024)",        date_achieved: "2024-12-20", issuer: "Institution",            status: "approved" },

    // ── Dr. Priya Devi — MEDIUM PROGRESS (Developing, ~45% milestone completion) ──
    { user_id: priyaDId, type_code: "certification", title: "Google Data Analytics Professional Certificate",   date_achieved: "2024-04-05", issuer: "Google / Coursera",      status: "approved" },
    { user_id: priyaDId, type_code: "workshop",      title: "Participated in R & Python for Analytics Workshop",date_achieved: "2024-07-12", issuer: "IIM Ahmedabad",          status: "approved" },
    { user_id: priyaDId, type_code: "workshop",      title: "Attended Teaching Pedagogy FDP",                   date_achieved: "2024-10-08", issuer: "UGC / HRDC",             status: "approved" },
    { user_id: priyaDId, type_code: "conference",    title: "Data Science Symposium 2024 — Poster Paper",       date_achieved: "2024-09-25", issuer: "IIT Delhi",              status: "approved" },
    { user_id: priyaDId, type_code: "publication",   title: "Predictive Modelling for Student Performance",     date_achieved: "2024-11-15", issuer: "Elsevier",               status: "approved" },
    { user_id: priyaDId, type_code: "research",      title: "Healthcare Analytics Using Wearable Data",         date_achieved: "2025-01-10", issuer: "State Research Fund",    status: "pending"  },
    { user_id: priyaDId, type_code: "teaching",      title: "Redesigned Data Structures Lab Curriculum",        date_achieved: "2025-03-01", issuer: "Institution",            status: "approved" },
    { user_id: priyaDId, type_code: "conference",    title: "International Conference on Computational Biology", date_achieved: "2025-04-18", issuer: "Springer",               status: "rejected",
      review_note: "Supporting conference paper not attached" },

    // ── Dr. Meena S — VERY HIGH PROGRESS (Excellent, ~90% milestone completion) ──
    { user_id: meenaSId, type_code: "publication",   title: "Adversarial Robustness in Deep Neural Networks",   date_achieved: "2023-09-14", issuer: "IEEE TPAMI",             status: "approved" },
    { user_id: meenaSId, type_code: "publication",   title: "Explainable AI for Medical Decision Support",      date_achieved: "2023-12-05", issuer: "Nature Machine Intelligence", status: "approved" },
    { user_id: meenaSId, type_code: "publication",   title: "Federated Privacy-Preserving Machine Learning",    date_achieved: "2024-04-22", issuer: "ACM CCS",                status: "approved" },
    { user_id: meenaSId, type_code: "publication",   title: "Causal Inference in Reinforcement Learning",       date_achieved: "2024-09-18", issuer: "NeurIPS",                status: "approved" },
    { user_id: meenaSId, type_code: "publication",   title: "Scalable Knowledge Graphs for Enterprise AI",      date_achieved: "2025-01-08", issuer: "VLDB",                   status: "approved" },
    { user_id: meenaSId, type_code: "certification", title: "TensorFlow Developer Certificate",                  date_achieved: "2024-02-28", issuer: "Google",                 status: "approved" },
    { user_id: meenaSId, type_code: "certification", title: "Microsoft Azure AI Engineer Associate",             date_achieved: "2024-06-30", issuer: "Microsoft",              status: "approved" },
    { user_id: meenaSId, type_code: "conference",    title: "AAAI 2024 — Paper Presentation",                   date_achieved: "2024-02-08", issuer: "AAAI",                   status: "approved" },
    { user_id: meenaSId, type_code: "conference",    title: "IJCAI 2024 — Workshop Co-Organiser",               date_achieved: "2024-08-05", issuer: "IJCAI",                  status: "approved" },
    { user_id: meenaSId, type_code: "conference",    title: "CVPR 2025 — Invited Talk",                         date_achieved: "2025-06-20", issuer: "IEEE CVPR",              status: "approved" },
    { user_id: meenaSId, type_code: "workshop",      title: "Conducted AI Ethics National Workshop",            date_achieved: "2024-03-22", issuer: "Institution / NASSCOM", status: "approved" },
    { user_id: meenaSId, type_code: "workshop",      title: "Delivered Faculty Development Programme on ML",    date_achieved: "2024-11-15", issuer: "AICTE",                  status: "approved" },
    { user_id: meenaSId, type_code: "workshop",      title: "Participated in Research Methodology Bootcamp",    date_achieved: "2025-02-05", issuer: "IIT Bombay",             status: "approved" },
    { user_id: meenaSId, type_code: "research",      title: "SERB-Funded AI Safety Research Project",           date_achieved: "2024-01-15", issuer: "SERB / DST India",       status: "approved" },
    { user_id: meenaSId, type_code: "research",      title: "Indo-EU Collaborative Privacy AI Project",         date_achieved: "2024-07-01", issuer: "EU Horizon Programme",  status: "approved" },
    { user_id: meenaSId, type_code: "patent",        title: "Privacy-Preserving Federated Learning Framework",  date_achieved: "2025-03-10", issuer: "Indian Patent Office",  status: "approved" },
    { user_id: meenaSId, type_code: "teaching",      title: "Launched PG Specialisation in AI Ethics",          date_achieved: "2024-08-01", issuer: "Institution",           status: "approved" },
    { user_id: meenaSId, type_code: "teaching",      title: "Best Teacher Award 2024",                          date_achieved: "2024-12-15", issuer: "Institution",           status: "approved" },
    { user_id: meenaSId, type_code: "teaching",      title: "Curriculum Revision for M.Tech AI Programme",      date_achieved: "2025-01-20", issuer: "University",            status: "approved" },
    { user_id: meenaSId, type_code: "teaching",      title: "Supervised 4 PhD Students (2023-24)",              date_achieved: "2024-05-30", issuer: "University",            status: "approved" },

    // ── Dr. Rahul Kumar — LOW PROGRESS (Needs Attention, ~25% milestone completion) ──
    { user_id: rahulId, type_code: "certification", title: "Google Cloud Digital Leader Certificate",            date_achieved: "2024-05-14", issuer: "Google Cloud",           status: "approved" },
    { user_id: rahulId, type_code: "workshop",      title: "Participated in Cloud Security Workshop",            date_achieved: "2024-08-30", issuer: "ISC2",                   status: "approved" },
    { user_id: rahulId, type_code: "teaching",      title: "Conducted Lab Sessions for BCA Cloud Module",        date_achieved: "2024-11-01", issuer: "Institution",           status: "approved" },
    { user_id: rahulId, type_code: "research",      title: "Cloud-Based ERP Feasibility Study",                 date_achieved: "2025-02-01", issuer: "Institutional Fund",    status: "pending"  },
    { user_id: rahulId, type_code: "publication",   title: "Microservices Architecture for Academic ERP",        date_achieved: "2025-03-20", issuer: "IJEAT",                  status: "pending"  },

    // ── Dr. Kavitha R — MEDIUM-HIGH PROGRESS (On Track, ~60% milestone completion) ──
    { user_id: kavithaId, type_code: "publication",   title: "Sentiment Analysis in Regional Languages Using BERT", date_achieved: "2023-11-10", issuer: "ACL Anthology",        status: "approved" },
    { user_id: kavithaId, type_code: "publication",   title: "Optimised Scheduling Algorithms for Edge Networks",  date_achieved: "2024-06-18", issuer: "IEEE Networking",      status: "approved" },
    { user_id: kavithaId, type_code: "publication",   title: "Comparative Study of LLM Fine-Tuning Strategies",    date_achieved: "2024-12-02", issuer: "Elsevier",             status: "approved" },
    { user_id: kavithaId, type_code: "certification", title: "Deep Learning Specialisation (Coursera)",             date_achieved: "2024-03-25", issuer: "deeplearning.ai",      status: "approved" },
    { user_id: kavithaId, type_code: "certification", title: "Oracle Certified Associate Java Programmer",          date_achieved: "2024-09-12", issuer: "Oracle",               status: "approved" },
    { user_id: kavithaId, type_code: "conference",    title: "COLING 2024 — Paper Presentation",                   date_achieved: "2024-05-20", issuer: "COLING",               status: "approved" },
    { user_id: kavithaId, type_code: "conference",    title: "EMNLP 2024 — Workshop Presentation",                 date_achieved: "2024-11-08", issuer: "ACL",                  status: "approved" },
    { user_id: kavithaId, type_code: "workshop",      title: "Conducted NLP for Educators FDP",                    date_achieved: "2024-07-04", issuer: "AICTE",                status: "approved" },
    { user_id: kavithaId, type_code: "research",      title: "Multi-Lingual NLP for Indic Languages — DST",        date_achieved: "2024-04-10", issuer: "DST India",            status: "approved" },
    { user_id: kavithaId, type_code: "teaching",      title: "Developed Elective on Natural Language Processing",   date_achieved: "2024-08-15", issuer: "Institution",          status: "approved" },
    { user_id: kavithaId, type_code: "teaching",      title: "Teaching Innovation Award 2024",                      date_achieved: "2024-12-10", issuer: "Institution",          status: "approved" },
  ];

  for (const a of demoAchievements) {
    const existingAch = get(
      "SELECT id FROM achievements WHERE user_id = ? AND title = ?",
      [a.user_id, a.title]
    );
    if (!existingAch) {
      const id = insert(
        `INSERT INTO achievements
           (user_id, type_code, title, date_achieved, issuer, status, reviewed_by, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.user_id, a.type_code, a.title, a.date_achieved, a.issuer || null,
          a.status,
          a.status !== "pending" ? reviewerId : null,
          a.status !== "pending" ? REVIEWED_AT : null,
        ]
      );
      if (a.review_note) {
        run("UPDATE achievements SET review_note = ? WHERE id = ?", [a.review_note, id]);
      }
      console.log(`  Achievement: [${a.type_code}] ${a.title.slice(0, 55)}`);
    }
  }

  // ── Growth Plans — coordinator assigns plans to demo faculty ──────────────
  // Only created if the coordinator demo account exists.
  if (coordId) {
    const demoPlans = [
      {
        faculty_id: arunId,   title: "Complete 5 Publications for Junior Research Milestone",
        description: "Dr. Arun Kumar is 2 publications away from meeting the Junior Research Milestone. Priority for the next academic year.",
        target_date: "2025-12-31", status: "in_progress",
        notes: "Encourage submission to IEEE/Springer indexed journals.",
      },
      {
        faculty_id: priyaDId, title: "Complete Research Project and Submit for Funding",
        description: "Healthcare Analytics research is pending approval. Coordinator to assist with documentation.",
        target_date: "2025-09-30", status: "in_progress",
        notes: "Follow up with State Research Fund on pending application.",
      },
      {
        faculty_id: rahulId,  title: "Attend 3 More Workshops to Meet Milestone",
        description: "Dr. Rahul Kumar needs 3 additional workshop activities to complete the Workshop Participation milestone.",
        target_date: "2025-11-30", status: "planned",
        notes: "Identify relevant AICTE-approved FDP programmes for cloud computing.",
      },
      {
        faculty_id: rahulId,  title: "Submit Conference Paper",
        description: "No conference participation recorded. Identify a suitable national/international conference for 2025.",
        target_date: "2025-10-15", status: "planned",
        notes: "Cloud computing tracks at IEEE or Springer conferences preferred.",
      },
      {
        faculty_id: kavithaId, title: "Reach 5 Publications for Junior Research Milestone",
        description: "Dr. Kavitha R has 3 approved publications. 2 more needed to complete Junior Research Milestone.",
        target_date: "2026-03-31", status: "in_progress",
        notes: "Current paper under revision — expected in Q1 2026.",
      },
    ];

    for (const p of demoPlans) {
      if (!p.faculty_id) continue; // skip if faculty account not created
      const existing = get(
        "SELECT id FROM growth_plans WHERE faculty_id = ? AND title = ?",
        [p.faculty_id, p.title]
      );
      if (!existing) {
        insert(
          `INSERT INTO growth_plans
             (faculty_id, title, description, target_date, status, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.faculty_id, p.title, p.description, p.target_date, p.status, p.notes, coordId]
        );
        console.log(`  Growth plan: ${p.title.slice(0, 55)}`);
      }
    }
  }

  console.log("\n✓ Seed complete. Demo accounts:");
  console.log("  admin@fcat.edu                / admin123  (Admin)");
  console.log("  hod@fcat.edu                  / hod123    (HOD)");
  console.log("  priya@fcat.edu                / faculty123 (Faculty)");
  console.log("  arjun@fcat.edu                / faculty123 (Faculty)");
  console.log("  meena@fcat.edu                / faculty123 (Faculty)");
  console.log("");
  console.log("  Extended demo accounts (@demo.fcat.edu password: demo1234)");
  console.log("  coordinator@demo.fcat.edu     (Coordinator)");
  console.log("  arun.kumar@demo.fcat.edu      (Faculty — On Track)");
  console.log("  priya.devi@demo.fcat.edu      (Faculty — Developing)");
  console.log("  meena.s@demo.fcat.edu         (Faculty — Excellent)");
  console.log("  rahul.kumar@demo.fcat.edu     (Faculty — Needs Attention)");
  console.log("  kavitha.r@demo.fcat.edu       (Faculty — On Track)");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
