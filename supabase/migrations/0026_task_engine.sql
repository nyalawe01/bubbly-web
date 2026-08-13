-- Phase 6: Task Engine

CREATE TYPE task_type AS ENUM ('exam_prep', 'research_paper', 'study_session', 'general');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'waiting_for_user', 'completed', 'failed');
CREATE TYPE step_action_type AS ENUM ('generate_artifact', 'notify_user', 'wait_for_review', 'execute_search', 'plugin_action');
CREATE TYPE step_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'skipped');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type task_type DEFAULT 'general',
  status task_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  progress FLOAT DEFAULT 0.0,
  result_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  action_type step_action_type NOT NULL,
  action_payload JSONB DEFAULT '{}',
  status step_status DEFAULT 'pending',
  result_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own tasks" ON tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage their own task steps" ON task_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_steps.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY "Users manage their own notifications" ON notifications FOR ALL USING (user_id = auth.uid());
