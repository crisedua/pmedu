-- MIGRATION SCRIPT: Voice-First PM Command Center
-- Run this on existing databases to add the new fields without recreating tables
-- This is safe to run multiple times (idempotent)

-- 1. Add source column to pm_tasks if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pm_tasks' AND column_name = 'source') THEN
        ALTER TABLE pm_tasks ADD COLUMN source TEXT DEFAULT 'manual' 
            CHECK (source IN ('voice', 'upload', 'email', 'manual'));
    END IF;
END $$;

-- 2. Add audio_file_id to pm_inbox if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pm_inbox' AND column_name = 'audio_file_id') THEN
        ALTER TABLE pm_inbox ADD COLUMN audio_file_id UUID REFERENCES pm_files(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create pm_task_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS pm_task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES pm_tasks(id) ON DELETE CASCADE,
  file_id UUID REFERENCES pm_files(id) ON DELETE CASCADE,
  attached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, file_id)
);

-- 4. Enable RLS on new table
ALTER TABLE pm_task_attachments ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for task_attachments
DROP POLICY IF EXISTS "Allow everything for task_attachments" ON pm_task_attachments;
CREATE POLICY "Allow everything for task_attachments" ON pm_task_attachments FOR ALL USING (true) WITH CHECK (true);

-- Done! All existing tasks will have source = 'manual' (default)
