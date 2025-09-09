-- Create water_logs table
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for water_logs
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_logs_select_own" 
  ON public.water_logs FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "water_logs_insert_own" 
  ON public.water_logs FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "water_logs_update_own" 
  ON public.water_logs FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "water_logs_delete_own" 
  ON public.water_logs FOR DELETE 
  USING (user_id = auth.uid());

-- Ensure goals table has the correct columns
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS carbs INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protein INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fat INTEGER NOT NULL DEFAULT 0;
