require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const { initDb } = require("./db");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (auth-protected via route handler in achievements.js)
app.use("/uploads", express.static(path.resolve(process.env.UPLOADS_DIR || "./uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/achievements", require("./routes/achievements"));
app.use("/api/milestones",   require("./routes/milestones"));
app.use("/api/admin",        require("./routes/admin"));
app.use("/api/reports",      require("./routes/reports"));
app.use("/api/coordinator",  require("./routes/coordinator"));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── Serve React build in production ────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientBuild = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientBuild));
  app.get("*", (_req, res) => res.sendFile(path.join(clientBuild, "index.html")));
}

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDb();
    console.log("✓ Database ready");
    app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
