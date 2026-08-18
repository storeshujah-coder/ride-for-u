-- =========================================================================
-- RIDE FOR U: Fix Supabase Auth, Table Permissions & Super Admin User
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. Grant Permissions to anon, authenticated, and service_role
--    (PostgreSQL requires table GRANTs before Row Level Security is checked)
-- =========================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- =========================================================================
-- 3. Fix any corrupted auth.users records (NULL tokens cause GoTrue 500 errors)
-- =========================================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb),
  is_sso_user = COALESCE(is_sso_user, FALSE),
  is_anonymous = COALESCE(is_anonymous, FALSE)
WHERE 
  confirmation_token IS NULL OR
  recovery_token IS NULL OR
  email_change IS NULL OR
  email_change_token_new IS NULL OR
  email_change_token_current IS NULL OR
  phone_change IS NULL OR
  phone_change_token IS NULL OR
  reauthentication_token IS NULL OR
  raw_app_meta_data IS NULL OR
  is_sso_user IS NULL OR
  is_anonymous IS NULL;

-- =========================================================================
-- 4. Robust Trigger Function for new auth.users
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'staff';
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'super_admin' THEN
    v_role := 'super_admin'::user_role;
  ELSE
    v_role := 'staff'::user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_role,
    'Active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent any auth trigger error from blocking user sign-in/up
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 5. Robust Activity Log Trigger
-- =========================================================================

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  action_type log_action;
  entity TEXT;
  ent_id TEXT;
  descr TEXT;
  v_actor_id UUID;
  v_actor_name TEXT;
BEGIN
  entity := TG_ARGV[0];

  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    new_data := to_jsonb(NEW);
    old_data := NULL;
    ent_id := NEW.id::TEXT;
    descr := format('Created %s record', entity);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    new_data := to_jsonb(NEW);
    old_data := to_jsonb(OLD);
    ent_id := NEW.id::TEXT;
    descr := format('Updated %s record', entity);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    new_data := NULL;
    old_data := to_jsonb(OLD);
    ent_id := OLD.id::TEXT;
    descr := format('Deleted %s record', entity);
  ELSE
    RETURN NULL;
  END IF;

  -- Verify actor exists in profiles before linking foreign key
  v_actor_id := auth.uid();
  IF v_actor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id) THEN
    v_actor_id := NULL;
  END IF;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = v_actor_id;
  IF v_actor_name IS NULL THEN
    v_actor_name := 'System';
  END IF;

  BEGIN
    INSERT INTO public.activity_logs (
      user_id, actor_name, action, entity_type, entity_id,
      old_data, new_data, action_description
    ) VALUES (
      v_actor_id,
      v_actor_name,
      action_type,
      entity,
      ent_id,
      old_data,
      new_data,
      descr
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =========================================================================
-- 6. Create / Update Super Admin Account (admin@rideforu.com / admin123)
-- =========================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Generate valid bcrypt hash for 'admin123'
  v_encrypted_pw := crypt('admin123', gen_salt('bf', 10));

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@rideforu.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Create user in auth.users with all GoTrue required non-null fields
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      recovery_token,
      reauthentication_token,
      phone_change,
      phone_change_token,
      is_super_admin,
      is_sso_user,
      is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@rideforu.com',
      v_encrypted_pw,
      NOW(),
      NULL,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin","role":"super_admin"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      FALSE,
      FALSE,
      FALSE
    );

    -- Create identity in auth.identities (MANDATORY for GoTrue login)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, 'admin@rideforu.com')::jsonb,
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    -- Fix existing admin user
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      recovery_token = COALESCE(recovery_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"full_name":"Super Admin","role":"super_admin"}'::jsonb,
      is_sso_user = COALESCE(is_sso_user, FALSE),
      is_anonymous = COALESCE(is_anonymous, FALSE)
    WHERE id = v_user_id;

    -- Ensure identity exists
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, 'admin@rideforu.com')::jsonb,
        'email',
        v_user_id::text,
        NOW(),
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  -- Ensure profile exists and is Super Admin
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (v_user_id, 'Super Admin', 'admin@rideforu.com', 'super_admin', 'Active')
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Super Admin',
    email = 'admin@rideforu.com',
    role = 'super_admin',
    status = 'Active';

END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
