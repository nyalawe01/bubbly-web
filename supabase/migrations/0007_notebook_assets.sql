-- 0004_notebook_assets.sql
--
-- Unified store for generated Notebook assets (quiz / flashcards / slides /
-- summary / exam / guide). Replaces the localStorage-only notebook storage so
-- background generation results, interactive quiz/exam progress + scores, and
-- per-question tutoring chats all persist across reloads and devices.
--
--   status : 'generating' | 'ready' | 'failed'
--   content: the generated payload (null while generating)
--   state  : interactive progress — { phase, currentIndex, answers, score, qchats }
--   config : the generation config, kept so an asset can be retaken/regenerated

create table if not exists public.notebook_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null default 'Untitled',
  status text not null default 'generating',
  content jsonb,
  state jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notebook_assets_user_created_idx
  on public.notebook_assets (user_id, created_at desc);

alter table public.notebook_assets enable row level security;

drop policy if exists "Owner can read own notebook assets" on public.notebook_assets;
create policy "Owner can read own notebook assets" on public.notebook_assets
  for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert own notebook assets" on public.notebook_assets;
create policy "Owner can insert own notebook assets" on public.notebook_assets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update own notebook assets" on public.notebook_assets;
create policy "Owner can update own notebook assets" on public.notebook_assets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owner can delete own notebook assets" on public.notebook_assets;
create policy "Owner can delete own notebook assets" on public.notebook_assets
  for delete using (auth.uid() = user_id);

-- Live updates so the sidebar flips 'generating' -> 'ready' without a refresh.
do $$
begin
  begin
    alter publication supabase_realtime add table public.notebook_assets;
  exception when duplicate_object then null;
  end;
end $$;
