-- phases
create table if not exists public.phases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('cut','maintain','bulk')),
  start_date date not null,
  end_date date,
  kcal int not null,
  protein_g int not null,
  carbs_g int not null,
  fat_g int not null,
  refeed boolean default false,
  diet_break boolean default false,
  created_at timestamptz not null default now()
);

-- recipes
create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  servings int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_items (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id),
  qty_units numeric not null
);

-- habits
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  key text not null, -- 'steps','sleep_h','fiber_servings','alcohol_free'
  target numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  key text not null,
  date date not null,
  value numeric not null,
  unique (user_id, key, date)
);
