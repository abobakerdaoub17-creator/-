/*
# Make the first registered user an admin

## Overview
Currently every new user gets the 'sales' role via the handle_new_user()
trigger. This migration updates that trigger so the FIRST user to sign up
receives the 'admin' role, while all subsequent users still get 'sales'.

## Changes
1. Replace the handle_new_user() trigger function:
   - Count existing profiles
   - If count is 0, insert with role = 'admin'
   - Otherwise insert with role = 'sales'
2. This is idempotent and safe to re-run

## Security
- No policy changes
- No new tables
- Only changes the default role assignment logic
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'sales' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated;
