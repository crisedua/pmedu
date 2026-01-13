-- AIDO USERS TABLE MIGRATION
-- This script creates ONLY the 'aido_users' table.
-- Run this in your Supabase SQL Editor (https://qbxfvbzavcpxduyrgczc.supabase.co)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS aido_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE aido_users ENABLE ROW LEVEL SECURITY;

-- 4. Allow All Operations (Development Mode)
CREATE POLICY "Allow all for aido_users" ON aido_users FOR ALL USING (true) WITH CHECK (true);

-- 5. Admin Trigger
CREATE OR REPLACE FUNCTION set_aido_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ed@eduardoescalante.com' THEN
    NEW.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_aido_admin_role_trigger ON aido_users;
CREATE TRIGGER set_aido_admin_role_trigger
  BEFORE INSERT OR UPDATE ON aido_users
  FOR EACH ROW
  EXECUTE FUNCTION set_aido_admin_role();
