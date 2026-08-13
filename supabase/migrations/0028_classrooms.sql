-- Phase 8: Classrooms and Collaboration

CREATE TYPE resource_permission AS ENUM ('view', 'comment', 'edit', 'owner');
CREATE TYPE classroom_role AS ENUM ('teacher', 'ta', 'student');
CREATE TYPE assignment_type AS ENUM ('quiz', 'flashcards', 'document', 'reading');
CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'submitted', 'graded', 'returned');

CREATE TABLE shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'notebook', 'artifact', 'document'
  resource_id UUID NOT NULL,
  shared_with_user_id UUID, -- Null if shared via link
  permission resource_permission DEFAULT 'view',
  share_link_token TEXT UNIQUE,
  is_link_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  selection_reference JSONB,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_code TEXT,
  owner_id UUID NOT NULL,
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE classroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role classroom_role DEFAULT 'student',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  assignment_type assignment_type DEFAULT 'quiz',
  due_date TIMESTAMPTZ,
  points_possible INTEGER DEFAULT 100,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status assignment_status DEFAULT 'not_started',
  submitted_content JSONB,
  score FLOAT,
  teacher_feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, user_id)
);

ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read classrooms they are members of" ON classrooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM classroom_members WHERE classroom_members.classroom_id = classrooms.id AND classroom_members.user_id = auth.uid()) OR owner_id = auth.uid()
);

CREATE POLICY "Users can manage classrooms they own" ON classrooms FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can view members of their classrooms" ON classroom_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = classroom_members.classroom_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own memberships" ON classroom_members FOR ALL USING (user_id = auth.uid());
