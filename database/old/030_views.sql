-- =========================
-- 020_views.sql
-- Aggregation views used by the app
-- =========================

-- v_daily_totals
-- Per-user, per-day totals across meals (from day_plan_items), water, and workouts.
-- Meals include:
--   - Planned food items with `done = true` joined to foods
--   - Quick entries with `entry_type = 'quick'` and `macros_override` JSON
-- Water sums water_logs.amount_ml grouped by date(created_at)
-- Workouts counts workouts per day using COALESCE(workouts.date, date(created_at))
CREATE OR REPLACE VIEW public.v_daily_totals AS
WITH days AS (
  SELECT user_id, date AS day FROM public.day_plans
  UNION
  SELECT user_id, COALESCE(date, created_at::date) AS day FROM public.workouts
  UNION
  SELECT user_id, date(created_at) AS day FROM public.water_logs
  UNION
  SELECT dpi.user_id, dp.date AS day
  FROM public.day_plan_items dpi
  JOIN public.day_plans dp ON dp.id = dpi.day_plan_id
),
-- items that reference a concrete food and are marked done
meal_food_items AS (
  SELECT
    dpi.user_id,
    dp.date AS day,
    SUM((f.kcal * dpi.qty_units))::int            AS kcal_total,
    SUM((f.protein_g * dpi.qty_units))::int       AS protein_g_total,
    SUM((f.carbs_g * dpi.qty_units))::int         AS carbs_g_total,
    SUM((f.fat_g * dpi.qty_units))::int           AS fat_g_total
  FROM public.day_plan_items dpi
  JOIN public.day_plans dp ON dp.id = dpi.day_plan_id
  JOIN public.foods f ON f.id = dpi.food_id
  WHERE dpi.done IS TRUE
  GROUP BY dpi.user_id, dp.date
),
-- quick entries carrying macros_override JSON (kcal, protein, carbs, fat)
meal_quick_items AS (
  SELECT
    dpi.user_id,
    dp.date AS day,
    COALESCE(SUM( (dpi.macros_override->>'kcal')::numeric ), 0)::int            AS kcal_total,
    COALESCE(SUM( (dpi.macros_override->>'protein')::numeric ), 0)::int         AS protein_g_total,
    COALESCE(SUM( (dpi.macros_override->>'carbs')::numeric ), 0)::int           AS carbs_g_total,
    COALESCE(SUM( (dpi.macros_override->>'fat')::numeric ), 0)::int             AS fat_g_total
  FROM public.day_plan_items dpi
  JOIN public.day_plans dp ON dp.id = dpi.day_plan_id
  WHERE dpi.done IS TRUE
    AND dpi.entry_type = 'quick'
    AND dpi.macros_override IS NOT NULL
  GROUP BY dpi.user_id, dp.date
),
meal_totals AS (
  SELECT user_id, day,
         COALESCE(SUM(kcal_total),0)::int AS kcal_total,
         COALESCE(SUM(protein_g_total),0)::int AS protein_g_total,
         COALESCE(SUM(carbs_g_total),0)::int AS carbs_g_total,
         COALESCE(SUM(fat_g_total),0)::int AS fat_g_total
  FROM (
    SELECT * FROM meal_food_items
    UNION ALL
    SELECT * FROM meal_quick_items
  ) u
  GROUP BY user_id, day
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
    COALESCE(date, created_at::date) AS day,
    COUNT(*)::int AS workouts_count
  FROM public.workouts
  GROUP BY user_id, COALESCE(date, created_at::date)
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
