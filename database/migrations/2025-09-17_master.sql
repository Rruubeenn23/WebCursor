-- Idempotent, additive migration for favorites + helpers
-- Run with Supabase CLI or psql. Safe to re-run.

-- === helpers ===
create extension if not exists "uuid-ossp";

-- === tables ===

create table if not exists public.favorites_foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- Either internal food reference or external reference:
  food_id uuid references public.foods(id) on delete set null,
  external_id text,
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites_exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- Either internal exercise reference or external:
  exercise_id uuid references public.exercises(id) on delete set null,
  external_id text,
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- === indexes ===
create index if not exists favorites_foods_user_id_idx on public.favorites_foods(user_id, created_at desc);
create index if not exists favorites_exercises_user_id_idx on public.favorites_exercises(user_id, created_at desc);

-- Enforce at least one of (food_id, external_id)
create or replace function public._check_fav_food_target()
returns trigger as $$
begin
  if NEW.food_id is null and (NEW.external_id is null or length(NEW.external_id)=0) then
    raise exception 'Either food_id or external_id must be provided';
  end if;
  return NEW;
end;
$$ language plpgsql;

do $$
begin
  if not exists(
    select 1 from pg_trigger where tgname = 'favorites_foods_target_check'
  ) then
    create trigger favorites_foods_target_check
    before insert or update on public.favorites_foods
    for each row execute function public._check_fav_food_target();
  end if;
end $$;

create or replace function public._check_fav_exercise_target()
returns trigger as $$
begin
  if NEW.exercise_id is null and (NEW.external_id is null or length(NEW.external_id)=0) then
    raise exception 'Either exercise_id or external_id must be provided';
  end if;
  return NEW;
end;
$$ language plpgsql;

do $$
begin
  if not exists(
    select 1 from pg_trigger where tgname = 'favorites_exercises_target_check'
  ) then
    create trigger favorites_exercises_target_check
    before insert or update on public.favorites_exercises
    for each row execute function public._check_fav_exercise_target();
  end if;
end $$;

-- === RLS ===
alter table public.favorites_foods enable row level security;
alter table public.favorites_exercises enable row level security;

-- Policies: user owns their rows
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'favorites_foods' and policyname = 'favorites_foods_select_own') then
    create policy favorites_foods_select_own on public.favorites_foods
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'favorites_foods' and policyname = 'favorites_foods_ins_own') then
    create policy favorites_foods_ins_own on public.favorites_foods
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'favorites_foods' and policyname = 'favorites_foods_upd_own') then
    create policy favorites_foods_upd_own on public.favorites_foods
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'favorites_foods' and policyname = 'favorites_foods_del_own') then
    create policy favorites_foods_del_own on public.favorites_foods
      for delete using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'favorites_exercises' and policyname = 'favorites_exercises_select_own') then
    create policy favorites_exercises_select_own on public.favorites_exercises
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'favorites_exercises' and policyname = 'favorites_exercises_ins_own') then
    create policy favorites_exercises_ins_own on public.favorites_exercises
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'favorites_exercises' and policyname = 'favorites_exercises_upd_own') then
    create policy favorites_exercises_upd_own on public.favorites_exercises
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'favorites_exercises' and policyname = 'favorites_exercises_del_own') then
    create policy favorites_exercises_del_own on public.favorites_exercises
      for delete using (auth.uid() = user_id);
  end if;
end $$;
