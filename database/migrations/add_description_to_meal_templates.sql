-- Add description column to meal_templates
ALTER TABLE public.meal_templates 
ADD COLUMN description TEXT;
