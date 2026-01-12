-- Migration: Add action_type to pm_tasks
-- Run this in Supabase SQL Editor

ALTER TABLE pm_tasks ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'todo';

-- Optional: Update existing records based on logic (optional)
-- UPDATE pm_tasks SET action_type = 'todo' WHERE action_type IS NULL;
