-- Minimal seed for foods & exercises
INSERT INTO public.foods (id, name, kcal, protein_g, carbs_g, fat_g, unit, grams_per_unit)
VALUES
  (uuid_generate_v4(), 'Chicken Breast', 165, 31, 0, 3, 'g', 100),
  (uuid_generate_v4(), 'White Rice', 130, 2, 28, 0, 'g', 100),
  (uuid_generate_v4(), 'Olive Oil', 884, 0, 0, 100, 'ml', 100)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, name, muscle, default_sets, default_reps)
VALUES
  (uuid_generate_v4(), 'Bench Press', 'chest', 4, 8),
  (uuid_generate_v4(), 'Squat', 'legs', 5, 5),
  (uuid_generate_v4(), 'Deadlift', 'back', 5, 5)
ON CONFLICT DO NOTHING;
