-- Phase 13: Agent Orchestration Layer

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'study_planner', 'deadline_watcher', 'knowledge_gap_detector'
  description TEXT,
  trigger_type TEXT CHECK (trigger_type IN ('scheduled', 'event_driven', 'manual', 'continuous')),
  trigger_config JSONB, -- cron schedule, event filters, etc.
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  user_id UUID NOT NULL,
  trigger_reason TEXT, -- 'scheduled', 'manual', 'event:deadline_approaching'
  input_context JSONB,
  output_summary TEXT,
  actions_taken JSONB, -- list of {action_type, artifact_id, notification_id}
  status TEXT CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'exam_prep_full', 'weekly_review', 'new_topic_mastery'
  description TEXT,
  steps JSONB NOT NULL, -- ordered list of agent actions
  trigger_type TEXT, -- 'manual', 'scheduled', 'event'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed basic agents
INSERT INTO agents (name, description, trigger_type, trigger_config, risk_level) VALUES
('inactivity_monitor', 'Detects dormant users and sends catch-up plans', 'scheduled', '{"cron": "0 */6 * * *"}', 'low'),
('deadline_guardian', 'Warns before deadlines', 'event_driven', '{"events": ["deadline_approaching"]}', 'low'),
('knowledge_gap_hunter', 'Auto-generates remediation after weak performances', 'continuous', '{}', 'medium'),
('study_streak', 'Tracks daily activity and sends motivational nudges', 'scheduled', '{"cron": "0 20 * * *"}', 'low');

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Agents and Templates are globally readable for now
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Public read templates" ON workflow_templates FOR SELECT USING (true);

-- Users can only see their own runs
CREATE POLICY "Users view own agent runs" ON agent_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own agent runs" ON agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own agent runs" ON agent_runs FOR UPDATE USING (auth.uid() = user_id);
