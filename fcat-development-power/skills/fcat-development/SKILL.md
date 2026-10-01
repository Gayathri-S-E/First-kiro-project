---
name: fcat-development
description: Provides project-specific guidance for developing and maintaining the Faculty Career Advancement Tracker.
---

# FCAT Development Skill

Use this skill when working on the Faculty Career Advancement Tracker (FCAT).

## Project Flow

Faculty Login ? Dashboard ? Add Achievement ? Upload Proof ? Career Milestones ? Progress Tracking ? Report Generation ? Admin/HOD Verification.

## Achievement Categories

- Publications
- Certifications
- Conferences
- Workshops
- Research Projects
- Patents
- Academic/Teaching Activities

## Development Rules

- Inspect the existing implementation before making changes.
- Reuse the existing project architecture and conventions.
- Preserve existing working functionality.
- Do not introduce AI/ML unless explicitly requested.
- Do not add unnecessary dependencies or external services.
- Keep changes focused on the requested feature.
- Use institution-defined/configurable milestone requirements rather than hardcoding promotion rules.
- Follow the existing backend API, authentication, database, and frontend conventions.
- Validate changes before considering the task complete.

## Security

- Never hardcode secrets, API keys, passwords, or tokens.
- Keep environment-specific secrets in environment variables.
- Do not commit `.env` files or local database files.
