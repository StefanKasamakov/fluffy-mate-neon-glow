-- Add location fields to pets table
ALTER TABLE public.pets 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT;

-- Update the location field to be more descriptive
ALTER TABLE public.pets 
ALTER COLUMN location SET DEFAULT 'Location not set';