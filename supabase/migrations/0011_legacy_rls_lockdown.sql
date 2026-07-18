-- 0011_legacy_rls_lockdown.sql
--
-- Supabase Advisor flagged public.conversations and public.messages as
-- CRITICAL: RLS disabled on public tables (readable/writable by anyone with
-- the anon key). Both are unreferenced leftovers from an earlier prototype
-- (superseded by study_sessions/chat_sessions) and are empty, but they were
-- still open. Locking them down with the same owner-only pattern used
-- everywhere else in this schema.

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Owner can manage own conversations" on public.conversations;
create policy "Owner can manage own conversations" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owner can manage own messages" on public.messages;
create policy "Owner can manage own messages" on public.messages
  for all using (
    exists (select 1 from public.conversations c where c.id = messages.conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.conversations c where c.id = messages.conversation_id and c.user_id = auth.uid())
  );
