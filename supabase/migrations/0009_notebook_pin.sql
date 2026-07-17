-- 0009_notebook_pin.sql
--
-- Lets a student pin a Notebook asset so it sorts to the top of the sidebar list
-- (three-dot row menu: Share / Pin / Rename / Delete).

alter table public.notebook_assets add column if not exists pinned boolean not null default false;

create index if not exists notebook_assets_pinned_idx on public.notebook_assets (user_id, pinned, created_at desc);
