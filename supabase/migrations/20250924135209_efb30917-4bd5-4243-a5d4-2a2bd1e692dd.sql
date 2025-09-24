-- Add image URL and ASIN fields to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN image_url TEXT,
ADD COLUMN asin TEXT;