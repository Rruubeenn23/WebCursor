-- =========================
-- 040_alter_day_plan_items.sql
-- Bring day_plan_items in sync with app code
-- =========================

-- Add columns if missing
ALTER TABLE public.day_plan_items
  ADD COLUMN IF NOT EXISTS time TIME,
  ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'food',
  ADD COLUMN IF NOT EXISTS macros_override JSONB;

-- Make date nullable (UI doesn't pass it; we fill via trigger)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='day_plan_items' AND column_name='date' AND is_nullable='NO'
  ) THEN
    ALTER TABLE public.day_plan_items ALTER COLUMN date DROP NOT NULL;
  END IF;
END$$;

-- Fill user_id and date from parent day_plans on insert (so RLS + NOT NULL are satisfied)
CREATE OR REPLACE FUNCTION public.day_plan_items_fill_parent_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_date date;
BEGIN
  SELECT dp.user_id, dp.date INTO v_user_id, v_date
  FROM public.day_plans dp
  WHERE dp.id = NEW.day_plan_id;

  IF NEW.user_id IS NULL THEN
    NEW.user_id := v_user_id;
  END IF;

  IF NEW.date IS NULL THEN
    NEW.date := v_date;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_day_plan_items_fill_parent_fields') THEN
    CREATE TRIGGER tg_day_plan_items_fill_parent_fields
    BEFORE INSERT ON public.day_plan_items
    FOR EACH ROW EXECUTE FUNCTION public.day_plan_items_fill_parent_fields();
  END IF;
END$$;
