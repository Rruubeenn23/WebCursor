-- Fitness and Nutrition schema for Supabase
-- This script creates all tables, views, functions and policies used by the app.

-- Extensions -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Types ----------------------------------------------------------------------
CREATE TYPE day_item_entry_type AS ENUM ('food', 'quick');

-- Helper functions -----------------------------------------------------------
CREATE OR REPLACE FUNCTION estimate_1rm(weight_kg NUMERIC, reps INT)
RETURNS NUMERIC AS $$
  SELECT CASE
           WHEN weight_kg IS NULL OR reps IS NULL THEN NULL
           WHEN reps = 1 THEN weight_kg
           ELSE ROUND(weight_kg * (1 + reps::NUMERIC / 30), 2)
         END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tables ---------------------------------------------------------------------

-- Users (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  tz TEXT NOT NULL DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nutrition goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  kcal_target INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  weight_target NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foods
CREATE TABLE public.foods (
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

-- Meal templates
CREATE TABLE public.meal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal template items
CREATE TABLE public.meal_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.meal_templates(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  qty_units NUMERIC NOT NULL,
  time_hint TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Day plans
CREATE TABLE public.day_plans (
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
-- Day plan items
CREATE TABLE public.day_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_plan_id UUID NOT NULL REFERENCES public.day_plans(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
  qty_units NUMERIC NOT NULL,
  time TIME NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  entry_type day_item_entry_type NOT NULL DEFAULT 'food',
  macros_override JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Food favourites
CREATE TABLE public.food_favorites (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  uses INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, food_id)
);

-- Workouts
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_gym BOOLEAN DEFAULT FALSE,
  is_boxing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle TEXT NOT NULL,
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')::DATE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rpe_session NUMERIC,
  bodyweight_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session sets
CREATE TABLE public.session_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL,
  weight_kg NUMERIC,
  reps INTEGER,
  rir NUMERIC,
  is_warmup BOOLEAN NOT NULL DEFAULT FALSE,
  is_backoff BOOLEAN NOT NULL DEFAULT FALSE,
  seconds_rest INTEGER,
  tonnage_kg NUMERIC GENERATED ALWAYS AS ((COALESCE(weight_kg,0) * COALESCE(reps,0))::NUMERIC) STORED,
  est_1rm_kg NUMERIC GENERATED ALWAYS AS (estimate_1rm(weight_kg, reps)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);




-- Workout exercises
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rir INTEGER DEFAULT 2,
  rest_seconds INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schedule
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  meal_template_id UUID REFERENCES public.meal_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal logs
CREATE TABLE public.logs_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  qty_units NUMERIC NOT NULL,
  meal_type TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly check-ins
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  sleep_h NUMERIC,
  hunger_1_5 INT CHECK (hunger_1_5 BETWEEN 1 AND 5),
  energy_1_5 INT CHECK (energy_1_5 BETWEEN 1 AND 5),
  stress_1_5 INT CHECK (stress_1_5 BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);





-- Exercise personal records
CREATE TABLE public.exercise_prs (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  best_est_1rm_kg NUMERIC,
  session_id UUID REFERENCES public.workout_sessions(id),
  session_set_id UUID REFERENCES public.session_sets(id),
  pr_type TEXT,
  value_numeric NUMERIC,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  best_weight_kg NUMERIC,
  best_reps INTEGER,
  PRIMARY KEY (user_id, exercise_id)
);

-- Indexes --------------------------------------------------------------------
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_foods_name ON public.foods(name);
CREATE INDEX idx_meal_templates_user_id ON public.meal_templates(user_id);
CREATE INDEX idx_meal_template_items_template_id ON public.meal_template_items(template_id);
CREATE INDEX idx_day_plans_user_id ON public.day_plans(user_id);
CREATE INDEX idx_day_plan_items_day_plan_id ON public.day_plan_items(day_plan_id);
CREATE INDEX idx_food_fav_user_id ON public.food_favorites(user_id);
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_schedule_user_day ON public.schedule(user_id, day_of_week);
CREATE INDEX idx_logs_meals_user_logged_at ON public.logs_meals(user_id, logged_at);
CREATE INDEX idx_checkins_user_week ON public.checkins(user_id, week_start);
CREATE INDEX idx_sessions_user_date ON public.workout_sessions(user_id, session_date);
CREATE INDEX idx_session_sets_session_id ON public.session_sets(session_id);
CREATE INDEX idx_exercise_prs_user ON public.exercise_prs(user_id);

-- Triggers -------------------------------------------------------------------
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_foods_updated BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_meal_templates_updated BEFORE UPDATE ON public.meal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_meal_template_items_updated BEFORE UPDATE ON public.meal_template_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_day_plans_updated BEFORE UPDATE ON public.day_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_day_plan_items_updated BEFORE UPDATE ON public.day_plan_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_workouts_updated BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_exercises_updated BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_workout_exercises_updated BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_schedule_updated BEFORE UPDATE ON public.schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_logs_meals_updated BEFORE UPDATE ON public.logs_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_workout_sessions_updated BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_session_sets_updated BEFORE UPDATE ON public.session_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to maintain food favourites
CREATE OR REPLACE FUNCTION public.tg_upsert_food_favorite()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NEW.entry_type <> 'food' OR NEW.food_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT dp.user_id INTO v_user_id
  FROM public.day_plans dp
  WHERE dp.id = NEW.day_plan_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.food_favorites (user_id, food_id, uses, last_used_at)
  VALUES (v_user_id, NEW.food_id, 1, NOW())
  ON CONFLICT (user_id, food_id)
  DO UPDATE SET uses = food_favorites.uses + 1,
                last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_upsert_food_favorite
AFTER INSERT ON public.day_plan_items
FOR EACH ROW EXECUTE FUNCTION public.tg_upsert_food_favorite();

-- Views ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_weekly_load AS
SELECT
  ws.user_id,
  date_trunc('week', ws.started_at)::date AS week_start,
  count(DISTINCT ws.id) AS sessions,
  COALESCE(count(ss.id), 0)::int AS sets,
  COALESCE(sum((ss.weight_kg)::numeric * (ss.reps)::numeric), 0)::numeric AS tonnage_kg
FROM public.workout_sessions ws
LEFT JOIN public.session_sets ss ON ss.session_id = ws.id
GROUP BY 1, 2;

CREATE OR REPLACE VIEW public.v_weekly_load_exercise AS
SELECT
  ws.user_id,
  date_trunc('week', ws.started_at)::date AS week_start,
  ss.exercise_id,
  COALESCE(sum((ss.weight_kg)::numeric * (ss.reps)::numeric), 0)::numeric AS tonnage_kg,
  count(ss.id) AS sets
FROM public.workout_sessions ws
JOIN public.session_sets ss ON ss.session_id = ws.id
GROUP BY 1, 2, 3;

-- RPCs -----------------------------------------------------------------------

-- Weekly adherence summary
CREATE OR REPLACE FUNCTION public.adherence_weekly(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  planned_items INT,
  done_items INT,
  percent_done NUMERIC,
  kcal_avg_delta NUMERIC,
  protein_days_ok INT,
  days_logged INT
) AS $$
WITH days AS (
  SELECT generate_series(p_week_start, p_week_start + INTERVAL '6 day', INTERVAL '1 day')::date AS d
),
goals AS (
  SELECT g.kcal_target AS kcal_goal,
         g.protein_g AS protein_goal
  FROM public.goals g
  WHERE g.user_id = p_user_id
  LIMIT 1
),
plans AS (
  SELECT dp.id, dp.date
  FROM public.day_plans dp
  JOIN days ON days.d = dp.date
  WHERE dp.user_id = p_user_id
),
items AS (
  SELECT dpi.*, p.date AS plan_date
  FROM public.day_plan_items dpi
  JOIN plans p ON p.id = dpi.day_plan_id
),
items_macros AS (
  SELECT
    i.id,
    i.plan_date,
    i.done,
    CASE
      WHEN i.entry_type = 'quick' THEN (i.macros_override->>'kcal')::numeric
      ELSE COALESCE(f.kcal,0) * COALESCE(i.qty_units,0)
    END AS kcal,
    CASE
      WHEN i.entry_type = 'quick' THEN (i.macros_override->>'protein')::numeric
      ELSE COALESCE(f.protein_g,0) * COALESCE(i.qty_units,0)
    END AS protein
  FROM items i
  LEFT JOIN public.foods f ON f.id = i.food_id
),
totals_by_day AS (
  SELECT plan_date::date AS d,
         COUNT(*) AS planned,
         COUNT(*) FILTER (WHERE done) AS done,
         SUM(kcal) FILTER (WHERE done) AS kcal_done,
         SUM(protein) FILTER (WHERE done) AS protein_done
  FROM items_macros
  GROUP BY plan_date
),
rollup AS (
  SELECT COALESCE(SUM(planned),0) AS planned_items,
         COALESCE(SUM(done),0) AS done_items
  FROM totals_by_day
),
per_day_delta AS (
  SELECT t.d,
         (t.kcal_done - g.kcal_goal)::numeric AS kcal_delta,
         CASE WHEN t.protein_done >= g.protein_goal * 0.9 THEN 1 ELSE 0 END AS protein_ok
  FROM totals_by_day t
  CROSS JOIN goals g
  WHERE t.done > 0
)
SELECT
  r.planned_items,
  r.done_items,
  CASE WHEN r.planned_items > 0
       THEN ROUND((r.done_items::numeric * 100.0 / r.planned_items)::numeric, 1)
       ELSE NULL END AS percent_done,
  CASE WHEN (SELECT COUNT(*) FROM per_day_delta) > 0
       THEN ROUND(AVG(per_day_delta.kcal_delta)::numeric, 1)
       ELSE NULL END AS kcal_avg_delta,
  COALESCE(SUM(per_day_delta.protein_ok), 0) AS protein_days_ok,
  (SELECT COUNT(*) FROM per_day_delta) AS days_logged
FROM rollup r
LEFT JOIN per_day_delta ON TRUE
GROUP BY r.planned_items, r.done_items;
$$ LANGUAGE sql STABLE;

-- Apply a meal template to a day
CREATE OR REPLACE FUNCTION public.apply_meal_template(
  p_user_id UUID,
  p_template_id UUID,
  p_date DATE,
  p_time_strategy TEXT DEFAULT 'keep'
)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_start TIME := TIME '08:00';
BEGIN
  SELECT id INTO v_plan_id FROM public.day_plans
  WHERE user_id = p_user_id AND date = p_date;

  IF v_plan_id IS NULL THEN
    INSERT INTO public.day_plans(user_id, date, template_id)
    VALUES (p_user_id, p_date, p_template_id)
    RETURNING id INTO v_plan_id;
  ELSE
    DELETE FROM public.day_plan_items WHERE day_plan_id = v_plan_id;
    UPDATE public.day_plans SET template_id = p_template_id WHERE id = v_plan_id;
  END IF;

  INSERT INTO public.day_plan_items (day_plan_id, food_id, qty_units, time, entry_type)
  SELECT
    v_plan_id,
    mti.food_id,
    mti.qty_units,
    CASE
      WHEN p_time_strategy = 'spread' THEN v_start + (ROW_NUMBER() OVER (ORDER BY mti.time_hint) - 1) * INTERVAL '2 hour'
      ELSE COALESCE(mti.time_hint, v_start + (ROW_NUMBER() OVER (ORDER BY mti.time_hint) - 1) * INTERVAL '2 hour')
    END,
    'food'
  FROM public.meal_template_items mti
  WHERE mti.template_id = p_template_id
  ORDER BY mti.time_hint;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql;

-- Copy a day plan to another date
CREATE OR REPLACE FUNCTION public.copy_day_plan(
  p_user_id UUID,
  p_from DATE,
  p_to DATE,
  p_keep_times BOOLEAN DEFAULT TRUE,
  p_keep_done BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_src UUID;
  v_dest UUID;
BEGIN
  SELECT id INTO v_src FROM public.day_plans
  WHERE user_id = p_user_id AND date = p_from;
  IF v_src IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_dest FROM public.day_plans
  WHERE user_id = p_user_id AND date = p_to;
  IF v_dest IS NULL THEN
    INSERT INTO public.day_plans(user_id, date, training_day, notes, template_id)
    SELECT user_id, p_to, training_day, notes, template_id
    FROM public.day_plans WHERE id = v_src
    RETURNING id INTO v_dest;
  ELSE
    DELETE FROM public.day_plan_items WHERE day_plan_id = v_dest;
    UPDATE public.day_plans dp
      SET training_day = src.training_day,
          notes = src.notes,
          template_id = src.template_id
    FROM (SELECT training_day, notes, template_id FROM public.day_plans WHERE id = v_src) src
    WHERE dp.id = v_dest;
  END IF;

  INSERT INTO public.day_plan_items (day_plan_id, food_id, qty_units, time, done, entry_type, macros_override)
  SELECT
    v_dest,
    food_id,
    qty_units,
    CASE WHEN p_keep_times THEN time
         ELSE TIME '08:00' + (ROW_NUMBER() OVER (ORDER BY time) - 1) * INTERVAL '2 hour' END,
    CASE WHEN p_keep_done THEN done ELSE FALSE END,
    entry_type,
    macros_override
  FROM public.day_plan_items
  WHERE day_plan_id = v_src
  ORDER BY time;

  RETURN v_dest;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security ---------------------------------------------------------
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plan_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_favorites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_meals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_prs    ENABLE ROW LEVEL SECURITY;

-- RLS policies (representative set)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users manage own goals" ON public.goals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated view foods" ON public.foods
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert foods" ON public.foods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users manage own meal templates" ON public.meal_templates
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own meal template items" ON public.meal_template_items
  USING (
    EXISTS (SELECT 1 FROM public.meal_templates mt WHERE mt.id = template_id AND mt.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.meal_templates mt WHERE mt.id = template_id AND mt.user_id = auth.uid())
  );

CREATE POLICY "Users manage own day plans" ON public.day_plans
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own day plan items" ON public.day_plan_items
  USING (
    EXISTS (SELECT 1 FROM public.day_plans dp WHERE dp.id = day_plan_id AND dp.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.day_plans dp WHERE dp.id = day_plan_id AND dp.user_id = auth.uid())
  );

CREATE POLICY "Users manage own food favorites" ON public.food_favorites
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own workouts" ON public.workouts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated view exercises" ON public.exercises
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users manage own workout exercises" ON public.workout_exercises
  USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
  );

CREATE POLICY "Users manage own schedule" ON public.schedule
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own meal logs" ON public.logs_meals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own checkins" ON public.checkins
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own workout sessions" ON public.workout_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own session sets" ON public.session_sets
  USING (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid())
  );

CREATE POLICY "Users manage own exercise PRs" ON public.exercise_prs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

