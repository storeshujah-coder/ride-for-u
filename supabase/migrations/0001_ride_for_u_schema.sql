-- ==================================================
-- RIDE FOR U — Complete Supabase Backend Schema
-- ==================================================
-- Part 1: Custom ENUM Types
-- ==================================================

CREATE TYPE vehicle_type AS ENUM ('Car', 'Pickup', 'Shahzore');
CREATE TYPE owner_type AS ENUM ('Ride for U', 'Subcontractor');
CREATE TYPE entity_status AS ENUM ('Active', 'Inactive', 'Maintenance');
CREATE TYPE user_role AS ENUM ('super_admin', 'staff');
CREATE TYPE entry_type AS ENUM ('quick', 'detailed');
CREATE TYPE expense_for AS ENUM ('Vehicle', 'Driver', 'Subcontractor', 'Office', 'Other');
CREATE TYPE payment_method AS ENUM ('Cash', 'Bank Transfer', 'Cheque', 'Other');
CREATE TYPE log_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- ==================================================
-- Part 2: Profiles table (linked to Supabase Auth)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'staff',
  status entity_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when a new user signs up
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================================================
-- Part 3: Permission System
-- ==================================================

CREATE TABLE IF NOT EXISTS public.modules (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL REFERENCES public.modules(key) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'add', 'edit', 'delete', 'generate', 'manage_categories', 'manage_permissions')),
  UNIQUE(module_key, action)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, permission_id)
);

-- Insert modules
INSERT INTO public.modules (key, label) VALUES
  ('dashboard', 'Dashboard'),
  ('vehicles', 'Vehicles'),
  ('drivers', 'Drivers'),
  ('subcontractors', 'Subcontractors'),
  ('monthlyRecords', 'Monthly Records'),
  ('expenses', 'Expenses'),
  ('reports', 'Reports'),
  ('settings', 'Settings'),
  ('users', 'Users'),
  ('activityHistory', 'Activity History')
ON CONFLICT (key) DO NOTHING;

-- Insert all permissions
INSERT INTO public.permissions (module_key, action) VALUES
  ('dashboard', 'view'),
  ('vehicles', 'view'), ('vehicles', 'add'), ('vehicles', 'edit'), ('vehicles', 'delete'),
  ('drivers', 'view'), ('drivers', 'add'), ('drivers', 'edit'), ('drivers', 'delete'),
  ('subcontractors', 'view'), ('subcontractors', 'add'), ('subcontractors', 'edit'), ('subcontractors', 'delete'),
  ('monthlyRecords', 'view'), ('monthlyRecords', 'add'), ('monthlyRecords', 'edit'), ('monthlyRecords', 'delete'),
  ('expenses', 'view'), ('expenses', 'add'), ('expenses', 'edit'), ('expenses', 'delete'),
  ('reports', 'view'), ('reports', 'generate'),
  ('settings', 'view'), ('settings', 'manage_categories'),
  ('users', 'view'), ('users', 'add'), ('users', 'edit'), ('users', 'delete'), ('users', 'manage_permissions'),
  ('activityHistory', 'view')
ON CONFLICT DO NOTHING;

-- ==================================================
-- Part 4: Core Business Tables
-- ==================================================

-- 4a. Subcontractors
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnic TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status entity_status NOT NULL DEFAULT 'Active',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4b. Drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  father_name TEXT NOT NULL DEFAULT '',
  cnic TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  driving_license TEXT NOT NULL DEFAULT '',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_vehicle_id UUID,
  status entity_status NOT NULL DEFAULT 'Active',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4c. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL UNIQUE,
  vehicle_type vehicle_type NOT NULL DEFAULT 'Car',
  owner_type owner_type NOT NULL DEFAULT 'Ride for U',
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  model TEXT NOT NULL DEFAULT '',
  status entity_status NOT NULL DEFAULT 'Active',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers
  ADD CONSTRAINT fk_drivers_vehicle
  FOREIGN KEY (assigned_vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- 4d. Driver Salaries
CREATE TABLE IF NOT EXISTS public.driver_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  monthly_salary NUMERIC NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  salary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, month)
);

-- 4e. Monthly Records
CREATE TABLE IF NOT EXISTS public.monthly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vehicle_id, month, year)
);

