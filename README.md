# ExamPrep

Mock-test platform. Banking (Prelims/Mains) is live; SSC, Railways and Insurance are listed as "Soon".

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # asserts scoring, admin validation and dashboard stats
```

- The **first account you create becomes the admin** (sidebar → "Create test"). Everyone after is a student.
- Data lives in `data/db.json` (git-ignored). Delete it to reset.
- Local dev account used while building: `admin@example.test` / `Password123!`

## Structure

Each feature is a module under `src/modules/<name>/`:

```
action/     server actions ('use server'): auth checks + mutations
constants/  static config, copy, sample data
service/    data access + pure logic (scoring, validation, stats)
hooks/      client state (timer, test session, form builders)
style/      desktop.scss, tablet.scss (≤1024px), mobile.scss (≤640px), index.module.scss
index.jsx   the page component
```

Modules: `auth` (login/sign-up), `dashboard` (stats, test list), `test` (test runner), `admin` (create tests).
Shared: `src/constants` (app name, exams, stages), `src/lib/db.js`, `src/components` (Logo, Sidebar).

## Adding a new paper (e.g. SSC)

1. `src/constants/index.js` → set `live: true` on the exam.
2. Optional: add a section template in `src/modules/admin/constants` → `TEMPLATES`.
3. Create its tests from the admin page.
