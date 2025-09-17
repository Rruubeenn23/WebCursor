-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can view foods" ON public.foods;
DROP POLICY IF EXISTS "Authenticated users can insert foods" ON public.foods;
DROP POLICY IF EXISTS "Users can manage their own meal templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can manage their own template items" ON public.meal_template_items;
DROP POLICY IF EXISTS "Users can manage their own day plans" ON public.day_plans;
DROP POLICY IF EXISTS "Users can manage their own day plan items" ON public.day_plan_items;
DROP POLICY IF EXISTS "Users can manage their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Authenticated users can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can manage their own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can manage their own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can manage their own meal logs" ON public.logs_meals;

-- Also drop any existing policies with generic names
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_meals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Goals policies
CREATE POLICY "Users can manage their own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- Foods policies (authenticated users can view and insert)
CREATE POLICY "Authenticated users can view foods" ON public.foods
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert foods" ON public.foods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Meal templates policies
CREATE POLICY "Users can manage their own meal templates" ON public.meal_templates
    FOR ALL USING (auth.uid() = user_id);

-- Meal template items policies
CREATE POLICY "Users can manage their own template items" ON public.meal_template_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.meal_templates 
            WHERE id = template_id AND user_id = auth.uid()
        )
    );

-- Day plans policies
CREATE POLICY "Users can manage their own day plans" ON public.day_plans
    FOR ALL USING (auth.uid() = user_id);

-- Day plan items policies
CREATE POLICY "Users can manage their own day plan items" ON public.day_plan_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.day_plans 
            WHERE id = day_plan_id AND user_id = auth.uid()
        )
    );

-- Workouts policies
CREATE POLICY "Users can manage their own workouts" ON public.workouts
    FOR ALL USING (auth.uid() = user_id);

-- Exercises policies (authenticated users can view and insert)
CREATE POLICY "Authenticated users can view exercises" ON public.exercises
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exercises" ON public.exercises
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Workout exercises policies
CREATE POLICY "Users can manage their own workout exercises" ON public.workout_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            WHERE id = workout_id AND user_id = auth.uid()
        )
    );

-- Schedule policies
CREATE POLICY "Users can manage their own schedule" ON public.schedule
    FOR ALL USING (auth.uid() = user_id);

-- Meal logs policies
CREATE POLICY "Users can manage their own meal logs" ON public.logs_meals
    FOR ALL USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
