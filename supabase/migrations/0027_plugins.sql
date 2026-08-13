-- Phase 7: Plugin Architecture

CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'google_drive', 'google_calendar'
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  version TEXT,
  is_enabled BOOLEAN DEFAULT true,
  config_schema JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_plugin_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes_granted TEXT[],
  config JSONB DEFAULT '{}',
  is_connected BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

CREATE TABLE plugin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  payload_summary JSONB,
  status TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plugin_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_action_log ENABLE ROW LEVEL SECURITY;

-- Plugins are public to read
CREATE POLICY "Plugins are public" ON plugins FOR SELECT USING (is_enabled = true);
-- Users own their connections
CREATE POLICY "Users own their plugin connections" ON user_plugin_connections FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own their plugin action logs" ON plugin_action_log FOR ALL USING (user_id = auth.uid());

-- Seed some default plugins
INSERT INTO plugins (name, display_name, description, icon_url) VALUES 
('google_drive', 'Google Drive', 'Import and sync files directly from your Google Drive into your Vault.', '/icons/drive.svg'),
('google_calendar', 'Google Calendar', 'Detect academic events and sync task deadlines with your calendar.', '/icons/calendar.svg');
