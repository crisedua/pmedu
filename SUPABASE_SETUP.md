# Supabase Setup Guide

## Step 1: Create Database Tables

1. Go to your Supabase Dashboard: https://qbxfvbzavcpxduyrgczc.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `database-schema.sql` into the query editor
5. Click **Run** to execute the SQL

This will create all necessary tables:
- `users`
- `projects`
- `tasks`
- `documents`
- `files`

## Step 2: Verify Tables

1. Go to **Table Editor** in the Supabase Dashboard
2. You should see all 5 tables listed
3. Click on each table to verify the columns are created correctly

## Step 3: Seed Initial Data

The application will automatically seed sample users when you first load it. If you want to manually add more data:

1. In the **Table Editor**, select the `users` table
2. Click **Insert** > **Insert row**
3. Add user data (name, email, avatar)
4. Repeat for other tables as needed

## Step 4: Test the Connection

1. Make sure the dev server is running: `npm run dev`
2. Open the browser DevTools Console (F12)
3. Look for any Supabase connection errors
4. The app should automatically load data from Supabase

## Optional: Configure Row Level Security (RLS)

The current setup allows all operations for simplicity. For production, you should:

1. Update RLS policies to restrict access based on user authentication
2. Implement Supabase Auth instead of the simple email-based login
3. Add specific policies for each table

Example policy for projects (authenticated users only):
```sql
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = ANY(members));
```

## Troubleshooting

**Connection Issues:**
- Check that `.env` file exists and has correct values
- Verify Supabase URL and anon key are correct
- Check browser console for specific error messages

**Data Not Appearing:**
- Check Supabase Dashboard > Table Editor to see if data exists
- Verify RLS policies are not blocking reads
- Check browser console for query errors

**Real-time Not Working:**
- Verify Realtime is enabled in Supabase Dashboard > Settings > API
- Check that table replication is enabled
- Look for subscription errors in console
