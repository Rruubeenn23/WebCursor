-- 2025-09-17: patch day_plan_items + favorites

create extension if not exists "uuid-ossp";

-- Relax NOT NULL on food_id in day_plan_items
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='day_plan_items' and column_name='food_id' and is_nullable='NO') then
    alter table public.day_plan_items alter column food_id drop not null;
  end if;
end$$;

-- Conditional check: quick entries must NOT have food_id; others must have it
do $$
begin
  if not exists (select 1 from pg_constraint where conname='day_plan_items_food_quick_check') then
    alter table public.day_plan_items
      add constraint day_plan_items_food_quick_check
      check (
        (entry_type = 'quick' and food_id is null)
        or
        (coalesce(entry_type,'food') <> 'quick' and food_id is not null)
      );
  end if;
end$$;

-- Favorites tables
create table if not exists public.favorites_foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  external_id text,
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists favorites_foods_user_id_idx on public.favorites_foods(user_id, created_at desc);

create table if not exists public.favorites_exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  external_id text,
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists favorites_exercises_user_id_idx on public.favorites_exercises(user_id, created_at desc);

-- RLS
alter table public.favorites_foods enable row level security;
alter table public.favorites_exercises enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='favorites_foods' and policyname='favorites_foods_select_own') then
    create policy favorites_foods_select_own on public.favorites_foods
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='favorites_foods' and policyname='favorites_foods_ins_own') then
    create policy favorites_foods_ins_own on public.favorites_foods
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='favorites_foods' and policyname='favorites_foods_upd_own') then
    create policy favorites_foods_upd_own on public.favorites_foods
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='favorites_foods' and policyname='favorites_foods_del_own') then
    create policy favorites_foods_del_own on public.favorites_foods
      for delete using (auth.uid() = user_id);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='favorites_exercises' and policyname='favorites_exercises_select_own') then
    create policy favorites_exercises_select_own on public.favorites_exercises
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='favorites_exercises' and policyname='favorites_exercises_ins_own') then
    create policy favorites_exercises_ins_own on public.favorites_exercises
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='favorites_exercises' and policyname='favorites_exercises_upd_own') then
    create policy favorites_exercises_upd_own on public.favorites_exercises
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='favorites_exercises' and policyname='favorites_exercises_del_own') then
    create policy favorites_exercises_del_own on public.favorites_exercises
      for delete using (auth.uid() = user_id);
  end if;
end$$;