-- 4f. Daily Records
CREATE TABLE IF NOT EXISTS public.daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_record_id UUID NOT NULL REFERENCES public.monthly_records(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  entry_type entry_type NOT NULL DEFAULT 'quick',
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4g. Daily Routes
CREATE TABLE IF NOT EXISTS public.daily_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_record_id UUID NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4h. Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status entity_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4i. Expenses (General Business Expense System)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  expense_for expense_for NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  related_name TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_method payment_method NOT NULL DEFAULT 'Cash',
  remarks TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4j. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  action log_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  action_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4k. Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Ride for U',
  currency TEXT NOT NULL DEFAULT 'Rs.',
  commission_rate NUMERIC NOT NULL DEFAULT 2.5 CHECK (commission_rate >= 0),
  admin_name TEXT NOT NULL DEFAULT 'Super Admin',
  appearance TEXT NOT NULL DEFAULT 'light' CHECK (appearance IN ('light', 'dark')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (company_name, currency, commission_rate, admin_name, appearance)
VALUES ('Ride for U', 'Rs.', 2.5, 'Super Admin', 'light')
ON CONFLICT DO NOTHING;

-- Insert default expense categories
INSERT INTO public.expense_categories (name) VALUES
  ('Fuel'), ('Maintenance'), ('Salary'), ('Office'),
  ('Electricity'), ('Repair'), ('Toll'), ('Washing'),
  ('Driver'), ('Staff'), ('Subcontractor'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- ==================================================
-- Part 5: Indexes
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_number ON public.vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_subcontractor ON public.vehicles(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_drivers_name ON public.drivers(full_name);
CREATE INDEX IF NOT EXISTS idx_drivers_cnic ON public.drivers(cnic);
CREATE INDEX IF NOT EXISTS idx_subcontractors_name ON public.subcontractors(name);
CREATE INDEX IF NOT EXISTS idx_driver_salaries_driver_month ON public.driver_salaries(driver_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_records_vehicle_month ON public.monthly_records(vehicle_id, month, year);
CREATE INDEX IF NOT EXISTS idx_daily_records_monthly ON public.daily_records(monthly_record_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON public.daily_records(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_routes_record ON public.daily_routes(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_for ON public.expenses(expense_for);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON public.expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_driver ON public.expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_subcontractor ON public.expenses(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_profile ON public.user_permissions(profile_id);

-- ==================================================
-- Part 6: Permission Helper Function
-- ==================================================

CREATE OR REPLACE FUNCTION public.has_permission(user_id UUID, mod_key TEXT, act TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  r user_role;
  perm_exists BOOLEAN;
BEGIN
  -- Super admin has all permissions
  SELECT role INTO r FROM public.profiles WHERE id = user_id;
  IF FOUND AND r = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Check explicit permission
  SELECT EXISTS(
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.profile_id = user_id
      AND p.module_key = mod_key
      AND p.action = act
  ) INTO perm_exists;

  RETURN perm_exists;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==================================================
-- Part 7: RLS — Enable RLS on All Tables
-- ==================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- Part 8: RLS Policies
-- ==================================================

-- Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: is_active_user
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- -------- Profiles Policies --------
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      id = auth.uid() OR
      public.has_permission(auth.uid(), 'users', 'view')
    )
  );

CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'users', 'add'));

CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'users', 'edit'));

CREATE POLICY profiles_delete ON public.profiles FOR DELETE
  USING (
    public.is_super_admin() AND
    id <> (SELECT id FROM public.profiles WHERE role = 'super_admin' ORDER BY created_at LIMIT 1)
  );

-- -------- Modules & Permissions --------
CREATE POLICY modules_select ON public.modules FOR SELECT USING (public.is_active_user());
CREATE POLICY permissions_select ON public.permissions FOR SELECT USING (public.is_active_user());

-- -------- User Permissions --------
CREATE POLICY user_permissions_select ON public.user_permissions FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      profile_id = auth.uid() OR
      public.has_permission(auth.uid(), 'users', 'manage_permissions')
    )
  );

CREATE POLICY user_permissions_insert ON public.user_permissions FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'users', 'manage_permissions'));

CREATE POLICY user_permissions_update ON public.user_permissions FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'users', 'manage_permissions'));

CREATE POLICY user_permissions_delete ON public.user_permissions FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'users', 'manage_permissions'));

-- -------- Vehicles Policies --------
CREATE POLICY vehicles_select ON public.vehicles FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'vehicles', 'view')
    )
  );

