-- 0005_preferences.sql
-- Adds cross-device UI preferences alongside the existing theme column:
--   font_pref   — 'sans' | 'serif' (interface font; AI response font is separate)
--   ui_language — system/interface language code (e.g. 'en', 'sw'); NOT the AI
--                 response language, which follows the language the user types.

alter table user_preferences add column if not exists font_pref text not null default 'sans';
alter table user_preferences add column if not exists ui_language text not null default 'en';
