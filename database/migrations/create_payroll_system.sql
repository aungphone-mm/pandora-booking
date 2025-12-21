-- Migration: Create Hybrid Payroll System
-- Description: Adds payroll, commission, bonus, and compensation tracking
-- Date: 2025-12-19

-- =============================================
-- 1. COMPENSATION PROFILES
-- =============================================
-- Defines flexible pay structure options for staff
CREATE TABLE IF NOT EXISTS compensation_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- e.g., "High Base Low Commission", "Balanced", "Commission Heavy"
  description TEXT,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0, -- Percentage (e.g., 15.00 for 15%)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default compensation profiles
INSERT INTO compensation_profiles (name, description, hourly_rate, commission_rate) VALUES
  ('High Base, Low Commission', 'Stable income with minimal commission', 25.00, 5.00),
  ('Balanced', 'Balance between hourly and commission', 18.00, 15.00),
  ('Commission Heavy', 'Lower hourly rate, higher commission potential', 12.00, 30.00),
  ('Pure Commission', 'No hourly rate, maximum commission', 0.00, 50.00);

COMMENT ON TABLE compensation_profiles IS 'Flexible pay structure templates for staff';

-- =============================================
-- 2. PERFORMANCE TIERS
-- =============================================
-- Commission tier levels based on monthly performance
CREATE TABLE IF NOT EXISTS performance_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- e.g., "Bronze", "Silver", "Gold", "Platinum"
  min_appointments INTEGER NOT NULL, -- Minimum appointments per month
  max_appointments INTEGER, -- Maximum appointments (null for unlimited)
  commission_multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.00, -- e.g., 1.5 for 50% bonus
  monthly_bonus DECIMAL(10, 2) DEFAULT 0, -- Fixed bonus for reaching tier
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default performance tiers
INSERT INTO performance_tiers (name, min_appointments, max_appointments, commission_multiplier, monthly_bonus, display_order) VALUES
  ('Bronze', 0, 20, 1.00, 0, 1),
  ('Silver', 21, 40, 1.20, 100, 2),
  ('Gold', 41, 60, 1.50, 300, 3),
  ('Platinum', 61, NULL, 2.00, 500, 4);

COMMENT ON TABLE performance_tiers IS 'Performance-based commission tier system';

-- =============================================
-- 3. SERVICE TYPE MULTIPLIERS
-- =============================================
-- Commission multipliers for different service types
CREATE TABLE IF NOT EXISTS service_commission_multipliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.00, -- e.g., 1.5 for premium services
  description TEXT, -- e.g., "Premium service", "Basic service"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_commission_service_id
  ON service_commission_multipliers(service_id);

COMMENT ON TABLE service_commission_multipliers IS 'Commission multipliers for different service types';

-- =============================================
-- 4. TEAM BONUSES
-- =============================================
-- Salon-wide team bonus goals and achievements
CREATE TABLE IF NOT EXISTS team_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  bonus_type TEXT NOT NULL, -- 'revenue_target', 'satisfaction_rating', 'zero_cancellations', 'new_customers'
  target_value DECIMAL(10, 2), -- Target revenue, rating, customer count, etc.
  bonus_amount DECIMAL(10, 2) NOT NULL,
  distribution_method TEXT DEFAULT 'equal', -- 'equal', 'proportional', 'performance_based'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_bonuses_period
  ON team_bonuses(period_start, period_end);

COMMENT ON TABLE team_bonuses IS 'Team-based bonuses for salon-wide goals';

