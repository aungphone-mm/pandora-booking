-- Migration: Add support for multiple services per appointment
-- Description: Creates appointment_services junction table to allow booking multiple services
-- Date: 2025-12-11

-- Create appointment_services junction table (similar to appointment_products)
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL, -- Store price at time of booking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id
  ON appointment_services(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id
  ON appointment_services(service_id);

-- Add unique constraint to prevent duplicate service entries for same appointment
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_services_unique
  ON appointment_services(appointment_id, service_id);

-- Make service_id nullable in appointments table (now using junction table)
-- Keep it for backward compatibility but it won't be required
ALTER TABLE appointments
ALTER COLUMN service_id DROP NOT NULL;

-- Add comments to document the schema
COMMENT ON TABLE appointment_services IS 'Junction table linking appointments to multiple services';
COMMENT ON COLUMN appointment_services.price IS 'Service price at time of booking (for historical accuracy)';
COMMENT ON COLUMN appointment_services.quantity IS 'Number of times this service is booked (usually 1)';

-- Migrate existing appointments to use the junction table
-- This moves single service appointments to the new structure
INSERT INTO appointment_services (appointment_id, service_id, price)
SELECT
  a.id,
  a.service_id,
  COALESCE(s.price, 0)
FROM appointments a
LEFT JOIN services s ON s.id = a.service_id
WHERE a.service_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add RLS (Row Level Security) policies if needed
-- Users can view their own appointment services
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their appointment services"
  ON appointment_services
  FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE user_id = auth.uid()
    )
  );

-- Admins can view all appointment services
CREATE POLICY "Admins can view all appointment services"
  ON appointment_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Users can insert appointment services for their appointments
CREATE POLICY "Users can insert appointment services"
  ON appointment_services
  FOR INSERT
  WITH CHECK (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Admins can manage all appointment services
CREATE POLICY "Admins can manage all appointment services"
  ON appointment_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
