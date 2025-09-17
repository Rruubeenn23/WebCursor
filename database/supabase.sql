-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.checkins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
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
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT checkins_pkey PRIMARY KEY (id),
  CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.day_plan_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  day_plan_id uuid NOT NULL,
  date date,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  unit text,
  time_hint time without time zone,
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  time time without time zone,
  entry_type text DEFAULT 'food'::text,
  macros_override jsonb,
  reminder_sent_at timestamp with time zone,
  CONSTRAINT day_plan_items_pkey PRIMARY KEY (id),
  CONSTRAINT day_plan_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT day_plan_items_day_plan_id_fkey FOREIGN KEY (day_plan_id) REFERENCES public.day_plans(id),
  CONSTRAINT day_plan_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
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
  CONSTRAINT day_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT day_plans_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.meal_templates(id)
);
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  muscle text NOT NULL,
  default_sets integer,
  default_reps integer,
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
  user_id uuid NOT NULL,
  kcal_target integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.habit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  date date NOT NULL,
  value numeric NOT NULL,
  CONSTRAINT habit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.habits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  target numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT habits_pkey PRIMARY KEY (id),
  CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.logs_meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT logs_meals_pkey PRIMARY KEY (id),
  CONSTRAINT logs_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT logs_meals_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
);
CREATE TABLE public.meal_template_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  time_hint time without time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meal_template_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_template_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.meal_templates(id),
  CONSTRAINT meal_template_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
);
CREATE TABLE public.meal_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meal_templates_pkey PRIMARY KEY (id),
  CONSTRAINT meal_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.phases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['cut'::text, 'maintain'::text, 'bulk'::text])),
  start_date date NOT NULL,
  end_date date,
  kcal integer NOT NULL,
  protein_g integer NOT NULL,
  carbs_g integer NOT NULL,
  fat_g integer NOT NULL,
  refeed boolean DEFAULT false,
  diet_break boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT phases_pkey PRIMARY KEY (id),
  CONSTRAINT phases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.recipe_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recipe_id uuid NOT NULL,
  food_id uuid NOT NULL,
  qty_units numeric NOT NULL,
  CONSTRAINT recipe_items_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_items_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id),
  CONSTRAINT recipe_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id)
);
CREATE TABLE public.recipes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  servings integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.schedule (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  kind text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schedule_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
CREATE TABLE public.water_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount_ml integer NOT NULL CHECK (amount_ml > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT water_logs_pkey PRIMARY KEY (id),
  CONSTRAINT water_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.workout_exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  workout_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  order_i integer NOT NULL DEFAULT 0,
  sets integer,
  reps integer,
  rir integer,
  rest_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id),
  CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.workouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  is_gym boolean DEFAULT false,
  is_boxing boolean DEFAULT false,
  CONSTRAINT workouts_pkey PRIMARY KEY (id),
  CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);