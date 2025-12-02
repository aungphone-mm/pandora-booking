-- Create user_sessions table for tracking user visits and device information
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User information (NULL for guest visitors)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,

  -- Session timing
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Device information
  device_info JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  platform TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  device_model TEXT,

  -- Screen information
  screen_resolution TEXT,
  viewport_size TEXT,

  -- Location and network
  timezone TEXT,
  language TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,

  -- Page information
  page_url TEXT,
  referrer TEXT,
  landing_page TEXT,

  -- Additional metadata
  is_mobile BOOLEAN DEFAULT false,
  is_tablet BOOLEAN DEFAULT false,
  is_desktop BOOLEAN DEFAULT false,
  is_bot BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_type ON user_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_sessions_updated_at_trigger
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own sessions
CREATE POLICY "Users can insert their own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all sessions
CREATE POLICY "Admins can view all sessions"
  ON user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Comments for documentation
COMMENT ON TABLE user_sessions IS 'Tracks user sessions including device information, timing, and user details';
COMMENT ON COLUMN user_sessions.device_info IS 'JSON object containing detailed device information';
COMMENT ON COLUMN user_sessions.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN user_sessions.session_start IS 'When the session started';
COMMENT ON COLUMN user_sessions.duration_seconds IS 'How long the session lasted in seconds';
