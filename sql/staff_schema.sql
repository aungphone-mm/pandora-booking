-- Staff Management Schema for Pandora Beauty Salon
-- Run this in your Supabase SQL Editor

-- Staff members table
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: if staff member has login account
  full_name text NOT NULL,
  email text,
  phone text,
  job_position text, -- 'stylist', 'beautician', 'nail_technician', 'manager', etc.
  specializations text[], -- Array of specializations like ['haircut', 'coloring', 'facial']
  bio text, -- Staff bio for customer-facing display
  profile_image_url text,
  hire_date date,
  is_active boolean DEFAULT true,
  hourly_rate decimal(10,2), -- For internal payroll tracking
  commission_rate decimal(5,2), -- Commission percentage (0-100)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_email_unique UNIQUE (email)
);

-- Staff availability/schedule
CREATE TABLE public.staff_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  break_start_time time, -- Optional lunch/break time
  break_end_time time,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT staff_schedules_staff_day_unique UNIQUE (staff_id, day_of_week),
  CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Staff time off/vacation requests
CREATE TABLE public.staff_time_off (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text, -- 'vacation', 'sick', 'personal', etc.
  status text DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  notes text,
  approved_by uuid REFERENCES public.staff(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_time_off_pkey PRIMARY KEY (id),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Link services to staff (who can perform which services)
CREATE TABLE public.staff_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  is_primary_provider boolean DEFAULT false, -- If this staff member is the main provider for this service
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_services_pkey PRIMARY KEY (id),
  CONSTRAINT staff_services_unique UNIQUE (staff_id, service_id)
);

-- Add staff assignment to appointments
ALTER TABLE public.appointments 
ADD COLUMN staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
ADD COLUMN staff_notes text; -- Internal notes from staff

-- Staff performance tracking (optional)
CREATE TABLE public.staff_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  appointments_completed integer DEFAULT 0,
  total_revenue decimal(10,2) DEFAULT 0,
  average_rating decimal(3,2), -- Customer ratings (1-5)
  tips_earned decimal(10,2) DEFAULT 0,
  hours_worked decimal(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT staff_metrics_staff_date_unique UNIQUE (staff_id, metric_date)
);

-- Staff data will be managed through the application interface

-- Staff schedules will be managed through the application interface

-- Staff services assignments will be managed through the application interface

-- Create indexes for performance
CREATE INDEX idx_staff_active ON public.staff(is_active);
CREATE INDEX idx_staff_schedules_staff_id ON public.staff_schedules(staff_id);
CREATE INDEX idx_staff_schedules_day ON public.staff_schedules(day_of_week);
CREATE INDEX idx_staff_time_off_dates ON public.staff_time_off(start_date, end_date);
CREATE INDEX idx_staff_services_staff_id ON public.staff_services(staff_id);
CREATE INDEX idx_staff_services_service_id ON public.staff_services(service_id);
CREATE INDEX idx_appointments_staff_id ON public.appointments(staff_id);

-- RLS Policies
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_metrics ENABLE ROW LEVEL SECURITY;

-- Public can view active staff (for booking interface)
CREATE POLICY "Anyone can view active staff" ON public.staff
FOR SELECT USING (is_active = true);

-- Only admins can manage staff
CREATE POLICY "Admin can manage staff" ON public.staff
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Similar policies for other staff tables
CREATE POLICY "Admin can view staff schedules" ON public.staff_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can manage staff schedules" ON public.staff_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Staff can view their own time off requests
CREATE POLICY "Staff can view own time off" ON public.staff_time_off
FOR SELECT USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Public can view staff services (for booking)
CREATE POLICY "Anyone can view staff services" ON public.staff_services
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.id = staff_services.staff_id 
    AND staff.is_active = true
  )
);

-- Helper functions
CREATE OR REPLACE FUNCTION get_available_staff_for_service(
  service_id_param uuid,
  appointment_date_param date,
  appointment_time_param time
)
RETURNS TABLE (
  staff_id uuid,
  staff_name text,
  job_position text,
  is_primary boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.job_position,
    ss.is_primary_provider
  FROM public.staff s
  JOIN public.staff_services ss ON s.id = ss.staff_id
  JOIN public.staff_schedules sched ON s.id = sched.staff_id
  WHERE ss.service_id = service_id_param
    AND s.is_active = true
    AND sched.day_of_week = EXTRACT(DOW FROM appointment_date_param)::integer
    AND sched.start_time <= appointment_time_param
    AND sched.end_time >= appointment_time_param
    AND sched.is_available = true
    -- Check if staff is not on time off
    AND NOT EXISTS (
      SELECT 1 FROM public.staff_time_off sto
      WHERE sto.staff_id = s.id
        AND sto.status = 'approved'
        AND appointment_date_param BETWEEN sto.start_date AND sto.end_date
    )
    -- Check if staff doesn't have conflicting appointment
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.staff_id = s.id
        AND a.appointment_date = appointment_date_param
        AND a.appointment_time = appointment_time_param
        AND a.status != 'cancelled'
    )
  ORDER BY ss.is_primary_provider DESC, s.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get staff workload for a specific date
CREATE OR REPLACE FUNCTION get_staff_workload(date_param date)
RETURNS TABLE (
  staff_id uuid,
  staff_name text,
  appointments_count bigint,
  total_duration integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    COUNT(a.id),
    SUM(srv.duration)::integer
  FROM public.staff s
  LEFT JOIN public.appointments a ON s.id = a.staff_id 
    AND a.appointment_date = date_param 
    AND a.status != 'cancelled'
  LEFT JOIN public.services srv ON a.service_id = srv.id
  WHERE s.is_active = true
  GROUP BY s.id, s.full_name
  ORDER BY COUNT(a.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;