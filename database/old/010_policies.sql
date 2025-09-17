-- =========================
-- 010_policies.sql
-- Safe, idempotent RLS + policies
-- =========================

-- Enable RLS on all relevant tables (idempotent)
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plan_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_meals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins           ENABLE ROW LEVEL SECURITY;

-- Helper to check if a policy exists (Postgres 13+ uses policyname)
-- We'll just use IF NOT EXISTS queries against pg_policies.
-- Note: CREATE POLICY doesn't support IF NOT EXISTS directly.

-- ========== public.users ==========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='users_insert_own'
  ) THEN
    CREATE POLICY users_insert_own ON public.users
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='users_select_own'
  ) THEN
    CREATE POLICY users_select_own ON public.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='users_update_own'
  ) THEN
    CREATE POLICY users_update_own ON public.users
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END$$;

-- ========== public.foods (read-only for authenticated) ==========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='foods' AND policyname='foods_select_auth'
  ) THEN
    CREATE POLICY foods_select_auth ON public.foods
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- ========== public.exercises (read-only for authenticated) ==========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='exercises' AND policyname='exercises_select_auth'
  ) THEN
    CREATE POLICY exercises_select_auth ON public.exercises
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- ========== Tables with user_id ownership (one ALL policy each) ==========
-- goals, meal_templates, day_plans, day_plan_items, logs_meals, workouts,
-- water_logs, schedule, checkins

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goals' AND policyname='goals_all_own'
  ) THEN
    CREATE POLICY goals_all_own ON public.goals
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='meal_templates' AND policyname='meal_templates_all_own'
  ) THEN
    CREATE POLICY meal_templates_all_own ON public.meal_templates
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='day_plans' AND policyname='day_plans_all_own'
  ) THEN
    CREATE POLICY day_plans_all_own ON public.day_plans
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='day_plan_items' AND policyname='day_plan_items_all_own'
  ) THEN
    CREATE POLICY day_plan_items_all_own ON public.day_plan_items
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='logs_meals' AND policyname='logs_meals_all_own'
  ) THEN
    CREATE POLICY logs_meals_all_own ON public.logs_meals
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workouts' AND policyname='workouts_all_own'
  ) THEN
    CREATE POLICY workouts_all_own ON public.workouts
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='water_logs' AND policyname='water_logs_all_own'
  ) THEN
    CREATE POLICY water_logs_all_own ON public.water_logs
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='schedule' AND policyname='schedule_all_own'
  ) THEN
    CREATE POLICY schedule_all_own ON public.schedule
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='checkins' AND policyname='checkins_all_own'
  ) THEN
    CREATE POLICY checkins_all_own ON public.checkins
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- ========== Link tables without user_id (enforce ownership via parent) ==========
-- meal_template_items -> meal_templates(user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='meal_template_items' AND policyname='meal_template_items_all_own_via_template'
  ) THEN
    CREATE POLICY meal_template_items_all_own_via_template ON public.meal_template_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.meal_templates t
          WHERE t.id = meal_template_items.template_id
            AND t.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.meal_templates t
          WHERE t.id = meal_template_items.template_id
            AND t.user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- workout_exercises -> workouts(user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workout_exercises' AND policyname='workout_exercises_all_own_via_workout'
  ) THEN
    CREATE POLICY workout_exercises_all_own_via_workout ON public.workout_exercises
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.workouts w
          WHERE w.id = workout_exercises.workout_id
            AND w.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workouts w
          WHERE w.id = workout_exercises.workout_id
            AND w.user_id = auth.uid()
        )
      );
  END IF;
END$$;
