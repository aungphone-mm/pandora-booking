-- Migration: Add missing columns to appointments table
-- Description: Adds total_price, staff_id, and updated_at columns to support current application code
--              Also makes customer_email nullable to match form UX (email is optional)
-- Date: 2025-12-11

-- Make customer_email nullable (form shows it as optional, so database should allow NULL)
ALTER TABLE appointments
ALTER COLUMN customer_email DROP NOT NULL;

-- Add total_price column to store the total cost of the appointment (service + products)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- Add staff_id column to track which staff member is assigned to the appointment
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- Add updated_at column to track when appointments are modified
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create an index on staff_id for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optionally set default values for existing records
-- Update existing appointments with calculated total_price based on service price
UPDATE appointments a
SET total_price = s.price
FROM services s
WHERE a.service_id = s.id
AND a.total_price IS NULL;

-- Add comment to document the columns
COMMENT ON COLUMN appointments.total_price IS 'Total price including service and any additional products';
COMMENT ON COLUMN appointments.staff_id IS 'Reference to the staff member assigned to this appointment (nullable)';
COMMENT ON COLUMN appointments.updated_at IS 'Timestamp of last update, automatically maintained by trigger';
