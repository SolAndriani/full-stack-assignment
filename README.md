# Worklo — Full-Stack Assignment

Welcome to the Worklo Full-Stack Assignment!

Worklo is a PSA (Professional Services Automation) platform for managing projects, tasks, time tracking, and client relationships. In this exercise you'll extend the existing codebase by building a real feature end-to-end — touching the database, backend API, and frontend UI.   

Focus on quality over completeness. Submit what you have when time is up.

If you have any questions, feel free to reach out — we're happy to clarify anything.

## Time Consideration

This assignment is scoped for **3–4 hours**. If you hit that limit, submit what you have and use `README.md` to describe what you'd finish next.

---    

## Getting Started

You'll need **Node.js 18+** and a free [Supabase](https://supabase.com) project.

```bash  
# 1. Fork this repo and clone your fork
npm install

# 2. Set up environment variables
cp .env.local.template .env.local
# Fill in your Supabase URL and keys

# 3. Run the database schema
# → Supabase dashboard → SQL Editor → paste and run supabase/schema.sql

# 4. Start the dev server
npm run dev   # Next.js on http://localhost:3000
```

---

## Task Overview

Build an **Admin panel** with a "Users" tab and a "Roles" tab so administrators can view, search, and manage the people and roles in their organization.

- Set up the "Users" and "Roles" tab structure under `/admin`
- Add a users table that displays each user's name, email, avatar, and assigned role(s)
- Add support for filtering the users table via a "Search" input field
- Add support for removing a user from the organization via the "more" icon button dropdown menu
- Add support for viewing all roles with their name, department, hierarchy level, and member count in the "Roles" tab
- Add support for renaming a role inline in the "Roles" tab
- [Bonus] Add cursor-based pagination to the users table

---

## How We Evaluate

- **Full-stack integration** — data flows correctly end-to-end
- **Backend awareness** — correct use of existing auth, error handling, and API patterns
- **Frontend quality** — component structure, loading/error states, UX polish
- **Code quality** — readable, typed, consistent with the existing codebase
- **README.md** — clear reasoning about decisions and trade-offs

---

## Submission Guidelines

Don't open a PR to this repo. Share your **fork URL**.

In your forked repository, include a README that explains:

- How to run your project.
- What you'd improve or do differently if you had more time.

Make sure your code runs locally based on the instructions in your README.