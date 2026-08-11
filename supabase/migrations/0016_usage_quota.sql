-- 0016_usage_quota.sql
-- Phase 1.5: cost control before monetization exists. usage_events logs every
-- AI request the student triggers (async, never blocks the user); user_quotas
-- holds per-user daily caps. The chat route checks usage_events and 429s past
-- the daily_chat_messages cap. Idempotent.

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  feature_name text not null,          -- 'chat_message', 'vault_upload', 'chat_attachment_extract', 'vault_promote', ...
  model_used text,
  provider text,
  tokens_used int default 0,
  estimated_cost numeric(12,6) default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_id_created_at_idx on usage_events(user_id, created_at desc);
create index if not exists usage_events_feature_created_at_idx on usage_events(feature_name, created_at);

alter table usage_events enable row level security;
drop policy if exists "Owner can read own usage events" on usage_events;
create policy "Owner can read own usage events" on usage_events
  for select using (auth.uid() = user_id);
-- Inserts are server-side (the API route uses the service role / authed user's session)
-- and fire-and-forget; allow the authenticated owner to insert their own rows.
drop policy if exists "Owner can insert own usage events" on usage_events;
create policy "Owner can insert own usage events" on usage_events
  for insert with check (auth.uid() = user_id);

-- Default daily quotas. Tunable per user via UPDATE if/when a real pricing tier exists.
create table if not exists user_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_chat_messages int default 50,
  daily_vault_uploads int default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_quotas enable row level security;
drop policy if exists "Owner owns their quotas" on user_quotas;
create policy "Owner owns their quotas" on user_quotas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
