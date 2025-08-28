-- 1) ENUM para tipos de item del plan
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_item_entry_type') THEN
    CREATE TYPE day_item_entry_type AS ENUM ('food', 'quick');
  END IF;
END $$;

-- 2) Extensiones necesarias (por si acaso)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3) Tabla CHECKINS (un check-in por semana)
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- lunes de esa semana (ISO)
  weight_kg NUMERIC(6,2),
  waist_cm NUMERIC(6,2),
  sleep_h NUMERIC(4,2),
  hunger_1_5 INT CHECK (hunger_1_5 BETWEEN 1 AND 5),
  energy_1_5 INT CHECK (energy_1_5 BETWEEN 1 AND 5),
  stress_1_5 INT CHECK (stress_1_5 BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para checkins
DROP POLICY IF EXISTS "checkins_select_own" ON public.checkins;
CREATE POLICY "checkins_select_own"
  ON public.checkins FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "checkins_insert_own" ON public.checkins;
CREATE POLICY "checkins_insert_own"
  ON public.checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checkins_update_own" ON public.checkins;
CREATE POLICY "checkins_update_own"
  ON public.checkins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checkins_delete_own" ON public.checkins;
CREATE POLICY "checkins_delete_own"
  ON public.checkins FOR DELETE
  USING (user_id = auth.uid());

-- 4) day_plan_items: soporte entradas rápidas por macros
ALTER TABLE public.day_plan_items
  ADD COLUMN IF NOT EXISTS entry_type day_item_entry_type NOT NULL DEFAULT 'food',
  ADD COLUMN IF NOT EXISTS macros_override JSONB NULL; -- {kcal, protein, carbs, fat}

-- 5) Tabla de favoritos de alimentos
CREATE TABLE IF NOT EXISTS public.food_favorites (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  uses INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, food_id)
);

ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para favoritos
DROP POLICY IF EXISTS "food_fav_select_own" ON public.food_favorites;
CREATE POLICY "food_fav_select_own"
  ON public.food_favorites FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "food_fav_insert_own" ON public.food_favorites;
CREATE POLICY "food_fav_insert_own"
  ON public.food_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "food_fav_update_own" ON public.food_favorites;
CREATE POLICY "food_fav_update_own"
  ON public.food_favorites FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "food_fav_delete_own" ON public.food_favorites;
CREATE POLICY "food_fav_delete_own"
  ON public.food_favorites FOR DELETE
  USING (user_id = auth.uid());

-- 6) Trigger: al insertar item FOOD, actualizar favoritos
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
  DO UPDATE SET uses = public.food_favorites.uses + 1,
                last_used_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_upsert_food_favorite ON public.day_plan_items;
CREATE TRIGGER trg_upsert_food_favorite
AFTER INSERT ON public.day_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.tg_upsert_food_favorite();

-- 7) RPC: adherencia semanal básica
--   - % items completados en la semana
--   - kcal_avg_delta: media diaria (kcal_consumidas - goal.kcal)
--   - protein_days_ok: días con proteína >= goal.protein * 0.9
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
  SELECT COALESCE(g.kcal, 2000) AS kcal_goal,
         COALESCE(g.protein, 150) AS protein_goal
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
  SELECT dpi.*,
         p.date AS plan_date
  FROM public.day_plan_items dpi
  JOIN plans p ON p.id = dpi.day_plan_id
),
items_macros AS (
  SELECT
    i.id,
    i.plan_date,
    i.done,
    i.entry_type,
    CASE
      WHEN i.entry_type = 'quick' THEN (i.macros_override->>'kcal')::numeric
      ELSE COALESCE(f.kcal, 0) * COALESCE(i.qty_units, 0)
    END AS kcal,
    CASE
      WHEN i.entry_type = 'quick' THEN (i.macros_override->>'protein')::numeric
      ELSE COALESCE(f.protein_g, 0) * COALESCE(i.qty_units, 0)
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
  SELECT
    COALESCE(SUM(planned), 0) AS planned_items,
    COALESCE(SUM(done), 0) AS done_items
  FROM totals_by_day
),
per_day_delta AS (
  SELECT
    t.d,
    (t.kcal_done - g.kcal_goal)::numeric AS kcal_delta,
    CASE WHEN t.protein_done >= g.protein_goal * 0.9 THEN 1 ELSE 0 END AS protein_ok
  FROM totals_by_day t
  CROSS JOIN goals g
  WHERE t.done > 0
)
SELECT
  r.planned_items,
  r.done_items,
  CASE WHEN r.planned_items > 0 THEN ROUND((r.done_items::numeric * 100.0 / r.planned_items)::numeric, 1) ELSE NULL END AS percent_done,
  CASE WHEN (SELECT COUNT(*) FROM per_day_delta) > 0
       THEN ROUND(AVG(per_day_delta.kcal_delta)::numeric, 1)
       ELSE NULL
  END AS kcal_avg_delta,
  COALESCE(SUM(per_day_delta.protein_ok), 0) AS protein_days_ok,
  (SELECT COUNT(*) FROM per_day_delta) AS days_logged
FROM rollup r
LEFT JOIN per_day_delta ON TRUE
GROUP BY r.planned_items, r.done_items;
$$ LANGUAGE sql STABLE;
