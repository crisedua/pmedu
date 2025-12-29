# Admin & User Management Update

## ✅ What Was Added

### 1. **Admin Role System**
- Added `role` field to users table (`admin` or `user`)
- `ed@eduardoescalante.com` is **automatically set as admin** when registered
- Database trigger ensures the admin role persists

### 2. **User Management Features**
- **New Modal**: `ManageProjectMembersModal` for managing project members
- Accessible from Project → Menu (⋮) → "Manage Members"
- **Permissions**: Only admins and project owners can manage members

### 3. **Features in Member Management**
- ✅ View all current project members
- ✅ Add new members to the project
- ✅ Remove members from the project
- ✅ Visual badges for:
  - **Owner** badge (project owner)
  - **Admin** badge with shield icon (admin users)
- ✅ Protection: Cannot remove project owner

## 🗄️ **Database Changes**

The `database-schema.sql` has been updated with:

```sql
-- Added role column
role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'))

-- Automatic admin assignment
CREATE FUNCTION set_admin_role() -- Sets admin for ed@eduardoescalante.com
CREATE TRIGGER set_admin_role_trigger -- Runs on insert/update
```

## 🚀 **Setup Instructions**

### Important: Re-run the Database Schema

You need to run the updated SQL again:

1. Go to Supabase Dashboard → SQL Editor
2. **Delete** the old query
3. Create **New Query**
4. Copy the entire contents of `database-schema.sql`
5. Click **Run**

This will:
- Add the `role` column
- Create the trigger function
- Set ed@eduardoescalante.com as admin (if user exists)

### Alternative: Add Column Manually

If you want to keep existing data, run this SQL instead:

```sql
-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
  CHECK (role IN ('admin', 'user'));

-- Create function
CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ed@eduardoescalante.com' THEN
    NEW.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_admin_role_trigger ON users;
CREATE TRIGGER set_admin_role_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_role();

-- Update existing admin user
UPDATE users SET role = 'admin' WHERE email = 'ed@eduardoescalante.com';
```

## 📋 **How to Use**

### As Admin (ed@eduardoescalante.com):
1. Sign up with `ed@eduardoescalante.com`
2. Create or open a project
3. Click the menu (⋮) in the top right
4. Click "Manage Members"
5. Add users to your project
6. You can manage **any project** (admin privilege)

### As Project Owner:
1. Create a project
2. Click menu (⋮) → "Manage Members"
3. Add team members to your project
4. Remove members (except yourself)

### As Regular Member:
- Can view project
- Can see who the owner/admin is
- Cannot access "Manage Members"

## 🎨 **UI Features**

- **Role Badges**:
  - Blue "Owner" badge for project owners
  - Amber "Admin" badge with shield icon for admins
- **Member List**: Shows avatar, name, email, and role
- **Add Members**: Lists all users not yet in the project
- **Protection**: Cannot remove project owner

## 🔐 **Permissions**

| Action | Admin | Project Owner | Member |
|--------|-------|---------------|---------|
| View project | ✅ | ✅ | ✅ |
| Edit project | ✅ | ✅ | ❌ |
| Add members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ | ❌ |

## 📝 **Files Modified**

1. **database-schema.sql** - Added role field and trigger
2. **ManageProjectMembersModal.jsx** - New modal component
3. **ProjectView.jsx** - Added menu item and modal

## ✅ **Testing**

1. Register with `ed@eduardoescalante.com` → You're admin
2. Go to Table Editor in Supabase → Check `users` table → Role = 'admin' ✅
3. Create a project
4. Click menu → "Manage Members"
5. Add another user to the project
6. Check that badges appear correctly

Enjoy your new admin powers! 🎉
