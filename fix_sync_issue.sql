-- FIX SYNC ISSUES (RLS & Realtime)

-- 1. Enable Realtime for pm_inbox (Critical for sync between browsers)
-- Check if table is in publication, if not add it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pm_inbox'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pm_inbox;
  END IF;
END $$;

-- 2. Fix RLS Policies to be permissive (Fixes cross-browser visibility if IDs don't match)
-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Enable read for owners" ON pm_inbox;
DROP POLICY IF EXISTS "Enable insert for owners" ON pm_inbox;
DROP POLICY IF EXISTS "Enable update for owners" ON pm_inbox;
DROP POLICY IF EXISTS "Enable delete for owners" ON pm_inbox;
DROP POLICY IF EXISTS "Users can view their own inbox items" ON pm_inbox;

-- Recreate permissive policies (assuming authentication is handled by app logic for now)
CREATE POLICY "Enable read for all authenticated" ON pm_inbox FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_inbox FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_inbox FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_inbox FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Also check pm_users RLS just in case
DROP POLICY IF EXISTS "Read access for all authenticated users" ON pm_users;
CREATE POLICY "Read access for all authenticated users" ON pm_users FOR SELECT USING (auth.role() = 'authenticated');