CREATE POLICY vehicles_insert ON public.vehicles FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'vehicles', 'add'));

CREATE POLICY vehicles_update ON public.vehicles FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'vehicles', 'edit'));

CREATE POLICY vehicles_delete ON public.vehicles FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'vehicles', 'delete'));

-- -------- Drivers Policies --------
CREATE POLICY drivers_select ON public.drivers FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'drivers', 'view')
    )
  );

CREATE POLICY drivers_insert ON public.drivers FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'drivers', 'add'));

CREATE POLICY drivers_update ON public.drivers FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'drivers', 'edit'));

CREATE POLICY drivers_delete ON public.drivers FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'drivers', 'delete'));

-- -------- Subcontractors Policies --------
CREATE POLICY subcontractors_select ON public.subcontractors FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'subcontractors', 'view')
    )
  );

CREATE POLICY subcontractors_insert ON public.subcontractors FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'subcontractors', 'add'));

CREATE POLICY subcontractors_update ON public.subcontractors FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'subcontractors', 'edit'));

CREATE POLICY subcontractors_delete ON public.subcontractors FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'subcontractors', 'delete'));

-- -------- Driver Salaries Policies --------
CREATE POLICY driver_salaries_select ON public.driver_salaries FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'drivers', 'view')
    )
  );

CREATE POLICY driver_salaries_insert ON public.driver_salaries FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'drivers', 'add'));

CREATE POLICY driver_salaries_update ON public.driver_salaries FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'drivers', 'edit'));

CREATE POLICY driver_salaries_delete ON public.driver_salaries FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'drivers', 'delete'));

-- -------- Monthly Records Policies --------
CREATE POLICY monthly_records_select ON public.monthly_records FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'monthlyRecords', 'view')
    )
  );

CREATE POLICY monthly_records_insert ON public.monthly_records FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'add'));

CREATE POLICY monthly_records_update ON public.monthly_records FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'edit'));

CREATE POLICY monthly_records_delete ON public.monthly_records FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'delete'));

-- -------- Daily Records Policies --------
CREATE POLICY daily_records_select ON public.daily_records FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'monthlyRecords', 'view')
    )
  );

CREATE POLICY daily_records_insert ON public.daily_records FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'add'));

CREATE POLICY daily_records_update ON public.daily_records FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'edit'));

CREATE POLICY daily_records_delete ON public.daily_records FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'delete'));

-- -------- Daily Routes Policies --------
CREATE POLICY daily_routes_select ON public.daily_routes FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'monthlyRecords', 'view')
    )
  );

CREATE POLICY daily_routes_insert ON public.daily_routes FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'add'));

CREATE POLICY daily_routes_update ON public.daily_routes FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'edit'));

CREATE POLICY daily_routes_delete ON public.daily_routes FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'monthlyRecords', 'delete'));

-- -------- Expense Categories Policies --------
CREATE POLICY expense_categories_select ON public.expense_categories FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'settings', 'view') OR
      public.has_permission(auth.uid(), 'expenses', 'view')
    )
  );

CREATE POLICY expense_categories_insert ON public.expense_categories FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'settings', 'manage_categories'));

CREATE POLICY expense_categories_update ON public.expense_categories FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'settings', 'manage_categories'));

CREATE POLICY expense_categories_delete ON public.expense_categories FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'settings', 'manage_categories'));

-- -------- Expenses Policies --------
CREATE POLICY expenses_select ON public.expenses FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'expenses', 'view')
    )
  );

CREATE POLICY expenses_insert ON public.expenses FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.has_permission(auth.uid(), 'expenses', 'add'));

CREATE POLICY expenses_update ON public.expenses FOR UPDATE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'expenses', 'edit'));

CREATE POLICY expenses_delete ON public.expenses FOR DELETE
  USING (public.is_super_admin() OR public.has_permission(auth.uid(), 'expenses', 'delete'));

-- -------- Activity Logs Policies --------
CREATE POLICY activity_logs_select ON public.activity_logs FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'activityHistory', 'view')
    )
  );

CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_active_user());

-- -------- Settings Policies --------
CREATE POLICY settings_select ON public.settings FOR SELECT
  USING (
    public.is_active_user() AND (
      public.is_super_admin() OR
      public.has_permission(auth.uid(), 'settings', 'view')
    )
  );

