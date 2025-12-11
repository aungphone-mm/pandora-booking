-- Migration: Add missing columns to appointments table (Simplified for rate limit issues)
-- Description: Core schema changes only, without data backfill
-- Date: 2025-12-11

-- Make customer_email nullable (form shows it as optional)
ALTER TABLE appointments
ALTER COLUMN customer_email DROP NOT NULL;

-- Add total_price column
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- Add staff_id column
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- Add updated_at column
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on staff_id
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
