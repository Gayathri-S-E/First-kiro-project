# Faculty Career Advancement Tracker (FCAT)

A simple, professional web application for tracking faculty achievements, career milestones, and generating career profile reports.

## Features

- **Faculty**: Add achievements (publications, certifications, conferences, workshops, research, patents, teaching), upload proof documents, track milestone progress, generate PDF career reports
- **Admin/HOD**: Verify achievements (approve/reject), configure milestone requirements, view faculty overview and progress

## Tech Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
| Frontend  | React 18 + Vite, Recharts, jsPDF         |
| Backend   | Node.js + Express                        |
| Database  | SQLite via sql.js (pure JS, no native build needed) |
| Auth      | JWT + bcryptjs                           |
| Uploads   | Multer (local disk, `server/uploads/`)   |

## Getting Started

### 1. Install dependencies

```powershell
cd server; npm install
cd ../client; npm install
```

### 2. Seed demo data

```powershell
cd server; npm run seed
```

Demo accounts:
| Email | Password | Role |
|---|---|---|
| admin@fcat.edu | admin123 | Admin |
| hod@fcat.edu | hod123 | HOD |
| priya@fcat.edu | faculty123 | Faculty |
| arjun@fcat.edu | faculty123 | Faculty |
| meena@fcat.edu | faculty123 | Faculty |

### 3. Run development servers

Open two terminals:

```powershell
# Terminal 1 — backend (port 3001)
cd server; npm run dev

# Terminal 2 — frontend (port 5173)
cd client; npm run dev
```

Then open http://localhost:5173

## Project Structure

```
Kiro/
├── server/
│   ├── src/
│   │   ├── index.js          Express app entry
│   │   ├── db.js             SQLite (sql.js) setup + schema
│   │   ├── seed.js           Demo data seeder
│   │   ├── middleware/
│   │   │   └── auth.js       JWT verify + role guard
│   │   └── routes/
│   │       ├── auth.js       Login, register, profile
│   │       ├── achievements.js CRUD + file upload
│   │       ├── milestones.js  Templates + progress
│   │       ├── admin.js       Verification + overview
│   │       └── reports.js     Dashboard + career report data
│   ├── uploads/              Uploaded proof files
│   └── fcat.db               SQLite database file
│
└── client/
    └── src/
        ├── App.jsx           Routes + guards
        ├── context/          AuthContext
        ├── api/              Axios client
        ├── components/       Layout, FileUpload, ProgressBar, StatusBadge
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Achievements.jsx
            ├── AddEditAchievement.jsx
            ├── Milestones.jsx
            ├── Progress.jsx
            ├── Report.jsx
            └── admin/
                ├── FacultyOverview.jsx
                ├── VerifyAchievements.jsx
                ├── MilestoneConfig.jsx
                ├── ManageUsers.jsx
                └── FacultyProgress.jsx
```

## Configuration

All milestone requirements are configured by Admin/HOD through the UI — nothing is hardcoded. Adjust `server/.env` for port, JWT secret, and paths.
