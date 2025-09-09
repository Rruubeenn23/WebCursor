-- =========================
-- 010_policies.sql
-- =========================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies defensively
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname, schemaname, tablename FROM pg_policies WHERE schemaname='public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.polname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- users
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- goals
CREATE POLICY goals_all_own ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- foods (read for authenticated; insert allowed for authenticated to keep current UX)
CREATE POLICY foods_select_all_auth ON public.foods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY foods_insert_auth ON public.foods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY foods_update_none ON public.foods
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY foods_delete_none ON public.foods
  FOR DELETE TO authenticated USING (false);

-- meal_templates
CREATE POLICY meal_templates_all_own ON public.meal_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- meal_template_items (by template ownership)
CREATE POLICY meal_template_items_all_own ON public.meal_template_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.meal_templates t WHERE t.id = template_id AND t.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.meal_templates t WHERE t.id = template_id AND t.user_id = auth.uid())
  );

-- day_plans
CREATE POLICY day_plans_all_own ON public.day_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- day_plan_items
CREATE POLICY day_plan_items_all_own ON public.day_plan_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- logs_meals
CREATE POLICY logs_meals_all_own ON public.logs_meals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- exercises (read/insert authenticated, similar to foods)
CREATE POLICY exercises_select_auth ON public.exercises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY exercises_insert_auth ON public.exercises
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY exercises_update_none ON public.exercises
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY exercises_delete_none ON public.exercises
  FOR DELETE TO authenticated USING (false);

-- workouts
CREATE POLICY workouts_all_own ON public.workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- workout_exercises (by workout ownership)
CREATE POLICY workout_exercises_all_own ON public.workout_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
  );

-- water_logs
CREATE POLICY water_logs_all_own ON public.water_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- schedule
CREATE POLICY schedule_all_own ON public.schedule
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- checkins
CREATE POLICY checkins_all_own ON public.checkins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
