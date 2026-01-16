-- Update has_role function with access control check
-- This prevents any user from checking other users' roles unless they are an admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow checking own roles without restriction
  IF auth.uid() = _user_id THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- For checking other users' roles, caller must be an admin
  -- First check if caller is admin (direct query to avoid recursion)
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- Non-admin trying to check other user's roles - return false
  RETURN FALSE;
END;
$$;