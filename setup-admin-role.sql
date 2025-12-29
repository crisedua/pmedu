-- Admin Role Setup for Project Management App
-- Run this in Supabase SQL Editor if you haven't already

-- Step 1: Check if role column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- Step 2: Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
  CHECK (role IN ('admin', 'user'));

-- Step 3: Create function to auto-assign admin role
CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ed@eduardoescalante.com' THEN
    NEW.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS set_admin_role_trigger ON users;
CREATE TRIGGER set_admin_role_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_role();

-- Step 5: Update existing user to admin (if already registered)
UPDATE users SET role = 'admin' WHERE email = 'ed@eduardoescalante.com';

-- Step 6: Verify the setup
SELECT id, name, email, role FROM users ORDER BY created_at DESC;
