-- 0006_classes.sql
-- "Classes" let a student group chat sessions (the three-dots "Add to class"
-- action on a chat). A session belongs to at most one class.

create table if not exists study_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists study_classes_user_id_idx on study_classes(user_id);

alter table study_classes enable row level security;
drop policy if exists "Owner can manage own classes" on study_classes;
create policy "Owner can manage own classes" on study_classes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table study_sessions add column if not exists class_id uuid references study_classes(id) on delete set null;
create index if not exists study_sessions_class_id_idx on study_sessions(class_id);
