-- Database Schema for Project Management App (Scoped with pm_ prefix)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS pm_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS pm_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Planning',
  owner_id UUID REFERENCES pm_users(id) ON DELETE CASCADE,
  members UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS pm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES pm_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'To Do',
  project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
  created_by_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS pm_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES pm_users(id) ON DELETE SET NULL,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS pm_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  size BIGINT,
  project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES pm_users(id) ON DELETE SET NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  storage_path TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pm_projects_owner ON pm_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_project ON pm_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_assigned ON pm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_pm_documents_project ON pm_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_files_project ON pm_files(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE pm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all operations for now - you can restrict later)
-- Users
CREATE POLICY "Enable read access for all users" ON pm_users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON pm_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON pm_users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON pm_users FOR DELETE USING (true);

-- Projects
CREATE POLICY "Enable read access for all users" ON pm_projects FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON pm_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON pm_projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON pm_projects FOR DELETE USING (true);

-- Tasks
CREATE POLICY "Enable read access for all users" ON pm_tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON pm_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON pm_tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON pm_tasks FOR DELETE USING (true);

-- Documents
CREATE POLICY "Enable read access for all users" ON pm_documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON pm_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON pm_documents FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON pm_documents FOR DELETE USING (true);

-- Files
CREATE POLICY "Enable read access for all users" ON pm_files FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON pm_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON pm_files FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON pm_files FOR DELETE USING (true);

-- Function to set admin role for specific email
CREATE OR REPLACE FUNCTION set_pm_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ed@eduardoescalante.com' THEN
    NEW.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set admin role
DROP TRIGGER IF EXISTS set_pm_admin_role_trigger ON pm_users;
CREATE TRIGGER set_pm_admin_role_trigger
  BEFORE INSERT OR UPDATE ON pm_users
  FOR EACH ROW
  EXECUTE FUNCTION set_pm_admin_role();

-- Update existing user if they already exist
UPDATE pm_users SET role = 'admin' WHERE email = 'ed@eduardoescalante.com';
