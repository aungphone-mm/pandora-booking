-- Enhanced Staff Categories, Positions, and Specializations Schema
-- Run this in your Supabase SQL Editor after staff_schema.sql

-- Staff categories table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.staff_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_categories_pkey PRIMARY KEY (id),
  CONSTRAINT staff_categories_name_unique UNIQUE (name)
);

-- Staff positions table
CREATE TABLE public.staff_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.staff_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_positions_pkey PRIMARY KEY (id),
  CONSTRAINT staff_positions_name_unique UNIQUE (name)
);

-- Staff specializations table
CREATE TABLE public.staff_specializations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.staff_categories(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_specializations_pkey PRIMARY KEY (id),
  CONSTRAINT staff_specializations_name_unique UNIQUE (name)
);

-- Link positions to specializations (many-to-many)
CREATE TABLE public.position_specializations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.staff_positions(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES public.staff_specializations(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false, -- If this specialization is primary for this position
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT position_specializations_pkey PRIMARY KEY (id),
  CONSTRAINT position_specializations_unique UNIQUE (position_id, specialization_id)
);

-- Update staff table to reference position instead of storing position name
-- First add the new column
ALTER TABLE public.staff 
ADD COLUMN position_id uuid REFERENCES public.staff_positions(id) ON DELETE SET NULL;

-- Update staff_specializations to reference specializations table
-- We'll keep the existing specializations array for backward compatibility
-- but add a new table for structured specializations
CREATE TABLE public.staff_specialization_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES public.staff_specializations(id) ON DELETE CASCADE,
  proficiency_level text DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_specialization_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT staff_specialization_assignments_unique UNIQUE (staff_id, specialization_id)
);

-- Create indexes for performance
CREATE INDEX idx_staff_positions_category_id ON public.staff_positions(category_id);
CREATE INDEX idx_staff_positions_active ON public.staff_positions(is_active);
CREATE INDEX idx_staff_specializations_category_id ON public.staff_specializations(category_id);
CREATE INDEX idx_staff_specializations_active ON public.staff_specializations(is_active);
CREATE INDEX idx_position_specializations_position_id ON public.position_specializations(position_id);
CREATE INDEX idx_position_specializations_specialization_id ON public.position_specializations(specialization_id);
CREATE INDEX idx_staff_position_id ON public.staff(position_id);
CREATE INDEX idx_staff_specialization_assignments_staff_id ON public.staff_specialization_assignments(staff_id);
CREATE INDEX idx_staff_specialization_assignments_specialization_id ON public.staff_specialization_assignments(specialization_id);

-- RLS Policies
ALTER TABLE public.staff_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_specialization_assignments ENABLE ROW LEVEL SECURITY;

-- Public can view active categories, positions, and specializations
CREATE POLICY "Anyone can view active staff categories" ON public.staff_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active staff positions" ON public.staff_positions
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active staff specializations" ON public.staff_specializations
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view position specializations" ON public.position_specializations
FOR SELECT USING (true);

CREATE POLICY "Anyone can view staff specialization assignments" ON public.staff_specialization_assignments
FOR SELECT USING (true);

-- Only admins can manage these tables
CREATE POLICY "Admin can manage staff categories" ON public.staff_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can manage staff positions" ON public.staff_positions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can manage staff specializations" ON public.staff_specializations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can manage position specializations" ON public.position_specializations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can manage staff specialization assignments" ON public.staff_specialization_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Helper functions
CREATE OR REPLACE FUNCTION get_staff_categories_with_positions()
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_order integer,
  position_id uuid,
  position_name text,
  position_order integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.name,
    sc.display_order,
    sp.id,
    sp.name,
    sp.display_order
  FROM public.staff_categories sc
  LEFT JOIN public.staff_positions sp ON sc.id = sp.category_id
  WHERE sc.is_active = true 
    AND (sp.is_active = true OR sp.id IS NULL)
  ORDER BY sc.display_order, sp.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_position_specializations(position_id_param uuid)
