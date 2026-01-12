-- FIX ALL SYNC & PERMISSION ISSUES (Universal Fix)

-- 1. Enable Realtime for ALL tables
ALTER PUBLICATION supabase_realtime ADD TABLE pm_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE pm_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE pm_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE pm_files;
-- pm_inbox and pm_users should already be there from previous fix, but good to ensure
ALTER PUBLICATION supabase_realtime ADD TABLE pm_inbox;
ALTER PUBLICATION supabase_realtime ADD TABLE pm_users;

-- 2. Relax RLS for ALL tables
-- Projects
DROP POLICY IF EXISTS "Enable read for owners" ON pm_projects;
CREATE POLICY "Enable read for all authenticated" ON pm_projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_projects FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks
DROP POLICY IF EXISTS "Enable read for owners" ON pm_tasks;
CREATE POLICY "Enable read for all authenticated" ON pm_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_tasks FOR DELETE USING (auth.role() = 'authenticated');

-- Documents
DROP POLICY IF EXISTS "Enable read for owners" ON pm_documents;
CREATE POLICY "Enable read for all authenticated" ON pm_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_documents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_documents FOR DELETE USING (auth.role() = 'authenticated');

-- Files
DROP POLICY IF EXISTS "Enable read for owners" ON pm_files;
CREATE POLICY "Enable read for all authenticated" ON pm_files FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all authenticated" ON pm_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for all authenticated" ON pm_files FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for all authenticated" ON pm_files FOR DELETE USING (auth.role() = 'authenticated');
