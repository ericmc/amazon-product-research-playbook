-- Add missing RLS policies for raw_imports table
-- Allow users to update their own raw imports
CREATE POLICY "Users can update their own raw imports" 
ON public.raw_imports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own raw imports
CREATE POLICY "Users can delete their own raw imports" 
ON public.raw_imports 
FOR DELETE 
USING (auth.uid() = user_id);