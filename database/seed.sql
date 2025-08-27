-- Insert sample foods
INSERT INTO public.foods (name, kcal, protein_g, carbs_g, fat_g, unit, grams_per_unit) VALUES
('Pollo pechuga', 165, 31, 0, 3.6, '100g', 100),
('Arroz blanco', 130, 2.7, 28, 0.3, '100g', 100),
('Brócoli', 34, 2.8, 7, 0.4, '100g', 100),
('Huevo entero', 155, 13, 1.1, 11, 'unidad', 50),
('Avena', 389, 17, 66, 7, '100g', 100),
('Plátano', 89, 1.1, 23, 0.3, 'unidad', 118),
('Leche desnatada', 42, 3.4, 5, 0.1, '100ml', 100),
('Atún en agua', 116, 26, 0, 0.8, '100g', 100),
('Aceite de oliva', 884, 0, 0, 100, '100ml', 100),
('Pavo pechuga', 135, 30, 0, 1.2, '100g', 100),
('Patata', 77, 2, 17, 0.1, '100g', 100),
('Espinacas', 23, 2.9, 3.6, 0.4, '100g', 100),
('Salmón', 208, 25, 0, 12, '100g', 100),
('Quinoa', 120, 4.4, 22, 1.9, '100g', 100),
('Yogur griego', 59, 10, 3.6, 0.4, '100g', 100),
('Nueces', 654, 15, 14, 65, '100g', 100),
('Manzana', 52, 0.3, 14, 0.2, 'unidad', 182),
('Zanahoria', 41, 0.9, 10, 0.2, '100g', 100),
('Pasta integral', 124, 5, 25, 1.1, '100g', 100),
('Tofu', 76, 8, 1.9, 4.8, '100g', 100);

-- Insert sample exercises
INSERT INTO public.exercises (name, muscle, default_sets, default_reps) VALUES
('Press de banca', 'Pecho', 4, 8),
('Sentadilla', 'Piernas', 4, 10),
('Peso muerto', 'Espalda', 3, 8),
('Press militar', 'Hombros', 3, 10),
('Curl de bíceps', 'Brazos', 3, 12),
('Extensiones de tríceps', 'Brazos', 3, 12),
('Remo con barra', 'Espalda', 4, 10),
('Press inclinado', 'Pecho', 3, 10),
('Zancadas', 'Piernas', 3, 12),
('Elevaciones laterales', 'Hombros', 3, 15),
('Plancha', 'Core', 3, 60),
('Crunch', 'Core', 3, 20),
('Pull-ups', 'Espalda', 3, 8),
('Push-ups', 'Pecho', 3, 15),
('Burpees', 'Full body', 3, 10),
('Mountain climbers', 'Core', 3, 30),
('Jumping jacks', 'Cardio', 3, 30),
('Burpees', 'Cardio', 3, 10),
('Skipping', 'Cardio', 3, 60),
('Flexiones diamante', 'Tríceps', 3, 12);

-- Insert sample meal templates (these will be created per user, but we'll create some examples)
-- Note: These will be created when users sign up, but we can create some examples here
-- The actual meal templates will be created in the application when users create them
