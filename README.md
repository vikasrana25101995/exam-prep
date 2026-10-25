# ExamPrep

Mock-test platform. Banking (Prelims/Mains) is live; SSC, Railways and Insurance are listed as "Soon".

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # asserts scoring, admin validation and dashboard stats
```

- The **first account you create becomes the admin** (sidebar → "Create test"). Everyone after is a student.
- Data lives in `data/db.json` (git-ignored). Delete it to reset.
- Local dev accounts used while building: `admin@example.test` / `Password123!` (admin), `student@example.test` / `Password123!` (student)

## AI question generation

Admin → Create test → **Generate with AI** drafts a practice paper with Claude (Opus 5): choose stage (Prelims/Mains),
paper type (full mock or one section), toughness (Easy/Moderate/Hard), questions per section and optional focus topics.
The draft fills the builder; review every question, then publish.

Setup: create `.env.local` (git-ignored) with your key from console.anthropic.com, then restart `npm run dev`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Practice question bank

Practice questions are separate from mock tests, so mock questions stay unseen until a student sits the mock.

- **Admin → Practice bank** (`/admin/practice`): add, edit, delete and filter single questions tagged by exam, stage, section and topic.
- **Students → Practice**: pick exam, stage, section, optional topics, number of questions and time; they get a random set from the bank and see every answer on submit. Practice never counts in mock scores.

Setup: run `supabase/migrations/20261024_practice_questions.sql` once in Supabase → SQL Editor before deploying.

## Import (ZIP, Excel, CSV, JSON, PDF)

**Admin → Import** (`/admin/import`): upload a `.zip` or single `.xlsx`, `.csv`, `.json` or `.pdf` files and choose **Mock tests** (each file becomes one test) or **Practice questions** (added to the bank).
Templates: `public/templates/` (CSV columns `Section, Topic, Question, Option A…E, Answer, Minutes, Title`; answers A–E or 1–5).
PDFs are read by Claude (needs `ANTHROPIC_API_KEY`), up to 5 per upload. Limits: 25MB per upload, 50 files per ZIP.

## Passwords

- **Forgot password** (login page): emails a reset link → `/auth/confirm` → `/reset-password`.
- **Change password** (sidebar, all users): needs the current password.

Supabase setup (Authentication → URL Configuration):
- **Site URL**: your live address, e.g. `https://exam-prep.co.in`.
- **Redirect URLs**: add `https://exam-prep.co.in/auth/confirm` and `http://localhost:3000/auth/confirm`.
- Optional `SITE_URL` env var (same as Site URL) so reset links never depend on the request's host.
- Recommended (works when the email is opened on another device): Authentication → Email Templates → **Reset Password**, set the link to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
- Supabase's built-in email sender is heavily rate-limited; set up custom SMTP (Authentication → SMTP Settings) before real students use it.

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
