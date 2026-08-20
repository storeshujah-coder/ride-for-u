-- =========================================================================
-- COMPLETE SUPABASE AUTH, PERMISSIONS & CREDENTIALS SYNC SCRIPT
-- Run this in Supabase Dashboard -> SQL Editor -> Run (New Query)
-- =========================================================================

-- 1. Ensure pgcrypto extension is active for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Create departments table if not exists
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default departments if table is empty
INSERT INTO public.departments (name, notes)
SELECT 'Transport / Operations', 'Vehicle operations'
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Transport / Operations');

INSERT INTO public.departments (name, notes)
SELECT 'Finance / Accounts', 'Billing & finance'
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Finance / Accounts');

INSERT INTO public.departments (name, notes)
SELECT 'Administration', 'Admin management'
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Administration');

-- 3. Create monthly_departments table if not exists
CREATE TABLE IF NOT EXISTS public.monthly_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_record_id UUID REFERENCES public.monthly_records(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name TEXT DEFAULT '',
  payment NUMERIC(12,2) NOT NULL DEFAULT 0,
  remarks TEXT DEFAULT '',
  entry_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated on departments" ON public.departments;
CREATE POLICY "Allow all for authenticated on departments" ON public.departments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on departments" ON public.departments;
CREATE POLICY "Allow all for anon on departments" ON public.departments
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on monthly_departments" ON public.monthly_departments;
CREATE POLICY "Allow all for authenticated on monthly_departments" ON public.monthly_departments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on monthly_departments" ON public.monthly_departments;
CREATE POLICY "Allow all for anon on monthly_departments" ON public.monthly_departments
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. RPC FUNCTION: Direct Password Setter (Instant Password Updates)
CREATE OR REPLACE FUNCTION public.admin_set_user_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(TRIM(p_new_password), extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 6. RPC FUNCTION: Full User Credentials Updater (Email + Password + Details)
CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_can_manage_others BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_clean_email TEXT;
BEGIN
  v_clean_email := NULLIF(TRIM(p_email), '');

  -- Update auth.users email and password
  IF v_clean_email IS NOT NULL AND p_password IS NOT NULL AND TRIM(p_password) <> '' THEN
    UPDATE auth.users
    SET email = v_clean_email,
        encrypted_password = extensions.crypt(TRIM(p_password), extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;
  ELSIF v_clean_email IS NOT NULL THEN
    UPDATE auth.users
    SET email = v_clean_email,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;
  ELSIF p_password IS NOT NULL AND TRIM(p_password) <> '' THEN
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(TRIM(p_password), extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET email = COALESCE(v_clean_email, email),
      full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
      role = COALESCE(NULLIF(TRIM(p_role), ''), role),
      can_manage_other_staff_records = COALESCE(p_can_manage_others, can_manage_other_staff_records),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 7. RPC FUNCTION: Admin User Creator
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_can_manage_others BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
  v_clean_email TEXT;
  v_clean_password TEXT;
BEGIN
  v_clean_email := TRIM(p_email);
  v_clean_password := TRIM(p_password);
  v_new_id := NULL;

  -- Check if user already exists in auth.users
  SELECT id INTO v_new_id FROM auth.users WHERE LOWER(email) = LOWER(v_clean_email) LIMIT 1;

  IF v_new_id IS NOT NULL THEN
    UPDATE auth.users
    SET email = v_clean_email,
        encrypted_password = extensions.crypt(v_clean_password, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object('full_name', TRIM(p_full_name), 'role', p_role),
        updated_at = NOW()
    WHERE id = v_new_id;
  ELSE
    v_new_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    ) VALUES (
      v_new_id,
      '00000000-0000-0000-0000-000000000000',
      v_clean_email,
      extensions.crypt(v_clean_password, extensions.gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', TRIM(p_full_name), 'role', p_role),
      'authenticated',
      'authenticated',
      NOW(),
      NOW()
    );
  END IF;

  -- Upsert in profiles table
  INSERT INTO public.profiles (id, full_name, email, role, status, can_manage_other_staff_records)
  VALUES (
    v_new_id,
    TRIM(p_full_name),
    v_clean_email,
    p_role,
    'Active',
    COALESCE(p_can_manage_others, FALSE)
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      status = 'Active',
      can_manage_other_staff_records = EXCLUDED.can_manage_other_staff_records,
      updated_at = NOW();

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 8. PERMANENT SUPER ADMIN SETUP (mijaztransport1@gmail.com / ijaz123)
-- Directly updates the existing Super Admin account (UID: 58d69353-9572-48dd-a3b0-cc5d4dca16bb)
UPDATE auth.users
SET email = 'mijaztransport1@gmail.com',
    encrypted_password = extensions.crypt('ijaz123', extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    raw_user_meta_data = jsonb_build_object('full_name', 'Muhammad Ijaz', 'role', 'super_admin'),
    updated_at = NOW()
WHERE id = '58d69353-9572-48dd-a3b0-cc5d4dca16bb'
   OR id IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
   OR email = 'admin@rideforu.com';

-- Upsert in public.profiles table
INSERT INTO public.profiles (id, full_name, email, role, status, can_manage_other_staff_records)
VALUES (
  '58d69353-9572-48dd-a3b0-cc5d4dca16bb',
  'Muhammad Ijaz',
  'mijaztransport1@gmail.com',
  'super_admin',
  'Active',
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET full_name = 'Muhammad Ijaz',
    email = 'mijaztransport1@gmail.com',
    role = 'super_admin',
    status = 'Active',
    can_manage_other_staff_records = TRUE,
    updated_at = NOW();

-- 9. SYNC ALL USERS (Fixes any email mismatches between profiles and auth.users)
UPDATE auth.users u
SET email = p.email,
    email_confirmed_at = COALESCE(u.email_confirmed_at, NOW())
FROM public.profiles p
WHERE u.id = p.id AND (u.email IS DISTINCT FROM p.email OR u.email_confirmed_at IS NULL);

-- 9. Strict Backend Permission Check
CREATE OR REPLACE FUNCTION public.can_manage_record(record_creator_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_manage BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Super Admin can manage ALL records
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin' AND status = 'Active') THEN
    RETURN TRUE;
  END IF;

  -- Staff user can manage their OWN records
  IF record_creator_id IS NOT NULL AND record_creator_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- Check if staff user has "can_manage_other_staff_records" = TRUE
  SELECT can_manage_other_staff_records INTO v_can_manage
  FROM public.profiles
  WHERE id = auth.uid() AND status = 'Active';

  RETURN COALESCE(v_can_manage, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

-- 10. Grant Execute on Functions
GRANT EXECUTE ON FUNCTION public.admin_set_user_password(UUID, TEXT) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user_credentials(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_record(UUID) TO postgres, anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 11. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
