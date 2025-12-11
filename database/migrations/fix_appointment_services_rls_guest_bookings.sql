-- Migration: Fix RLS policy for guest bookings in appointment_services and appointment_products
-- Description: Allows viewing appointment_services and appointment_products for guest bookings (user_id IS NULL)
--               This enables booking search to work for unauthenticated users and guest bookings
-- Date: 2025-01-XX

-- Drop policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Anyone can view guest appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Anyone can view guest appointment products" ON appointment_products;

-- Allow viewing appointment_services for guest bookings (user_id IS NULL)
-- Booking IDs are meant to be shareable, so anyone with a booking ID should be able to view the booking details
CREATE POLICY "Anyone can view guest appointment services"
  ON appointment_services
  FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE user_id IS NULL
    )
  );

-- Allow viewing appointment_products for guest bookings (user_id IS NULL)
-- Same reasoning as above - booking details should be accessible via booking ID
CREATE POLICY "Anyone can view guest appointment products"
  ON appointment_products
  FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE user_id IS NULL
    )
  );

