-- Inbox Table (with pm_ prefix)
CREATE TABLE IF NOT EXISTS pm_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  language TEXT,
  user_id UUID REFERENCES pm_users(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pm_inbox ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for owners" ON pm_inbox FOR SELECT USING (auth.uid() = user_id OR true); -- true for now as we use simplified auth
CREATE POLICY "Enable insert for owners" ON pm_inbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for owners" ON pm_inbox FOR UPDATE USING (true);
CREATE POLICY "Enable delete for owners" ON pm_inbox FOR DELETE USING (true);
