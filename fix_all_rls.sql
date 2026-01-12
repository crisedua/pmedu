-- FIX ALL SYNC & PERMISSION ISSUES (Universal Fix)

-- 1. Enable Realtime (Commented out to prevent errors if already enabled)
-- ALTER PUBLICATION supabase_realtime ADD TABLE pm_projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pm_tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pm_documents;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pm_files;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pm_inbox;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pm_users;

-- 2. Relax RLS for ALL tables

-- USERS (Critical for initial load)
DROP POLICY IF EXISTS "Enable read for all authenticated" ON pm_users;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON pm_users;
DROP POLICY IF EXISTS "Enable update for users themselves" ON pm_users;
CREATE POLICY "Enable read for all authenticated" ON pm_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users themselves" ON pm_users FOR UPDATE USING (auth.uid() = id);

-- Projects
DROP POLICY IF EXISTS "Enable read for owners" ON pm_projects;
DROP POLICY IF EXISTS "Enable read for all authenticated" ON pm_projects;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON pm_projects;
DROP POLICY IF EXISTS "Enable update for all authenticated" ON pm_projects;
DROP POLICY IF EXISTS "Enable delete for all authenticated" ON pm_projects;

CREATE POLICY "Enable read for all authenticated" ON pm_projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_projects FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks
DROP POLICY IF EXISTS "Enable read for owners" ON pm_tasks;
DROP POLICY IF EXISTS "Enable read for all authenticated" ON pm_tasks;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON pm_tasks;
DROP POLICY IF EXISTS "Enable update for all authenticated" ON pm_tasks;
DROP POLICY IF EXISTS "Enable delete for all authenticated" ON pm_tasks;

CREATE POLICY "Enable read for all authenticated" ON pm_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_tasks FOR DELETE USING (auth.role() = 'authenticated');

-- Inbox
DROP POLICY IF EXISTS "Enable read for owners" ON pm_inbox;
DROP POLICY IF EXISTS "Enable read for all authenticated" ON pm_inbox;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON pm_inbox;
DROP POLICY IF EXISTS "Enable update for all authenticated" ON pm_inbox;
DROP POLICY IF EXISTS "Enable delete for all authenticated" ON pm_inbox;

CREATE POLICY "Enable read for all authenticated" ON pm_inbox FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_inbox FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_inbox FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_inbox FOR DELETE USING (auth.role() = 'authenticated');

-- Documents
DROP POLICY IF EXISTS "Enable read for owners" ON pm_documents;
DROP POLICY IF EXISTS "Enable read for all authenticated" ON pm_documents;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON pm_documents;
DROP POLICY IF EXISTS "Enable update for all authenticated" ON pm_documents;
DROP POLICY IF EXISTS "Enable delete for all authenticated" ON pm_documents;

CREATE POLICY "Enable read for all authenticated" ON pm_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_documents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_documents FOR DELETE USING (auth.role() = 'authenticated');

-- Files
DROP POLICY IF EXISTS "Enable read for owners" ON pm_files;
DROP POLICY IF EXISTS "Enable read for all authenticated" ON pm_files;
DROP POLICY IF EXISTS "Enable insert for all authenticated" ON pm_files;
DROP POLICY IF EXISTS "Enable update for all authenticated" ON pm_files;
DROP POLICY IF EXISTS "Enable delete for all authenticated" ON pm_files;

CREATE POLICY "Enable read for all authenticated" ON pm_files FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_files FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_files FOR DELETE USING (auth.role() = 'authenticated');
