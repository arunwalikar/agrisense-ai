-- Fix the fields table security: add user_id column and proper RLS policies

-- Add user_id column to fields table
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS user_id uuid;

-- Drop the insecure public access policy
DROP POLICY IF EXISTS "Allow public access to fields" ON public.fields;

-- Create proper RLS policies for fields table
CREATE POLICY "Users can manage own fields" 
ON public.fields 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all fields
CREATE POLICY "Admins can view all fields" 
ON public.fields 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));