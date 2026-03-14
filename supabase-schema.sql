-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  api_key TEXT,
  base_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create broadcast_lists table
CREATE TABLE IF NOT EXISTS broadcast_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  list_id TEXT REFERENCES broadcast_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  list_id TEXT
);

-- Enable RLS (Row Level Security) - For this prototype, we'll allow all access
-- In a real app, you should restrict this to authenticated users
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to settings" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all access to broadcast_lists" ON broadcast_lists FOR ALL USING (true);
CREATE POLICY "Allow all access to contacts" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all access to reports" ON reports FOR ALL USING (true);
