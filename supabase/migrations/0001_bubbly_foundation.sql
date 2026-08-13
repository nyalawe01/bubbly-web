-- 0001_bubbly_foundation.sql
-- Foundational schema for the bubbly rebuild: study sessions (chat history unification),
-- per-generator history tables (mirroring the existing quiz_history shape), and
-- cross-device theme/preference sync. Run this against the Supabase project via the
-- SQL editor or `supabase db push` once the CLI is linked.
--
-- NOTE: this migration also BASELINES the tables that predate this migration set
-- (vault_documents, vault_embeddings, quiz_history) so a fresh `supabase db reset`
-- or a brand-new project can provision end-to-end. Later migrations (0002, 0013)
-- patch these tables, so without them a fresh database fails at 0002. On the
-- existing remote database these `create table if not exists` statements are no-ops.
-- All statements are idempotent and safe to re-run.

-- Required for the vault's vector(768) embeddings. Present on hosted Supabase by
-- default, but a fresh local dev database needs it created explicitly.
create extension if not exists vector;

-- ============================================================
-- VAULT (baselined here — created originally before this migration set)
-- ============================================================
create table if not exists vault_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text,
  file_type text,
  file_size text,
  file_content text,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists vault_embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references vault_documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text,
  embedding vector(3072),
  created_at timestamptz not null default now()
);

create table if not exists quiz_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  questions jsonb,
  question_count int,
  difficulty text,
  topic text,
  sources text[],
  created_at timestamptz not null default now()
);

-- ============================================================
-- STUDY SESSIONS
-- One entity backs both the mobile "Chat History" panel and the "Sessions" toggle —
-- see the plan's cross-cutting decision #1. Replaces the web app's localStorage-only
-- `bubbly_vault_conversations` for authenticated users.
-- ============================================================
create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists session_messages_session_id_idx on session_messages(session_id);
create index if not exists study_sessions_user_id_idx on study_sessions(user_id);

-- ============================================================
-- GENERATOR HISTORY
-- Mirrors quiz_history's existing shape (user_id, generated payload, config fields,
-- sources, created_at) so all five generators persist consistently.
-- ============================================================
create table if not exists flashcard_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Generated Flashcards',
  cards jsonb not null,
  card_count int,
  difficulty text,
  topic text,
  sources text[],
  created_at timestamptz not null default now()
);

create table if not exists slide_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Generated Slides',
  slides jsonb not null,
  format text,
  language text,
  slide_count int,
  sources text[],
  created_at timestamptz not null default now()
);

create table if not exists summary_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text,
  summary text not null,
  sources text[],
  created_at timestamptz not null default now()
);

create table if not exists exam_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Practice Exam',
  exam_type text not null check (exam_type in ('guide', 'exam')),
  content jsonb not null,
  sources text[],
  created_at timestamptz not null default now()
);

create index if not exists flashcard_history_user_id_idx on flashcard_history(user_id);
create index if not exists slide_history_user_id_idx on slide_history(user_id);
create index if not exists summary_history_user_id_idx on summary_history(user_id);
create index if not exists exam_history_user_id_idx on exam_history(user_id);

-- ============================================================
-- USER PREFERENCES
-- Cross-device theme sync (web localStorage <-> mobile AsyncStorage reconciliation).
-- ============================================================
create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — owner-only access on every table above.
-- ============================================================
alter table study_sessions enable row level security;
alter table session_messages enable row level security;
alter table flashcard_history enable row level security;
alter table slide_history enable row level security;
alter table summary_history enable row level security;
alter table exam_history enable row level security;
alter table user_preferences enable row level security;

create policy "Owner can manage own study sessions" on study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner can manage own session messages" on session_messages
  for all using (
    exists (select 1 from study_sessions s where s.id = session_messages.session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from study_sessions s where s.id = session_messages.session_id and s.user_id = auth.uid())
  );

create policy "Owner can manage own flashcard history" on flashcard_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner can manage own slide history" on slide_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner can manage own summary history" on summary_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner can manage own exam history" on exam_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner can manage own preferences" on user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
