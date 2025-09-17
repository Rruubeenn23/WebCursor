-- =========================
-- 030_functions.sql
-- RPC functions used by the app
-- =========================

-- adherence_weekly
-- Computes adherence over a week window based on planned items (day_plan_items.done).
-- Call via:
--   POST /rest/v1/rpc/adherence_weekly
--   { "user_id": "<uuid>", "week_start": "YYYY-MM-DD" }
--
-- Returns a single row:
--   planned_count INT, done_count INT, adherence NUMERIC (0..1, 4 dp)
CREATE OR REPLACE FUNCTION public.adherence_weekly(p_user_id uuid, p_week_start date)
RETURNS TABLE (
  planned_count int,
  done_count int,
  adherence numeric
)
LANGUAGE sql
STABLE
AS $fn$
  WITH items AS (
    SELECT *
    FROM public.day_plan_items
    WHERE user_id = p_user_id
      AND date >= p_week_start
      AND date < (p_week_start + INTERVAL '7 days')
  ),
  counts AS (
    SELECT
      COUNT(*)::int AS planned_count,
      COALESCE(SUM(CASE WHEN done THEN 1 ELSE 0 END), 0)::int AS done_count
    FROM items
  )
  SELECT
    planned_count,
    done_count,
    CASE
      WHEN planned_count = 0 THEN 0
      ELSE ROUND(done_count::numeric / planned_count, 4)
    END AS adherence
  FROM counts;
$fn$;

-- Optional: you can add more helper RPCs later if needed.
