-- Add staff assignment to existing appointments table
-- Run this in your Supabase SQL Editor

-- Step 1: Add staff_id column to appointments table (without foreign key first)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS staff_id uuid,
ADD COLUMN IF NOT EXISTS staff_notes text;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments(staff_id);

-- Step 3: Add foreign key constraint (run this only if your staff table has 'id' as primary key)
-- ALTER TABLE public.appointments 
-- ADD CONSTRAINT fk_appointments_staff FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;