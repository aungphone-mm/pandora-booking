-- Migration: Add "completed" status to appointments
-- Description: Updates the status check constraint to include "completed"
-- Date: 2025-12-20

-- Drop the existing check constraint
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new check constraint with "completed" status
ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- Update any existing appointments if needed
-- (Optional: Uncomment if you want to auto-complete old confirmed appointments)
-- UPDATE appointments
-- SET status = 'completed'
-- WHERE status = 'confirmed'
--   AND appointment_date < CURRENT_DATE;

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'appointments_status_check';
