-- 0010_chat_sessions.sql
--
-- Chat history was living entirely in the browser's localStorage, which is
-- scoped per-origin — chats made on localhost/LAN-IP during dev are invisible on
-- the production domain, and everything is lost if browser data is ever cleared.
-- This moves chat sessions to the same account-based pattern already used for
-- notebook_assets, so history follows the student across devices/browsers.

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  pinned boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_updated_idx
  on public.chat_sessions (user_id, updated_at desc);

alter table public.chat_sessions enable row level security;

drop policy if exists "Owner can read own chat sessions" on public.chat_sessions;
create policy "Owner can read own chat sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "Owner can insert own chat sessions" on public.chat_sessions;
create policy "Owner can insert own chat sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update own chat sessions" on public.chat_sessions;
create policy "Owner can update own chat sessions" on public.chat_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owner can delete own chat sessions" on public.chat_sessions;
create policy "Owner can delete own chat sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);
