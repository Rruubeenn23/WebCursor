-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  weight_kg numeric,
  waist_cm numeric,
  sleep_h numeric,
  hunger_1_5 integer CHECK (hunger_1_5 >= 1 AND hunger_1_5 <= 5),
  energy_1_5 integer CHECK (energy_1_5 >= 1 AND energy_1_5 <= 5),
  stress_1_5 integer CHECK (stress_1_5 >= 1 AND stress_1_5 <= 5),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT checkins_pkey PRIMARY KEY (id),
  CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.day_plan_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  day_plan_id uuid NOT NULL,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  meal_time time without time zone NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  entry_type text,
  time time without time zone,
  macros_override jsonb,
  CONSTRAINT day_plan_items_pkey PRIMARY KEY (id),
  CONSTRAINT day_plan_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id),
  CONSTRAINT day_plan_items_day_plan_id_fkey FOREIGN KEY (day_plan_id) REFERENCES public.day_plans(id)
);
CREATE TABLE public.day_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  template_id uuid,
  training_day boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT day_plans_pkey PRIMARY KEY (id),
  CONSTRAINT day_plans_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.meal_templates(id),
  CONSTRAINT day_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.exercise_prs (
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  best_est_1rm_kg numeric,
  session_id uuid,
  session_set_id uuid,
  achieved_at timestamp with time zone NOT NULL DEFAULT now(),
  best_weight_kg numeric,
  best_reps integer,
  CONSTRAINT exercise_prs_pkey PRIMARY KEY (user_id, exercise_id),
  CONSTRAINT exercise_prs_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT exercise_prs_session_set_id_fkey FOREIGN KEY (session_set_id) REFERENCES public.session_sets(id),
  CONSTRAINT exercise_prs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id)
);
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  muscle text NOT NULL,
  default_sets integer NOT NULL DEFAULT 3,
  default_reps integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exercises_pkey PRIMARY KEY (id)
);
CREATE TABLE public.foods (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  kcal integer NOT NULL,
  protein_g integer NOT NULL,
  carbs_g integer NOT NULL,
  fat_g integer NOT NULL,
  unit text NOT NULL,
  grams_per_unit integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT foods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  kcal_target integer NOT NULL,
  protein_g integer NOT NULL,
  carbs_g integer NOT NULL,
  fat_g integer NOT NULL,
  weight_target numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.logs_meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  meal_type text NOT NULL,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT logs_meals_pkey PRIMARY KEY (id),
  CONSTRAINT logs_meals_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id),
  CONSTRAINT logs_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.meal_template_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  time_hint time without time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  meal_time time without time zone,
  CONSTRAINT meal_template_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_template_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.meal_templates(id),
  CONSTRAINT meal_template_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
);
CREATE TABLE public.meal_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  CONSTRAINT meal_templates_pkey PRIMARY KEY (id),
  CONSTRAINT meal_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.schedule (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  workout_id uuid,
  meal_template_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schedule_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_meal_template_id_fkey FOREIGN KEY (meal_template_id) REFERENCES public.meal_templates(id),
  CONSTRAINT schedule_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id),
  CONSTRAINT schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.session_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  set_index integer NOT NULL,
  weight_kg numeric,
  reps integer,
  rir numeric,
  is_warmup boolean NOT NULL DEFAULT false,
  is_backoff boolean NOT NULL DEFAULT false,
  seconds_rest integer,
  tonnage_kg numeric DEFAULT (COALESCE(weight_kg, (0)::numeric) * (COALESCE(reps, 0))::numeric),
  est_1rm_kg numeric DEFAULT estimate_1rm(weight_kg, reps),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT session_sets_pkey PRIMARY KEY (id),
  CONSTRAINT session_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT session_sets_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  tz text NOT NULL DEFAULT 'Europe/Madrid'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.workout_exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  workout_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  "order" integer NOT NULL,
  sets integer NOT NULL,
  reps integer NOT NULL,
  rir integer DEFAULT 2,
  rest_seconds integer DEFAULT 90,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id),
  CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_id uuid,
  session_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc'::text))::date,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  rpe_session numeric,
  bodyweight_kg numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT workout_sessions_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id)
);

-- Weekly aggregates used by /api/reports/weekly
create or replace view public.v_weekly_load as
select
  ws.user_id,
  date_trunc('week', ws.started_at)::date as week_start,
  count(distinct ws.id) as sessions,
  coalesce(count(ss.id), 0)::int as sets,
  coalesce(sum((ss.weight_kg)::numeric * (ss.reps)::numeric), 0)::numeric as tonnage_kg
from public.workout_sessions ws
left join public.session_sets ss on ss.session_id = ws.id
group by 1, 2;

create or replace view public.v_weekly_load_exercise as
select
  ws.user_id,
  date_trunc('week', ws.started_at)::date as week_start,
  ss.exercise_id,
  coalesce(sum((ss.weight_kg)::numeric * (ss.reps)::numeric), 0)::numeric as tonnage_kg,
  count(ss.id) as sets
from public.workout_sessions ws
join public.session_sets ss on ss.session_id = ws.id
group by 1, 2, 3;

-- Note: enforce RLS on base tables (workout_sessions, session_sets).
-- Views will respect RLS when queries filter by user_id implicitly via the session client.
CREATE TABLE public.workouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_gym boolean DEFAULT false,
  is_boxing boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workouts_pkey PRIMARY KEY (id),
  CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);