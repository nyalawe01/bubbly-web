-- 0022_active_study_loop.sql
-- Phase 4: The Active Study Loop

-- 1. quiz_sessions
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_artifact_id uuid NOT NULL REFERENCES public.notebook_assets(id) ON DELETE CASCADE,
  notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  score_percentage numeric(5,2),
  total_questions integer DEFAULT 0,
  correct_answers integer DEFAULT 0
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access quiz_sessions" ON public.quiz_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. quiz_answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_index integer NOT NULL,
  question_text text NOT NULL,
  selected_answer integer,
  correct_answer integer NOT NULL,
  is_correct boolean NOT NULL,
  topic_tags text[] DEFAULT '{}',
  time_spent_seconds integer
);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access quiz_answers" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quiz_sessions WHERE id = session_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- 3. student_performance
CREATE TABLE IF NOT EXISTS public.student_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,
  topic text NOT NULL,
  mastery_level numeric(4,3) DEFAULT 0.0,
  total_attempts integer DEFAULT 0,
  correct_attempts integer DEFAULT 0,
  last_practiced_at timestamptz DEFAULT now(),
  confidence_score numeric(4,3) DEFAULT 0.0,
  UNIQUE(user_id, notebook_id, topic)
);

ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access student_performance" ON public.student_performance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. flashcard_sessions
CREATE TABLE IF NOT EXISTS public.flashcard_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_artifact_id uuid NOT NULL REFERENCES public.notebook_assets(id) ON DELETE CASCADE,
  notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cards_reviewed integer DEFAULT 0,
  cards_mastered integer DEFAULT 0
);

ALTER TABLE public.flashcard_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access flashcard_sessions" ON public.flashcard_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. flashcard_reviews
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.flashcard_sessions(id) ON DELETE CASCADE,
  card_index integer NOT NULL,
  front_text text NOT NULL,
  back_text text NOT NULL,
  difficulty_rating integer NOT NULL, -- 1=Again, 2=Hard, 3=Good, 4=Easy
  next_review_at timestamptz,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access flashcard_reviews" ON public.flashcard_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.flashcard_sessions WHERE id = session_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.flashcard_sessions WHERE id = session_id AND user_id = auth.uid())
  );
