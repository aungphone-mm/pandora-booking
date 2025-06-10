-- Database schema for notification system
-- Add these tables to your Supabase project

-- User notification preferences
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sms boolean DEFAULT false,
  email boolean DEFAULT true,
  push boolean DEFAULT true,
  whatsapp boolean DEFAULT false,
  marketing boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id)
);

-- In-app notifications
CREATE TABLE public.in_app_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  message text NOT NULL,
  type text DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  read boolean DEFAULT false,
  action_url text, -- Optional link for notification
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id)
);

-- Notification cost tracking
CREATE TABLE public.notification_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL, -- 'sms', 'email', 'push', 'whatsapp'
  cost decimal(10,4) DEFAULT 0,
  success boolean DEFAULT false,
  message_type text, -- 'booking', 'reminder', 'marketing', 'loyalty'
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  sent_at timestamp with time zone DEFAULT now(),
  error_message text,
  CONSTRAINT notification_costs_pkey PRIMARY KEY (id)
);

-- Notification templates
CREATE TABLE public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- 'booking_confirmation', 'reminder', 'cancellation'
  channel text NOT NULL, -- 'sms', 'email', 'push'
  subject text, -- For email templates
  template text NOT NULL, -- Message template with placeholders
  variables jsonb, -- Available variables like {customer_name}, {service_name}
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_templates_pkey PRIMARY KEY (id),
  CONSTRAINT notification_templates_name_channel_unique UNIQUE (name, channel)
);

-- Insert default templates
INSERT INTO public.notification_templates (name, type, channel, subject, template, variables) VALUES
('booking_confirmation', 'booking', 'sms', null, 'Hi {customer_name}! Your {service_name} appointment is confirmed for {date} at {time}. - Pandora Beauty Salon', '["customer_name", "service_name", "date", "time"]'),
('booking_confirmation', 'booking', 'email', 'Appointment Confirmed - Pandora Beauty Salon', 'Dear {customer_name},\n\nYour appointment has been confirmed!\n\nService: {service_name}\nDate: {date}\nTime: {time}\nDuration: {duration} minutes\n\nWe look forward to seeing you!\n\nBest regards,\nPandora Beauty Salon Team', '["customer_name", "service_name", "date", "time", "duration"]'),
('appointment_reminder', 'reminder', 'sms', null, 'Reminder: {customer_name}, your {service_name} appointment is tomorrow at {time}. See you soon! - Pandora Beauty', '["customer_name", "service_name", "time"]'),
('appointment_reminder', 'reminder', 'email', 'Appointment Reminder - Tomorrow', 'Dear {customer_name},\n\nThis is a friendly reminder about your upcoming appointment:\n\nService: {service_name}\nDate: Tomorrow ({date})\nTime: {time}\n\nPlease arrive 10 minutes early.\n\nSee you soon!\nPandora Beauty Salon', '["customer_name", "service_name", "date", "time"]');

-- Monthly cost tracking view
CREATE OR REPLACE VIEW public.monthly_notification_costs AS
SELECT 
  DATE_TRUNC('month', sent_at) as month,
  channel,
  COUNT(*) as message_count,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost_per_message,
  COUNT(*) FILTER (WHERE success = true) as successful_messages,
  COUNT(*) FILTER (WHERE success = false) as failed_messages
FROM public.notification_costs 
GROUP BY DATE_TRUNC('month', sent_at), channel
ORDER BY month DESC, total_cost DESC;

-- Add indexes for performance
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_in_app_notifications_user_id ON public.in_app_notifications(user_id);
CREATE INDEX idx_in_app_notifications_read ON public.in_app_notifications(read);
CREATE INDEX idx_notification_costs_sent_at ON public.notification_costs(sent_at);
CREATE INDEX idx_notification_costs_channel ON public.notification_costs(channel);
CREATE INDEX idx_notification_costs_user_id ON public.notification_costs(user_id);

-- RLS policies (Row Level Security)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_costs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notification preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own in-app notifications
CREATE POLICY "Users can view own notifications" ON public.in_app_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.in_app_notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all notification costs
CREATE POLICY "Admin can view all notification costs" ON public.notification_costs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Function to get user's unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id_param uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.in_app_notifications 
    WHERE user_id = user_id_param AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
