-- Inbox Table
CREATE TABLE IF NOT EXISTS inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  language TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for owners" ON inbox FOR SELECT USING (auth.uid() = user_id OR true); -- true for now as we use simplified auth
CREATE POLICY "Enable insert for owners" ON inbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for owners" ON inbox FOR UPDATE USING (true);
CREATE POLICY "Enable delete for owners" ON inbox FOR DELETE USING (true);
