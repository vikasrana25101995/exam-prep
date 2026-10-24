-- Practice question bank, separate from mock tests. Run once in Supabase → SQL Editor
-- BEFORE deploying the code that uses it.
create table if not exists public.practice_questions (
  id         uuid primary key default gen_random_uuid(),
  exam       text not null,               -- an id from EXAMS in src/constants
  stage      text not null,               -- 'prelims' | 'mains'
  section    text not null,               -- e.g. 'Quantitative Aptitude'
  topic      text not null default '',
  text       text not null,
  options    text[] not null,
  answer     int  not null,               -- 0-based index into options; never sent to students before they submit
  created_at timestamptz not null default now(),
  constraint practice_questions_answer_in_range check (answer >= 0 and answer < cardinality(options))
);

create index if not exists practice_questions_pick_idx on public.practice_questions (exam, stage, section, topic);

-- Only the server (secret key) reads or writes this table; no public policies.
alter table public.practice_questions enable row level security;

-- Make the API see the new table right away (avoids "Could not find the table ... in the schema cache").
notify pgrst, 'reload schema';
