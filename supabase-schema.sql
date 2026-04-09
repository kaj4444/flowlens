-- ============================================
-- FLOWLENS — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- COMPANIES
-- ============================================
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  industry text,
  segment text,
  size text,
  description text,
  identified_areas jsonb default '[]'::jsonb,
  areas_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- PROCESS AREAS (e.g. Obchod, Logistika)
-- ============================================
create table public.process_areas (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  description text,
  icon text,
  color text default '#6366f1',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- PROCESSES
-- ============================================
create table public.processes (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  area_id uuid references public.process_areas(id) on delete set null,
  title text not null,
  raw_description text,
  structured_steps jsonb default '[]'::jsonb,
  status text default 'draft' check (status in ('draft', 'structured', 'mapped')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- MIND MAP NODES
-- ============================================
create table public.mindmap_nodes (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  node_id text not null,
  type text default 'default' check (type in ('default', 'area', 'process', 'step', 'note')),
  label text not null,
  content text,
  position_x float default 0,
  position_y float default 0,
  color text default '#6366f1',
  tag text,
  parent_node_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- MIND MAP EDGES
-- ============================================
create table public.mindmap_edges (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  edge_id text not null,
  source_node_id text not null,
  target_node_id text not null,
  label text,
  created_at timestamptz default now()
);

-- ============================================
-- COMMENTS (on nodes)
-- ============================================
create table public.node_comments (
  id uuid default uuid_generate_v4() primary key,
  node_id text not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- SHARE LINKS
-- ============================================
create table public.share_links (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.process_areas enable row level security;
alter table public.processes enable row level security;
alter table public.mindmap_nodes enable row level security;
alter table public.mindmap_edges enable row level security;
alter table public.node_comments enable row level security;
alter table public.share_links enable row level security;

-- Profiles: own only
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Companies: own only
create policy "Users can CRUD own companies" on public.companies for all using (auth.uid() = user_id);

-- Process areas: via company
create policy "Users can CRUD own process areas" on public.process_areas for all
  using (exists (select 1 from public.companies where id = company_id and user_id = auth.uid()));

-- Processes: via company
create policy "Users can CRUD own processes" on public.processes for all
  using (exists (select 1 from public.companies where id = company_id and user_id = auth.uid()));

-- Mindmap nodes: via company
create policy "Users can CRUD own mindmap nodes" on public.mindmap_nodes for all
  using (exists (select 1 from public.companies where id = company_id and user_id = auth.uid()));

-- Mindmap edges: via company
create policy "Users can CRUD own mindmap edges" on public.mindmap_edges for all
  using (exists (select 1 from public.companies where id = company_id and user_id = auth.uid()));

-- Comments: via company
create policy "Users can CRUD own comments" on public.node_comments for all
  using (exists (select 1 from public.companies where id = company_id and user_id = auth.uid()));

-- Share links: read via token (public), write own
create policy "Users can manage own share links" on public.share_links for all
  using (exists (select 1 from public.companies where id = company_id and user_id = auth.uid()));
create policy "Anyone can read share links by token" on public.share_links for select using (true);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at before update on public.companies
  for each row execute function public.update_updated_at();
create trigger processes_updated_at before update on public.processes
  for each row execute function public.update_updated_at();
create trigger mindmap_nodes_updated_at before update on public.mindmap_nodes
  for each row execute function public.update_updated_at();
