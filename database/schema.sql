-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tz TEXT DEFAULT 'Europe/Madrid' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Goals table for nutrition targets
CREATE TABLE public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    kcal_target INTEGER NOT NULL,
    protein_g INTEGER NOT NULL,
    carbs_g INTEGER NOT NULL,
    fat_g INTEGER NOT NULL,
    weight_target NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Foods table (global food database)
CREATE TABLE public.foods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    kcal INTEGER NOT NULL,
    protein_g INTEGER NOT NULL,
    carbs_g INTEGER NOT NULL,
    fat_g INTEGER NOT NULL,
    unit TEXT NOT NULL,
    grams_per_unit INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meal templates
CREATE TABLE public.meal_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meal template items
CREATE TABLE public.meal_template_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES public.meal_templates(id) ON DELETE CASCADE NOT NULL,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
    qty_units NUMERIC NOT NULL,
    time_hint TIME,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Day plans
CREATE TABLE public.day_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    template_id UUID REFERENCES public.meal_templates(id) ON DELETE SET NULL,
    training_day BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

-- Day plan items
CREATE TABLE public.day_plan_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    day_plan_id UUID REFERENCES public.day_plans(id) ON DELETE CASCADE NOT NULL,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
    qty_units NUMERIC NOT NULL,
    time TIME NOT NULL,
    done BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workouts
CREATE TABLE public.workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_gym BOOLEAN DEFAULT false,
    is_boxing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Exercises (global exercise database)
CREATE TABLE public.exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    muscle TEXT NOT NULL,
    default_sets INTEGER DEFAULT 3 NOT NULL,
    default_reps INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workout exercises
CREATE TABLE public.workout_exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    exercise_order INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    rir INTEGER DEFAULT 2,
    rest_seconds INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Schedule
CREATE TABLE public.schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    meal_template_id UUID REFERENCES public.meal_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meal logs
CREATE TABLE public.logs_meals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
    qty_units DECIMAL(10,2) NOT NULL,
    meal_type TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_foods_name ON public.foods(name);
CREATE INDEX idx_meal_templates_user_id ON public.meal_templates(user_id);
CREATE INDEX idx_meal_template_items_template_id ON public.meal_template_items(template_id);
CREATE INDEX idx_meal_template_items_food_id ON public.meal_template_items(food_id);
CREATE INDEX idx_day_plans_user_id ON public.day_plans(user_id);
CREATE INDEX idx_day_plans_date ON public.day_plans(date);
CREATE INDEX idx_day_plan_items_day_plan_id ON public.day_plan_items(day_plan_id);
CREATE INDEX idx_day_plan_items_food_id ON public.day_plan_items(food_id);
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_exercises_muscle ON public.exercises(muscle);
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);
CREATE INDEX idx_schedule_user_id ON public.schedule(user_id);
CREATE INDEX idx_schedule_user_day ON public.schedule(user_id, day_of_week);
CREATE INDEX idx_logs_meals_user_logged_at ON public.logs_meals(user_id, logged_at);
CREATE INDEX idx_logs_meals_user_id ON public.logs_meals(user_id);

-- Enable Row Level Security (RLS)
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

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Foods policies (authenticated users can view and insert)
CREATE POLICY "Authenticated users can view foods" ON public.foods
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert foods" ON public.foods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Meal templates policies
CREATE POLICY "Users can view own meal templates" ON public.meal_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal templates" ON public.meal_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal templates" ON public.meal_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal templates" ON public.meal_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Meal template items policies
CREATE POLICY "Users can view own meal template items" ON public.meal_template_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meal_templates 
            WHERE id = template_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own meal template items" ON public.meal_template_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meal_templates 
            WHERE id = template_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own meal template items" ON public.meal_template_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.meal_templates 
            WHERE id = template_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own meal template items" ON public.meal_template_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.meal_templates 
            WHERE id = template_id AND user_id = auth.uid()
        )
    );

-- Day plans policies
CREATE POLICY "Users can view own day plans" ON public.day_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own day plans" ON public.day_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own day plans" ON public.day_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own day plans" ON public.day_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Day plan items policies
CREATE POLICY "Users can view own day plan items" ON public.day_plan_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.day_plans 
            WHERE id = day_plan_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own day plan items" ON public.day_plan_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.day_plans 
            WHERE id = day_plan_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own day plan items" ON public.day_plan_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.day_plans 
            WHERE id = day_plan_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own day plan items" ON public.day_plan_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.day_plans 
            WHERE id = day_plan_id AND user_id = auth.uid()
        )
    );

-- Workouts policies
CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (auth.uid() = user_id);

-- Exercises policies (authenticated users can view and insert)
CREATE POLICY "Authenticated users can view exercises" ON public.exercises
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exercises" ON public.exercises
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Workout exercises policies
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            WHERE id = workout_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own workout exercises" ON public.workout_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts 
            WHERE id = workout_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            WHERE id = workout_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            WHERE id = workout_id AND user_id = auth.uid()
        )
    );

-- Schedule policies
CREATE POLICY "Users can view own schedule" ON public.schedule
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule" ON public.schedule
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule" ON public.schedule
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule" ON public.schedule
    FOR DELETE USING (auth.uid() = user_id);

-- Meal logs policies
CREATE POLICY "Users can view own meal logs" ON public.logs_meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs" ON public.logs_meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs" ON public.logs_meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs" ON public.logs_meals
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON public.foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_templates_updated_at BEFORE UPDATE ON public.meal_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_template_items_updated_at BEFORE UPDATE ON public.meal_template_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_plans_updated_at BEFORE UPDATE ON public.day_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_plan_items_updated_at BEFORE UPDATE ON public.day_plan_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_updated_at BEFORE UPDATE ON public.schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
