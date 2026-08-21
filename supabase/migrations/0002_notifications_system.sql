-- =========================================================================
-- NOTIFICATIONS SYSTEM TABLE & POLICIES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'Staff',
  action TEXT NOT NULL DEFAULT 'UPDATE',
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  target_url TEXT NOT NULL DEFAULT '/dashboard',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated on notifications" ON public.notifications;
CREATE POLICY "Allow all for authenticated on notifications" ON public.notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on notifications" ON public.notifications;
CREATE POLICY "Allow all for anon on notifications" ON public.notifications
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON public.notifications TO postgres, anon, authenticated, service_role;

-- Enable Realtime for notifications table (safe if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
