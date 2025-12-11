
-- [NEW] SETTINGS TABLE (Phase 5)
-- Stores global application settings (Company Name, Language, UI Scale, etc.)
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid, -- Optional: for multi-user configs in future
  config jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table public.settings enable row level security;

create policy "Enable read access for all users" on public.settings
  for select using (true);

create policy "Enable insert/update for all users" on public.settings
  for all using (true) with check (true);