CREATE POLICY settings_update ON public.settings FOR UPDATE
  USING (public.is_super_admin());

-- ==================================================
-- Part 9: Activity Log Trigger
-- ==================================================

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  action_type log_action;
  entity TEXT;
  ent_id TEXT;
  -- Verify actor exists in profiles before linking foreign key
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

DROP TRIGGER IF EXISTS log_vehicles ON public.vehicles;
CREATE TRIGGER log_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('vehicle');

DROP TRIGGER IF EXISTS log_drivers ON public.drivers;
CREATE TRIGGER log_drivers
  AFTER INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('driver');

DROP TRIGGER IF EXISTS log_subcontractors ON public.subcontractors;
CREATE TRIGGER log_subcontractors
  AFTER INSERT OR UPDATE OR DELETE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('subcontractor');

DROP TRIGGER IF EXISTS log_driver_salaries ON public.driver_salaries;
CREATE TRIGGER log_driver_salaries
  AFTER INSERT OR UPDATE OR DELETE ON public.driver_salaries
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('salary');

DROP TRIGGER IF EXISTS log_monthly_records ON public.monthly_records;
CREATE TRIGGER log_monthly_records
  AFTER INSERT OR UPDATE OR DELETE ON public.monthly_records
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('monthly-record');

DROP TRIGGER IF EXISTS log_daily_records ON public.daily_records;
CREATE TRIGGER log_daily_records
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('daily-record');

DROP TRIGGER IF EXISTS log_expenses ON public.expenses;
CREATE TRIGGER log_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('expense');

DROP TRIGGER IF EXISTS log_expense_categories ON public.expense_categories;
CREATE TRIGGER log_expense_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('category');

DROP TRIGGER IF EXISTS log_profiles ON public.profiles;
CREATE TRIGGER log_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('user');

-- ==================================================
-- Part 10: RPC Functions
-- ==================================================

-- 10a. Save Monthly Record Bulk
CREATE OR REPLACE FUNCTION public.save_monthly_record_bulk(
  p_vehicle_id UUID,
  p_month INTEGER,
  p_year INTEGER,
  p_daily_records JSONB  -- [{date, entry_type, amount, details, routes:[{location, amount}]}]
)
RETURNS UUID AS $$
DECLARE
  v_monthly_id UUID;
  v_dr JSONB;
  v_route JSONB;
  v_daily_id UUID;
  v_date TEXT;
  v_month_str TEXT;
