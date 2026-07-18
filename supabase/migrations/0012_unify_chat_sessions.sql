-- 0012_unify_chat_sessions.sql
--
-- Unifies mobile chat storage onto the same chat_sessions table the web app
-- already uses (0010_chat_sessions.sql), instead of the older
-- study_sessions/session_messages pair. This makes a chat started on one
-- platform visible on the other for the same account.
--
-- Non-destructive: study_sessions/session_messages are left in place (not
-- dropped) as a rollback safety net; this only adds to chat_sessions.

-- Mobile's "Add to class" feature lives on study_sessions.class_id — carry it
-- over so chat_sessions can serve the same feature.
alter table public.chat_sessions add column if not exists class_id uuid references public.study_classes(id) on delete set null;
create index if not exists chat_sessions_class_id_idx on public.chat_sessions (class_id);

-- One-time copy of existing mobile chat history into chat_sessions, preserving
-- the original id (so any existing deep links / class assignments keep working).
-- Web's message shape uses role 'user' | 'ai' (see app/chat/page.tsx), so
-- session_messages.role ('user' | 'assistant') is remapped accordingly.
insert into public.chat_sessions (id, user_id, title, pinned, history, class_id, created_at, updated_at)
select
  s.id,
  s.user_id,
  s.title,
  false,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('role', case when m.role = 'user' then 'user' else 'ai' end, 'text', m.content)
        order by m.created_at
      )
      from public.session_messages m
      where m.session_id = s.id
    ),
    '[]'::jsonb
  ),
  s.class_id,
  s.created_at,
  coalesce(s.updated_at, s.created_at)
from public.study_sessions s
where not exists (select 1 from public.chat_sessions cs where cs.id = s.id);
