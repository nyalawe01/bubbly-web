-- 0014_chat_sessions_mode.sql
--
-- Quiet tag distinguishing voice-tutor sessions (spoken, conversational
-- quiz/flashcard/summary practice — see lib/ai/prompts.ts tutorAddendum) from
-- regular typed chats. Both are stored identically in chat_sessions.history —
-- this column exists purely so a "study sessions" view can filter on it later
-- without needing to guess from content. Not surfaced anywhere in the UI yet.

alter table public.chat_sessions
  add column if not exists mode text not null default 'chat';
