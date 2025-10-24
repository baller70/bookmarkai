-- Create user_notifications table for storing notification reminders
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL DEFAULT 'reminder',
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table for tracking notification history
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES user_notifications(id) ON DELETE CASCADE,
    user_id TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
    delivery_method TEXT NOT NULL, -- 'email', 'in-app', 'push', 'sms'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notifications
CREATE POLICY IF NOT EXISTS "Users can view their own notifications" ON user_notifications
    FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Users can insert their own notifications" ON user_notifications
    FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Users can update their own notifications" ON user_notifications
    FOR UPDATE USING (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Users can delete their own notifications" ON user_notifications
    FOR DELETE USING (user_id = auth.uid()::text OR user_id IS NULL);

-- RLS Policies for notification_logs
CREATE POLICY IF NOT EXISTS "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Users can insert their own notification logs" ON notification_logs
    FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL);

-- RLS Policies for notification_settings
CREATE POLICY IF NOT EXISTS "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_user_notifications_updated_at 
    BEFORE UPDATE ON user_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
