
-- Insert a demo admin user (you'll need to sign up with these credentials first)
-- We'll create this after the user signs up, but let me set up the profile structure

-- First, let's create some demo users in the profiles table after they sign up
-- The admin user will be: admin@demo.com / password123
-- The operator user will be: operator@demo.com / password123  
-- The regular user will be: user@demo.com / password123

-- For now, let's just make sure we have a way to easily assign roles
-- I'll modify the handle_new_user function to auto-assign admin role to admin@demo.com

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Auto-assign roles based on email for demo purposes
  IF NEW.email = 'admin@demo.com' THEN
    INSERT INTO public.profiles (id, full_name, role, region)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Demo Admin'),
      'admin',
      'tamil_nadu'
    );
  ELSIF NEW.email = 'operator@demo.com' THEN
    INSERT INTO public.profiles (id, full_name, role, region)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Demo Operator'),
      'operator', 
      'tamil_nadu'
    );
  ELSE
    -- Default role for other users
    INSERT INTO public.profiles (id, full_name, role, region)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      'operator',
      'tamil_nadu'
    );
  END IF;
  
  RETURN NEW;
END;
$function$
