-- Create payroll_settings table to store configurable payroll calculation parameters
CREATE TABLE IF NOT EXISTS payroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO payroll_settings (setting_key, setting_value, description) VALUES
  ('product_commission_rate', 10.00, 'Commission rate for product sales (percentage)'),
  ('buffer_time_minutes', 15.00, 'Buffer time per appointment for setup/cleanup (minutes)'),
  ('retention_bonus_per_repeat', 50.00, 'Bonus amount per repeat customer ($)'),
  ('retention_bonus_threshold', 3.00, 'Number of repeat customers needed for extra bonus'),
  ('retention_bonus_extra', 200.00, 'Extra bonus when threshold is reached ($)')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read payroll settings"
  ON payroll_settings FOR SELECT
  USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update payroll settings"
  ON payroll_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

COMMENT ON TABLE payroll_settings IS 'Configurable parameters for payroll calculations';
COMMENT ON COLUMN payroll_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN payroll_settings.setting_value IS 'Numeric value of the setting';
COMMENT ON COLUMN payroll_settings.description IS 'Human-readable description of what this setting controls';