-- =============================================
-- 5. CUSTOM BONUSES
-- =============================================
-- Admin-created custom bonuses for staff
CREATE TABLE IF NOT EXISTS staff_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL, -- 'milestone', 'holiday', 'quality', 'speed', 'referral', 'custom'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  awarded_date DATE DEFAULT CURRENT_DATE,
  period_month INTEGER, -- Month number (1-12) for monthly bonuses
  period_year INTEGER, -- Year for monthly bonuses
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_bonuses_staff_id
  ON staff_bonuses(staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_bonuses_period
  ON staff_bonuses(period_year, period_month);

COMMENT ON TABLE staff_bonuses IS 'Individual custom bonuses for staff members';

-- =============================================
-- 6. STAFF COMPENSATION ASSIGNMENTS
-- =============================================
-- Links staff to their chosen compensation profile
ALTER TABLE staff ADD COLUMN IF NOT EXISTS compensation_profile_id UUID REFERENCES compensation_profiles(id);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS skill_premium_hourly DECIMAL(10, 2) DEFAULT 0; -- Additional $/hour for certifications
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_change_profile_at DATE; -- Next date they can switch profiles

-- Update existing staff to use default "Balanced" profile
UPDATE staff
SET compensation_profile_id = (SELECT id FROM compensation_profiles WHERE name = 'Balanced' LIMIT 1)
WHERE compensation_profile_id IS NULL;

-- =============================================
-- 7. MONTHLY PAYROLL RECORDS
-- =============================================
-- Monthly payroll calculations for each staff member
CREATE TABLE IF NOT EXISTS monthly_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL, -- 1-12
  period_year INTEGER NOT NULL,

  -- Hours & Base Pay
  total_hours DECIMAL(10, 2) DEFAULT 0,
  hourly_rate DECIMAL(10, 2) DEFAULT 0,
  base_pay DECIMAL(10, 2) DEFAULT 0,

  -- Appointments & Commissions
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  total_service_revenue DECIMAL(10, 2) DEFAULT 0,
  total_product_sales DECIMAL(10, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2) DEFAULT 0,
  base_commission DECIMAL(10, 2) DEFAULT 0,

  -- Performance Tier
  performance_tier_id UUID REFERENCES performance_tiers(id),
  tier_multiplier DECIMAL(5, 2) DEFAULT 1.00,
  tier_bonus DECIMAL(10, 2) DEFAULT 0,
  adjusted_commission DECIMAL(10, 2) DEFAULT 0,

  -- Bonuses
  individual_bonuses DECIMAL(10, 2) DEFAULT 0, -- Sum of custom bonuses
  team_bonuses DECIMAL(10, 2) DEFAULT 0, -- Share of team bonuses
  skill_premium DECIMAL(10, 2) DEFAULT 0, -- Certification/skill bonuses
  retention_bonus DECIMAL(10, 2) DEFAULT 0, -- Customer retention bonuses
  total_bonuses DECIMAL(10, 2) DEFAULT 0,

  -- Totals
  gross_pay DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0, -- Uniforms, kit fees, etc.
  net_pay DECIMAL(10, 2) DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'calculated', 'approved', 'paid'
  calculated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(staff_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_payroll_staff
  ON monthly_payroll(staff_id);

CREATE INDEX IF NOT EXISTS idx_monthly_payroll_period
  ON monthly_payroll(period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_monthly_payroll_status
  ON monthly_payroll(status);

COMMENT ON TABLE monthly_payroll IS 'Monthly payroll records with detailed earnings breakdown';

-- =============================================
-- 8. COMMISSION TRANSACTIONS
-- =============================================
-- Detailed commission tracking per appointment
CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),

  service_price DECIMAL(10, 2) NOT NULL,
  base_commission_rate DECIMAL(5, 2) NOT NULL,
  service_multiplier DECIMAL(5, 2) DEFAULT 1.00,
  tier_multiplier DECIMAL(5, 2) DEFAULT 1.00,

  commission_amount DECIMAL(10, 2) NOT NULL,

  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_staff
  ON commission_transactions(staff_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_appointment
  ON commission_transactions(appointment_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_period
  ON commission_transactions(period_year, period_month);

COMMENT ON TABLE commission_transactions IS 'Detailed commission tracking per appointment';

-- =============================================
-- 9. PRODUCT COMMISSION TRANSACTIONS
-- =============================================
-- Track product sales commissions
CREATE TABLE IF NOT EXISTS product_commission_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),

  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00, -- Default 10% on products
  commission_amount DECIMAL(10, 2) NOT NULL,

  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_commission_staff
  ON product_commission_transactions(staff_id);

CREATE INDEX IF NOT EXISTS idx_product_commission_period
  ON product_commission_transactions(period_year, period_month);

COMMENT ON TABLE product_commission_transactions IS 'Product sales commission tracking';

-- =============================================
-- 10. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE compensation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_commission_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_commission_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to compensation_profiles"
  ON compensation_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to performance_tiers"
  ON performance_tiers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to service_commission_multipliers"
  ON service_commission_multipliers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to team_bonuses"
  ON team_bonuses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to staff_bonuses"
  ON staff_bonuses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to monthly_payroll"
  ON monthly_payroll FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to commission_transactions"
  ON commission_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins full access to product_commission_transactions"
  ON product_commission_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Staff can view their own payroll data
CREATE POLICY "Staff can view own payroll"
  ON monthly_payroll FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Staff can view own commissions"
  ON commission_transactions FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Staff can view own product commissions"
  ON product_commission_transactions FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Staff can view own bonuses"
  ON staff_bonuses FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE email = auth.jwt()->>'email')
  );

-- Everyone can view active compensation profiles and tiers
CREATE POLICY "Anyone can view active compensation profiles"
  ON compensation_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active performance tiers"
  ON performance_tiers FOR SELECT
  USING (is_active = true);

-- =============================================
-- 11. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_compensation_profiles_updated_at BEFORE UPDATE ON compensation_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_commission_multipliers_updated_at BEFORE UPDATE ON service_commission_multipliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_bonuses_updated_at BEFORE UPDATE ON team_bonuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_payroll_updated_at BEFORE UPDATE ON monthly_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
