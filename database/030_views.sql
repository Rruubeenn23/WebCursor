-- =========================
-- 020_views.sql
-- Aggregation views used by the app
-- =========================

-- v_daily_totals
-- Per-user, per-day totals across meals, water, and workouts.
-- - Meals: sums macros from logs_meals joined to foods.
-- - Water: sums amount_ml by date(created_at).
-- - Workouts: counts workouts per day.
-- The view exposes (user_id, day) so client can filter:
--   .../v_daily_totals?user_id=eq.<uuid>&day=gte.<YYYY-MM-DD>&day=lte.<YYYY-MM-DD>
CREATE OR REPLACE VIEW public.v_daily_totals AS
WITH days AS (
  -- any day that appears in any contributing table for that user
  SELECT user_id, date AS day FROM public.logs_meals
  UNION
  SELECT user_id, date(created_at) AS day FROM public.water_logs
  UNION
  SELECT user_id, date AS day FROM public.workouts
  UNION
  SELECT user_id, date AS day FROM public.day_plans
),
meal_totals AS (
  SELECT
    lm.user_id,
    lm.date AS day,
    COALESCE(SUM(lm.qty_units * f.kcal), 0)::int                 AS kcal_total,
    COALESCE(SUM(lm.qty_units * f.protein_g), 0)::int            AS protein_g_total,
    COALESCE(SUM(lm.qty_units * f.carbs_g), 0)::int              AS carbs_g_total,
    COALESCE(SUM(lm.qty_units * f.fat_g), 0)::int                AS fat_g_total
  FROM public.logs_meals lm
  JOIN public.foods f ON f.id = lm.food_id
  GROUP BY lm.user_id, lm.date
),
water_totals AS (
  SELECT
    user_id,
    date(created_at) AS day,
    COALESCE(SUM(amount_ml), 0)::int AS water_ml_total
  FROM public.water_logs
  GROUP BY user_id, date(created_at)
),
workout_totals AS (
  SELECT
    user_id,
    date AS day,
    COUNT(*)::int AS workouts_count
  FROM public.workouts
  GROUP BY user_id, date
)
SELECT
  d.user_id,
  d.day,
  COALESCE(m.kcal_total, 0)        AS kcal_total,
  COALESCE(m.protein_g_total, 0)   AS protein_g_total,
  COALESCE(m.carbs_g_total, 0)     AS carbs_g_total,
  COALESCE(m.fat_g_total, 0)       AS fat_g_total,
  COALESCE(w.water_ml_total, 0)    AS water_ml_total,
  COALESCE(wo.workouts_count, 0)   AS workouts_count
FROM days d
LEFT JOIN meal_totals   m  ON m.user_id = d.user_id AND m.day  = d.day
LEFT JOIN water_totals  w  ON w.user_id = d.user_id AND w.day  = d.day
LEFT JOIN workout_totals wo ON wo.user_id = d.user_id AND wo.day = d.day;

-- Helpful (non-unique) index for common filters via RLS planner
-- (On views, you can't index directly; index base tables are already added in 000_init.sql.)
-- Nothing to add here.
