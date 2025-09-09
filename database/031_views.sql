-- =========================
-- 021_views_food_recent.sql
-- Recent foods used by a user (for add-food dialog)
-- =========================
CREATE OR REPLACE VIEW public.v_food_recent AS
SELECT
  dp.user_id,
  dpi.food_id,
  f.name,
  f.unit,
  max( COALESCE( (dp.date + COALESCE(dpi.time, TIME '12:00')), dp.date::timestamp ) ) AS last_used_at
FROM public.day_plan_items dpi
JOIN public.day_plans dp ON dp.id = dpi.day_plan_id
JOIN public.foods f ON f.id = dpi.food_id
GROUP BY dp.user_id, dpi.food_id, f.name, f.unit
ORDER BY last_used_at DESC;