BEGIN
  -- Upsert monthly record
  INSERT INTO public.monthly_records (vehicle_id, month, year, created_by)
  VALUES (p_vehicle_id, p_month, p_year, auth.uid())
  ON CONFLICT (vehicle_id, month, year) DO UPDATE
    SET updated_at = NOW()
  RETURNING id INTO v_monthly_id;

  -- Delete old daily records for this monthly record
  DELETE FROM public.daily_records WHERE monthly_record_id = v_monthly_id;

  -- Insert new daily records
  FOR v_dr IN SELECT * FROM jsonb_array_elements(p_daily_records) LOOP
    v_date := (v_dr->>'date')::TEXT;

    -- Only insert if has amount, details, or routes with content
    IF (v_dr->>'amount')::NUMERIC > 0
       OR COALESCE(v_dr->>'details', '') <> ''
       OR jsonb_array_length(COALESCE(v_dr->'routes', '[]'::JSONB)) > 0 THEN

      INSERT INTO public.daily_records (
        monthly_record_id, record_date, entry_type, amount, details
      ) VALUES (
        v_monthly_id,
        v_date::DATE,
        COALESCE((v_dr->>'entry_type')::entry_type, 'quick'),
        COALESCE((v_dr->>'amount')::NUMERIC, 0),
        COALESCE(v_dr->>'details', '')
      ) RETURNING id INTO v_daily_id;

      -- Insert routes if any
      FOR v_route IN SELECT * FROM jsonb_array_elements(COALESCE(v_dr->'routes', '[]'::JSONB)) LOOP
        IF (v_route->>'amount')::NUMERIC > 0 OR COALESCE(v_route->>'location', '') <> '' THEN
          INSERT INTO public.daily_routes (daily_record_id, location, amount)
          VALUES (
            v_daily_id,
            COALESCE(v_route->>'location', ''),
            COALESCE((v_route->>'amount')::NUMERIC, 0)
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_monthly_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10b. Calculate Monthly Totals
CREATE OR REPLACE FUNCTION public.calculate_monthly_totals(
  p_vehicle_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_total_duty NUMERIC;
  v_total_expenses NUMERIC;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_after_commission NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  -- Total duty from daily records
  SELECT COALESCE(SUM(dr.amount), 0) INTO v_total_duty
  FROM public.monthly_records mr
  JOIN public.daily_records dr ON dr.monthly_record_id = mr.id
  WHERE mr.vehicle_id = p_vehicle_id
    AND mr.month = p_month
    AND mr.year = p_year;

  -- If 0 from quick entries, check detailed routes
  IF v_total_duty = 0 THEN
    SELECT COALESCE(SUM(rt.amount), 0) INTO v_total_duty
    FROM public.monthly_records mr
    JOIN public.daily_records dr ON dr.monthly_record_id = mr.id
    JOIN public.daily_routes rt ON rt.daily_record_id = dr.id
    WHERE mr.vehicle_id = p_vehicle_id
      AND mr.month = p_month
      AND mr.year = p_year;
  END IF;

  -- Total vehicle-related expenses
  SELECT COALESCE(SUM(e.amount), 0) INTO v_total_expenses
  FROM public.expenses e
  WHERE e.vehicle_id = p_vehicle_id
    AND EXTRACT(MONTH FROM e.expense_date) = p_month
    AND EXTRACT(YEAR FROM e.expense_date) = p_year;

  -- Commission rate from settings
  SELECT commission_rate INTO v_commission_rate FROM public.settings LIMIT 1;
  IF v_commission_rate IS NULL THEN v_commission_rate := 2.5; END IF;

  v_commission_amount := ROUND((v_total_duty * v_commission_rate / 100) * 100) / 100;
  v_after_commission := v_total_duty - v_commission_amount;
  v_final_amount := v_after_commission - v_total_expenses;

  RETURN jsonb_build_object(
    'total_duty', v_total_duty,
    'total_expenses', v_total_expenses,
    'commission_rate', v_commission_rate,
    'commission_amount', v_commission_amount,
    'after_commission', v_after_commission,
    'final_amount', v_final_amount
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10c. Get Category Expenses for Month
CREATE OR REPLACE FUNCTION public.get_category_expenses_for_month(
  p_category_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  id UUID,
  expense_date DATE,
  expense_for expense_for,
  vehicle_number TEXT,
  driver_name TEXT,
  subcontractor_name TEXT,
  related_name TEXT,
  amount NUMERIC,
  remarks TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.expense_date,
    e.expense_for,
    v.vehicle_number,
    d.full_name,
    s.name,
    e.related_name,
    e.amount,
    e.remarks
  FROM public.expenses e
  LEFT JOIN public.vehicles v ON v.id = e.vehicle_id
  LEFT JOIN public.drivers d ON d.id = e.driver_id
  LEFT JOIN public.subcontractors s ON s.id = e.subcontractor_id
  WHERE e.category_id = p_category_id
    AND EXTRACT(MONTH FROM e.expense_date) = p_month
    AND EXTRACT(YEAR FROM e.expense_date) = p_year
  ORDER BY e.expense_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10d. Get Vehicle Report
CREATE OR REPLACE FUNCTION public.get_vehicle_report(
  p_vehicle_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_vehicle JSONB;
  v_driver JSONB;
  v_subcontractor JSONB;
  v_daily_records JSONB;
  v_expenses JSONB;
  v_totals JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', v.id, 'vehicle_number', v.vehicle_number,
    'vehicle_type', v.vehicle_type, 'owner_type', v.owner_type,
    'model', v.model, 'status', v.status, 'notes', v.notes
  ) INTO v_vehicle FROM public.vehicles v WHERE v.id = p_vehicle_id;

  SELECT jsonb_build_object(
    'id', d.id, 'full_name', d.full_name, 'phone', d.phone
  ) INTO v_driver FROM public.drivers d WHERE d.id = (
    SELECT driver_id FROM public.vehicles WHERE id = p_vehicle_id
  );

  SELECT jsonb_build_object(
    'id', s.id, 'name', s.name, 'phone', s.phone
  ) INTO v_subcontractor FROM public.subcontractors s WHERE s.id = (
    SELECT subcontractor_id FROM public.vehicles WHERE id = p_vehicle_id
  );

  SELECT COALESCE(jsonb_agg(dr.*), '[]'::JSONB) INTO v_daily_records FROM (
    SELECT
      d.id, d.record_date, d.entry_type, d.amount, d.details,
      COALESCE((
        SELECT jsonb_agg(r ORDER BY r.id)
        FROM (SELECT id, location, amount FROM public.daily_routes WHERE daily_record_id = d.id) r
      ), '[]'::JSONB) AS routes
    FROM public.daily_records d
    JOIN public.monthly_records mr ON mr.id = d.monthly_record_id
    WHERE mr.vehicle_id = p_vehicle_id
      AND mr.month = p_month
      AND mr.year = p_year
    ORDER BY d.record_date
  ) dr;

  SELECT COALESCE(jsonb_agg(e.*), '[]'::JSONB) INTO v_expenses FROM (
    SELECT
      ex.id, ex.expense_date, ec.name AS category_name,
      ex.expense_for, ex.amount, ex.remarks
    FROM public.expenses ex
    JOIN public.expense_categories ec ON ec.id = ex.category_id
    WHERE ex.vehicle_id = p_vehicle_id
      AND EXTRACT(MONTH FROM ex.expense_date) = p_month
      AND EXTRACT(YEAR FROM ex.expense_date) = p_year
    ORDER BY ex.expense_date
  ) e;

  v_totals := public.calculate_monthly_totals(p_vehicle_id, p_month, p_year);

  RETURN jsonb_build_object(
    'vehicle', v_vehicle,
    'driver', v_driver,
    'subcontractor', v_subcontractor,
    'daily_records', v_daily_records,
    'expenses', v_expenses,
    'totals', v_totals
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10e. Get Subcontractor Report
CREATE OR REPLACE FUNCTION public.get_subcontractor_report(
  p_subcontractor_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_subcontractor JSONB;
  v_vehicles JSONB;
  v_expenses NUMERIC;
  v_total_duty NUMERIC;
BEGIN
  SELECT jsonb_build_object(
    'id', s.id, 'name', s.name, 'cnic', s.cnic,
    'phone', s.phone, 'address', s.address,
    'joining_date', s.joining_date, 'status', s.status, 'notes', s.notes
  ) INTO v_subcontractor FROM public.subcontractors s WHERE s.id = p_subcontractor_id;

  SELECT COALESCE(jsonb_agg(vh.*), '[]'::JSONB) INTO v_vehicles FROM (
    SELECT
      v.id, v.vehicle_number, v.vehicle_type, v.model,
      public.calculate_monthly_totals(v.id, p_month, p_year) AS totals
    FROM public.vehicles v
    WHERE v.subcontractor_id = p_subcontractor_id
    ORDER BY v.vehicle_number
  ) vh;

  SELECT COALESCE(SUM(e.amount), 0) INTO v_expenses
  FROM public.expenses e
  WHERE e.subcontractor_id = p_subcontractor_id
    AND EXTRACT(MONTH FROM e.expense_date) = p_month
    AND EXTRACT(YEAR FROM e.expense_date) = p_year;

  SELECT COALESCE(SUM(totals->>'total_duty')::NUMERIC, 0) INTO v_total_duty
  FROM (
    SELECT public.calculate_monthly_totals(v.id, p_month, p_year) AS totals
    FROM public.vehicles v WHERE v.subcontractor_id = p_subcontractor_id
  ) t;

  RETURN jsonb_build_object(
    'subcontractor', v_subcontractor,
    'vehicles', v_vehicles,
    'subcontractor_expenses', v_expenses,
    'total_duty', v_total_duty
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10f. Get Driver Report
CREATE OR REPLACE FUNCTION public.get_driver_report(
  p_driver_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_driver JSONB;
  v_vehicle JSONB;
  v_salary JSONB;
  v_expenses JSONB;
  v_month_str TEXT;
BEGIN
  v_month_str := format('%s-%s', p_year, LPAD(p_month::TEXT, 2, '0'));

  SELECT jsonb_build_object(
    'id', d.id, 'full_name', d.full_name, 'father_name', d.father_name,
    'cnic', d.cnic, 'phone', d.phone, 'address', d.address,
    'driving_license', d.driving_license, 'joining_date', d.joining_date,
    'status', d.status, 'notes', d.notes
  ) INTO v_driver FROM public.drivers d WHERE d.id = p_driver_id;

  SELECT jsonb_build_object(
    'id', v.id, 'vehicle_number', v.vehicle_number,
    'vehicle_type', v.vehicle_type, 'model', v.model
  ) INTO v_vehicle FROM public.vehicles v WHERE v.id = (
    SELECT assigned_vehicle_id FROM public.drivers WHERE id = p_driver_id
  );

  SELECT to_jsonb(s) INTO v_salary FROM public.driver_salaries s
  WHERE s.driver_id = p_driver_id AND s.month = v_month_str LIMIT 1;

  SELECT COALESCE(jsonb_agg(e.*), '[]'::JSONB) INTO v_expenses FROM (
    SELECT
      ex.id, ex.expense_date, ec.name AS category_name,
      ex.amount, ex.remarks
    FROM public.expenses ex
    JOIN public.expense_categories ec ON ec.id = ex.category_id
    WHERE ex.driver_id = p_driver_id
      AND EXTRACT(MONTH FROM ex.expense_date) = p_month
      AND EXTRACT(YEAR FROM ex.expense_date) = p_year
    ORDER BY ex.expense_date
  ) e;

  RETURN jsonb_build_object(
    'driver', v_driver,
    'assigned_vehicle', v_vehicle,
    'salary', v_salary,
    'expenses', v_expenses
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10g. Get User Permissions (for frontend state)
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  r user_role;
  result JSONB := '{}'::JSONB;
  mod RECORD;
  actions TEXT[];
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = p_profile_id;

  IF FOUND AND r = 'super_admin' THEN
    FOR mod IN SELECT key FROM public.modules LOOP
      result := result || jsonb_build_object(mod.key, jsonb_build_object(
        'view', true, 'add', true, 'edit', true, 'delete', true
      ));
    END LOOP;
    RETURN result;
  END IF;

  FOR mod IN SELECT key FROM public.modules LOOP
    SELECT ARRAY(
      SELECT p.action FROM public.user_permissions up
      JOIN public.permissions p ON p.id = up.permission_id
      WHERE up.profile_id = p_profile_id AND p.module_key = mod.key
    ) INTO actions;

    result := result || jsonb_build_object(mod.key, jsonb_build_object(
      'view', 'view' = ANY(actions),
      'add', 'add' = ANY(actions),
      'edit', 'edit' = ANY(actions),
      'delete', 'delete' = ANY(actions)
    ));
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==================================================
-- Part 11: Updated At triggers
-- ==================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_drivers_updated_at ON public.drivers;
CREATE TRIGGER set_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_subcontractors_updated_at ON public.subcontractors;
CREATE TRIGGER set_subcontractors_updated_at BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_driver_salaries_updated_at ON public.driver_salaries;
CREATE TRIGGER set_driver_salaries_updated_at BEFORE UPDATE ON public.driver_salaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_monthly_records_updated_at ON public.monthly_records;
CREATE TRIGGER set_monthly_records_updated_at BEFORE UPDATE ON public.monthly_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_daily_records_updated_at ON public.daily_records;
CREATE TRIGGER set_daily_records_updated_at BEFORE UPDATE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER set_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.settings;
CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==================================================
-- Part 12: Grants & Permissions
-- ==================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==================================================
-- Part 13: Super Admin User Seeding
-- ==================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  v_encrypted_pw := crypt('admin123', gen_salt('bf', 10));
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@rideforu.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new,
      email_change_token_current, recovery_token, reauthentication_token,
      phone_change, phone_change_token, is_super_admin, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'admin@rideforu.com', v_encrypted_pw, NOW(), NULL, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin","role":"super_admin"}'::jsonb,
      NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE, FALSE
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, 'admin@rideforu.com')::jsonb,
      'email', v_user_id::text, NOW(), NOW(), NOW()
    );
  ELSE
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

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_user_id, v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, 'admin@rideforu.com')::jsonb,
        'email', v_user_id::text, NOW(), NOW(), NOW()
      );
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (v_user_id, 'Super Admin', 'admin@rideforu.com', 'super_admin', 'Active')
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Super Admin',
    email = 'admin@rideforu.com',
    role = 'super_admin',
    status = 'Active';

END $$;

-- ==================================================
-- End of Migration
-- ==================================================
