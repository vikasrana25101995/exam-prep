-- Question snapshots on mock attempts, for the answer review. Run once in Supabase → SQL Editor
-- BEFORE deploying the code that uses it. Older attempts stay null (no review).
alter table public.attempts add column if not exists questions jsonb;

notify pgrst, 'reload schema';
