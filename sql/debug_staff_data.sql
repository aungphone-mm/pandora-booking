-- Debug queries to check your database structure and data
-- Run these one by one in Supabase SQL Editor

-- 1. Check if staff_id column was added to appointments table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('staff_id', 'staff_notes');

-- 2. Check existing appointments and their staff_id values
SELECT id, customer_name, staff_id, created_at 
FROM public.appointments 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if staff table exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff';

-- 4. Check staff table data
SELECT id, full_name, is_active 
FROM public.staff 
WHERE is_active = true 
LIMIT 5;

-- 5. Test if we can manually assign a staff member to an appointment
-- (Replace the UUIDs with actual IDs from your data)
-- UPDATE public.appointments 
-- SET staff_id = 'YOUR_STAFF_ID_HERE' 
-- WHERE id = 'YOUR_APPOINTMENT_ID_HERE';