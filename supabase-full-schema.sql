-- CLEANUP AND COMPREHENSIVE SCHEMA
-- This script drops existing policies to avoid "policy already exists" errors.
-- Run this in your Supabase SQL Editor.

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tables (Using IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS pm_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pm_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Planning',
  owner_id UUID REFERENCES pm_users(id) ON DELETE CASCADE,
  members UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES pm_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'To Do',
  project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
  created_by_ai BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'manual' CHECK (source IN ('voice', 'upload', 'email', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pm_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES pm_users(id) ON DELETE SET NULL,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS pm_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  language TEXT,
  user_id UUID REFERENCES pm_users(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT FALSE,
  audio_file_id UUID REFERENCES pm_files(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Attachments (links files to tasks)
CREATE TABLE IF NOT EXISTS pm_task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES pm_tasks(id) ON DELETE CASCADE,
  file_id UUID REFERENCES pm_files(id) ON DELETE CASCADE,
  attached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, file_id)
);

-- 3. Enable RLS
ALTER TABLE pm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_task_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Clean up and Recreate Policies
-- Users
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read for all users" ON pm_users;
    DROP POLICY IF EXISTS "Allow all inserts for users" ON pm_users;
    DROP POLICY IF EXISTS "Allow all updates for users" ON pm_users;
    DROP POLICY IF EXISTS "Allow all deletes for users" ON pm_users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON pm_users;
    DROP POLICY IF EXISTS "Enable insert for all users" ON pm_users;
    DROP POLICY IF EXISTS "Enable update for all users" ON pm_users;
    DROP POLICY IF EXISTS "Enable delete for all users" ON pm_users;
END $$;

CREATE POLICY "Allow all operations for users" ON pm_users FOR ALL USING (true) WITH CHECK (true);

-- Projects
DROP POLICY IF EXISTS "Allow everything for projects" ON pm_projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON pm_projects;
DROP POLICY IF EXISTS "Enable insert for all users" ON pm_projects;
DROP POLICY IF EXISTS "Enable update for all users" ON pm_projects;
DROP POLICY IF EXISTS "Enable delete for all users" ON pm_projects;
CREATE POLICY "Allow everything for projects" ON pm_projects FOR ALL USING (true) WITH CHECK (true);

-- Tasks
DROP POLICY IF EXISTS "Allow everything for tasks" ON pm_tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON pm_tasks;
DROP POLICY IF EXISTS "Enable insert for all users" ON pm_tasks;
DROP POLICY IF EXISTS "Enable update for all users" ON pm_tasks;
DROP POLICY IF EXISTS "Enable delete for all users" ON pm_tasks;
CREATE POLICY "Allow everything for tasks" ON pm_tasks FOR ALL USING (true) WITH CHECK (true);

-- Documents
DROP POLICY IF EXISTS "Allow everything for documents" ON pm_documents;
DROP POLICY IF EXISTS "Enable read access for all users" ON pm_documents;
DROP POLICY IF EXISTS "Enable insert for all users" ON pm_documents;
DROP POLICY IF EXISTS "Enable update for all users" ON pm_documents;
DROP POLICY IF EXISTS "Enable delete for all users" ON pm_documents;
CREATE POLICY "Allow everything for documents" ON pm_documents FOR ALL USING (true) WITH CHECK (true);

-- Files
DROP POLICY IF EXISTS "Allow everything for files" ON pm_files;
DROP POLICY IF EXISTS "Enable read access for all users" ON pm_files;
DROP POLICY IF EXISTS "Enable insert for all users" ON pm_files;
DROP POLICY IF EXISTS "Enable update for all users" ON pm_files;
DROP POLICY IF EXISTS "Enable delete for all users" ON pm_files;
CREATE POLICY "Allow everything for files" ON pm_files FOR ALL USING (true) WITH CHECK (true);

-- Inbox
DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow everything for inbox" ON pm_inbox;
    DROP POLICY IF EXISTS "Enable read for owners" ON pm_inbox;
    DROP POLICY IF EXISTS "Enable insert for owners" ON pm_inbox;
    DROP POLICY IF EXISTS "Enable update for owners" ON pm_inbox;
    DROP POLICY IF EXISTS "Enable delete for owners" ON pm_inbox;
END $$;
CREATE POLICY "Allow everything for inbox" ON pm_inbox FOR ALL USING (true) WITH CHECK (true);

-- Task Attachments
DROP POLICY IF EXISTS "Allow everything for task_attachments" ON pm_task_attachments;
CREATE POLICY "Allow everything for task_attachments" ON pm_task_attachments FOR ALL USING (true) WITH CHECK (true);

-- 5. Admin Trigger
CREATE OR REPLACE FUNCTION set_pm_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ed@eduardoescalante.com' THEN
    NEW.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pm_admin_role_trigger ON pm_users;
CREATE TRIGGER set_pm_admin_role_trigger
  BEFORE INSERT OR UPDATE ON pm_users
  FOR EACH ROW
  EXECUTE FUNCTION set_pm_admin_role();
