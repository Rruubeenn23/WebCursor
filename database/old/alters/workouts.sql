-- =========================
-- 041_alter_workouts.sql
-- Bring workouts/workout_exercises in sync with app code
-- =========================

-- Add columns on workouts if missing
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_gym BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_boxing BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Ensure NOT NULL on date (since we provide DEFAULT)
ALTER TABLE public.workouts
  ALTER COLUMN date SET NOT NULL;

-- Rename rest_sec -> rest_seconds if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workout_exercises' AND column_name='rest_sec'
  ) THEN
    ALTER TABLE public.workout_exercises RENAME COLUMN rest_sec TO rest_seconds;
  END IF;
END$$;

-- Add columns if any are missing on workout_exercises (no-ops if already there)
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS sets INTEGER,
  ADD COLUMN IF NOT EXISTS reps INTEGER,
  ADD COLUMN IF NOT EXISTS rir INTEGER,
  ADD COLUMN IF NOT EXISTS rest_seconds INTEGER;

-- Defensive: backfill date on insert if null
CREATE OR REPLACE FUNCTION public.workouts_fill_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.date IS NULL THEN
    NEW.date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_workouts_fill_date') THEN
    CREATE TRIGGER tg_workouts_fill_date
    BEFORE INSERT ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION public.workouts_fill_date();
  END IF;
END$$;
