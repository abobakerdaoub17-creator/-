/*
# Add email column to profiles

## Overview
The Users management page needs to display each user's email. The frontend
only has the anon key and cannot call auth.admin.listUsers(). This migration
adds an email column to the profiles table and updates the trigger to populate
it from auth.users on signup.

## Changes
1. Add `email` text column to profiles (nullable, for backwards compat)
2. Backfill existing profiles with emails from auth.users
3. Update handle_new_user() trigger to also store the email
4. Add policy: users can update their own profile email (already covered by
   existing update_own_profile policy)

## Security
- No new policies needed — existing policies cover the new column
- email is visible to all authenticated users (business need: admin manages users)
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text DEFAULT '';

-- Backfill from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email = '';

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
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'sales' END,
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, profiles.email),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name);
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated;
