-- Ensure tanks table exists before later migrations alter it

create extension if not exists "pgcrypto";

create table if not exists public.tanks (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  project_id uuid references public.projects(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tanks_project_id on public.tanks(project_id);