RETURNS TABLE (
  specialization_id uuid,
  specialization_name text,
  is_primary boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.name,
    ps.is_primary
  FROM public.staff_specializations ss
  JOIN public.position_specializations ps ON ss.id = ps.specialization_id
  WHERE ps.position_id = position_id_param
    AND ss.is_active = true
  ORDER BY ps.is_primary DESC, ss.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_category_specializations(category_id_param uuid)
RETURNS TABLE (
  specialization_id uuid,
  specialization_name text,
  display_order integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.name,
    ss.display_order
  FROM public.staff_specializations ss
  WHERE (ss.category_id = category_id_param OR category_id_param IS NULL)
    AND ss.is_active = true
  ORDER BY ss.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing helper function to use the new structure
DROP FUNCTION IF EXISTS get_available_staff_for_service(uuid, date, time);
CREATE OR REPLACE FUNCTION get_available_staff_for_service(
  service_id_param uuid,
  appointment_date_param date,
  appointment_time_param time
)
RETURNS TABLE (
  staff_id uuid,
  staff_name text,
  position_name text,
  category_name text,
  is_primary boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    sp.name,
    sc.name,
    ss.is_primary_provider
  FROM public.staff s
  LEFT JOIN public.staff_positions sp ON s.position_id = sp.id
  LEFT JOIN public.staff_categories sc ON sp.category_id = sc.id
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

-- Seed data (basic categories to get started)
INSERT INTO public.staff_categories (name, description, display_order) VALUES
('Hair Services', 'Hair styling, cutting, and treatment specialists', 1),
('Beauty Services', 'Facial treatments, skincare, and beauty specialists', 2),
('Nail Services', 'Manicure, pedicure, and nail art specialists', 3),
('Body Services', 'Massage and body treatment specialists', 4),
('Management', 'Administrative and management roles', 5),
('Support', 'Reception and support staff', 6)
ON CONFLICT (name) DO NOTHING;

-- Seed positions
INSERT INTO public.staff_positions (category_id, name, description, display_order)
SELECT 
  sc.id,
  pos.name,
  pos.description,
  pos.display_order
FROM public.staff_categories sc
CROSS JOIN (VALUES
  ('Hair Services', 'Senior Hair Stylist', 'Experienced stylist with advanced skills', 1),
  ('Hair Services', 'Hair Stylist', 'Professional hair stylist', 2),
  ('Hair Services', 'Junior Stylist', 'Entry-level stylist', 3),
  ('Beauty Services', 'Senior Beautician', 'Experienced beauty specialist', 1),
  ('Beauty Services', 'Beautician', 'Professional beautician', 2),
  ('Beauty Services', 'Beauty Therapist', 'Specialized beauty treatments', 3),
  ('Nail Services', 'Senior Nail Technician', 'Expert nail artist', 1),
  ('Nail Services', 'Nail Technician', 'Professional nail services', 2),
  ('Body Services', 'Massage Therapist', 'Licensed massage specialist', 1),
  ('Body Services', 'Body Therapist', 'Body treatment specialist', 2),
  ('Management', 'Salon Manager', 'Overall salon management', 1),
  ('Management', 'Assistant Manager', 'Assistant management role', 2),
  ('Support', 'Receptionist', 'Front desk and customer service', 1),
  ('Support', 'Assistant', 'General salon assistant', 2)
) AS pos(category, name, description, display_order)
WHERE sc.name = pos.category
ON CONFLICT (name) DO NOTHING;

-- Seed specializations
INSERT INTO public.staff_specializations (category_id, name, description, display_order)
SELECT 
  sc.id,
  spec.name,
  spec.description,
  spec.display_order
FROM public.staff_categories sc
CROSS JOIN (VALUES
  ('Hair Services', 'Hair Cutting', 'Professional hair cutting techniques', 1),
  ('Hair Services', 'Hair Coloring', 'Hair dyeing and color treatments', 2),
  ('Hair Services', 'Hair Styling', 'Special occasion and everyday styling', 3),
  ('Hair Services', 'Perms & Relaxers', 'Chemical hair treatments', 4),
  ('Hair Services', 'Hair Extensions', 'Hair extension application', 5),
  ('Beauty Services', 'Facial Treatments', 'Various facial treatments', 1),
  ('Beauty Services', 'Skincare', 'Skin analysis and care', 2),
  ('Beauty Services', 'Eyebrow Services', 'Eyebrow shaping and styling', 3),
  ('Beauty Services', 'Eyelash Services', 'Lash extensions and treatments', 4),
  ('Beauty Services', 'Waxing', 'Hair removal services', 5),
  ('Nail Services', 'Manicure', 'Hand and nail care', 1),
  ('Nail Services', 'Pedicure', 'Foot and nail care', 2),
  ('Nail Services', 'Nail Art', 'Creative nail designs', 3),
  ('Nail Services', 'Gel Nails', 'Gel nail applications', 4),
  ('Nail Services', 'Acrylic Nails', 'Acrylic nail extensions', 5),
  ('Body Services', 'Swedish Massage', 'Traditional relaxation massage', 1),
  ('Body Services', 'Deep Tissue Massage', 'Therapeutic deep tissue work', 2),
  ('Body Services', 'Hot Stone Massage', 'Hot stone therapy', 3),
  ('Body Services', 'Aromatherapy', 'Essential oil treatments', 4),
  ('Management', 'Staff Management', 'Managing salon staff', 1),
  ('Management', 'Customer Relations', 'Customer service management', 2),
  ('Management', 'Business Operations', 'Salon business operations', 3),
  ('Support', 'Appointment Scheduling', 'Managing appointments', 1),
  ('Support', 'Customer Service', 'Front desk customer service', 2),
  ('Support', 'Point of Sale', 'Payment processing', 3)
) AS spec(category, name, description, display_order)
WHERE sc.name = spec.category
ON CONFLICT (name) DO NOTHING;