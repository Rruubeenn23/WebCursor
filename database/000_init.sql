-- =========================
-- 000_init.sql (Idempotent)
-- =========================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END$$;

-- Helper: estimate_1rm (example util)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'estimate_1rm') THEN
    CREATE OR REPLACE FUNCTION estimate_1rm(weight_kg NUMERIC, reps INT)
    RETURNS NUMERIC AS $$
      SELECT CASE
               WHEN weight_kg IS NULL OR reps IS NULL THEN NULL
               WHEN reps = 1 THEN weight_kg
               ELSE ROUND(weight_kg * (1 + reps::NUMERIC / 30), 2)
             END;
    $$ LANGUAGE sql IMMUTABLE;
  END IF;
END$$;

-- =========================
-- Tables (in dependency order)
-- =========================

-- users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  tz TEXT NOT NULL DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kcal_target INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- foods (shared authenticated catalog)
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kcal INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  unit TEXT NOT NULL,
  grams_per_unit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- meal_templates
CREATE TABLE IF NOT EXISTS public.meal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- meal_template_items
CREATE TABLE IF NOT EXISTS public.meal_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.meal_templates(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  qty_units NUMERIC NOT NULL,
  time_hint TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- day_plans
CREATE TABLE IF NOT EXISTS public.day_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  template_id UUID REFERENCES public.meal_templates(id) ON DELETE SET NULL,
  training_day BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- day_plan_items
CREATE TABLE IF NOT EXISTS public.day_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_plan_id UUID NOT NULL REFERENCES public.day_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  qty_units NUMERIC NOT NULL,
  unit TEXT,
  time_hint TIME,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- logs_meals (logged meals)
CREATE TABLE IF NOT EXISTS public.logs_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  qty_units NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- exercises
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle TEXT NOT NULL,
  default_sets INTEGER,
  default_reps INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- workouts
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- workout_exercises
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_i INTEGER NOT NULL DEFAULT 0,
  sets INTEGER,
  reps INTEGER,
  rir INTEGER,
  rest_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- water_logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ml INTEGER NOT NULL CHECK (ml > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- schedule (optional planning)
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kind TEXT NOT NULL, -- e.g., 'rest' | 'training' | 'high_carb'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- checkins
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  sleep_h NUMERIC,
  hunger_1_5 INTEGER CHECK (hunger_1_5 BETWEEN 1 AND 5),
  energy_1_5 INTEGER CHECK (energy_1_5 BETWEEN 1 AND 5),
  stress_1_5 INTEGER CHECK (stress_1_5 BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- =========================
-- Triggers
-- =========================

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_users_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_goals_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_foods_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_foods_updated_at BEFORE UPDATE ON public.foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_meal_templates_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_meal_templates_updated_at BEFORE UPDATE ON public.meal_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_meal_template_items_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_meal_template_items_updated_at BEFORE UPDATE ON public.meal_template_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_day_plans_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_day_plans_updated_at BEFORE UPDATE ON public.day_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_day_plan_items_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_day_plan_items_updated_at BEFORE UPDATE ON public.day_plan_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_exercises_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_exercises_updated_at BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_workouts_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_workouts_updated_at BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'tg_workout_exercises_updated_at';
  IF NOT FOUND THEN
    CREATE TRIGGER tg_workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =========================
-- ensure_user_exists trigger on auth.users
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email)
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  IF NOT FOUND THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- =========================
-- Indexes
-- =========================

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON public.meal_templates (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_template_items_template ON public.meal_template_items (template_id);
CREATE INDEX IF NOT EXISTS idx_day_plans_user_date ON public.day_plans (user_id, date);
CREATE INDEX IF NOT EXISTS idx_day_plan_items_user_date ON public.day_plan_items (user_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_meals_user_date ON public.logs_meals (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON public.workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_user_date ON public.schedule (user_id, date);
