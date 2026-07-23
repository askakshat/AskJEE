-- ============================================
-- JEE Preparation Dashboard — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Users table (extends Supabase Auth)
-- NOTE: Supabase Auth already has a `auth.users` table.
-- We create a public `profiles` table linked to it.

CREATE TABLE IF NOT EXISTS public.profiles (
  id            TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  target_year   INTEGER,
  reminders_enabled BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Chapters (shared across all users, seeded once)
CREATE TABLE IF NOT EXISTS public.chapters (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject     TEXT NOT NULL CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics')),
  grade       INTEGER NOT NULL CHECK (grade IN (11, 12)),
  name        TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  UNIQUE(subject, grade, name)
);

-- Chapter progress (per-user)
CREATE TABLE IF NOT EXISTS public.chapter_progress (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id      TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'incomplete' 
                   CHECK (status IN ('completed', 'in_progress', 'revision', 'incomplete', 'backlog')),
  last_revised_at TIMESTAMPTZ,
  next_revision_at DATE,
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Schedules (per-user)
CREATE TABLE IF NOT EXISTS public.schedules (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  subject         TEXT CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics', 'General')),
  scheduled_date  DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  notes           TEXT,
  is_done         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Tests (per-user)
CREATE TABLE IF NOT EXISTS public.tests (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  test_type       TEXT NOT NULL DEFAULT 'Other'
                   CHECK (test_type IN ('Mock', 'Chapter', 'Full Syllabus', 'Previous Year', 'Other')),
  test_date       DATE NOT NULL,
  total_marks     NUMERIC(8,2) NOT NULL DEFAULT 300,
  obtained_marks  NUMERIC(8,2) NOT NULL DEFAULT 0,
  rank            INTEGER,
  percentile      NUMERIC(5,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Test sections (per-test breakdown)
CREATE TABLE IF NOT EXISTS public.test_sections (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  test_id      TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics')),
  correct      INTEGER DEFAULT 0,
  incorrect    INTEGER DEFAULT 0,
  unattempted  INTEGER DEFAULT 0,
  marks        NUMERIC(8,2) DEFAULT 0,
  max_marks    NUMERIC(8,2) DEFAULT 0
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;

-- Chapters are readable by all authenticated users (no RLS needed for inserts — seeded by admin)
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Chapter progress
CREATE POLICY "Users can view own progress" ON public.chapter_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.chapter_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.chapter_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Schedules
CREATE POLICY "Users can view own schedules" ON public.schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON public.schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON public.schedules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON public.schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Tests
CREATE POLICY "Users can view own tests" ON public.tests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tests" ON public.tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tests" ON public.tests
  FOR DELETE USING (auth.uid() = user_id);

-- Test sections
CREATE POLICY "Users can view own test sections" ON public.test_sections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test sections" ON public.test_sections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chapters (anyone authenticated can read)
CREATE POLICY "Authenticated users can read chapters" ON public.chapters
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Trigger: auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Trigger: auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER chapter_progress_updated_at BEFORE UPDATE ON public.chapter_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Seed: 79 JEE Chapters
-- ============================================

INSERT INTO public.chapters (subject, grade, name, sort_order) VALUES
-- Physics Class 11
('Physics', 11, 'Units and Measurements', 1),
('Physics', 11, 'Kinematics', 2),
('Physics', 11, 'Laws of Motion', 3),
('Physics', 11, 'Work, Energy and Power', 4),
('Physics', 11, 'Rotational Motion', 5),
('Physics', 11, 'Gravitation', 6),
('Physics', 11, 'Properties of Solids and Liquids', 7),
('Physics', 11, 'Thermodynamics', 8),
('Physics', 11, 'Kinetic Theory of Gases', 9),
('Physics', 11, 'Oscillations', 10),
('Physics', 11, 'Waves', 11),
-- Physics Class 12
('Physics', 12, 'Electrostatics', 1),
('Physics', 12, 'Current Electricity', 2),
('Physics', 12, 'Magnetic Effects of Current', 3),
('Physics', 12, 'Electromagnetic Induction', 4),
('Physics', 12, 'Alternating Current', 5),
('Physics', 12, 'Electromagnetic Waves', 6),
('Physics', 12, 'Ray Optics', 7),
('Physics', 12, 'Wave Optics', 8),
('Physics', 12, 'Dual Nature of Radiation', 9),
('Physics', 12, 'Atoms', 10),
('Physics', 12, 'Nuclei', 11),
('Physics', 12, 'Semiconductor Electronics', 12),
-- Chemistry Class 11
('Chemistry', 11, 'Some Basic Concepts of Chemistry', 1),
('Chemistry', 11, 'Structure of Atom', 2),
('Chemistry', 11, 'Periodic Table', 3),
('Chemistry', 11, 'Chemical Bonding', 4),
('Chemistry', 11, 'States of Matter', 5),
('Chemistry', 11, 'Thermodynamics', 6),
('Chemistry', 11, 'Equilibrium', 7),
('Chemistry', 11, 'Redox Reactions', 8),
('Chemistry', 11, 'Hydrogen', 9),
('Chemistry', 11, 's-Block Elements', 10),
('Chemistry', 11, 'p-Block Elements', 11),
('Chemistry', 11, 'Organic Chemistry Basics', 12),
('Chemistry', 11, 'Hydrocarbons', 13),
('Chemistry', 11, 'Environmental Chemistry', 14),
-- Chemistry Class 12
('Chemistry', 12, 'Solid State', 1),
('Chemistry', 12, 'Solutions', 2),
('Chemistry', 12, 'Electrochemistry', 3),
('Chemistry', 12, 'Chemical Kinetics', 4),
('Chemistry', 12, 'Surface Chemistry', 5),
('Chemistry', 12, 'General Principles of Isolation', 6),
('Chemistry', 12, 'p-Block Elements', 7),
('Chemistry', 12, 'd and f Block Elements', 8),
('Chemistry', 12, 'Coordination Compounds', 9),
('Chemistry', 12, 'Haloalkanes and Haloarenes', 10),
('Chemistry', 12, 'Alcohols, Phenols and Ethers', 11),
('Chemistry', 12, 'Aldehydes, Ketones and Carboxylic Acids', 12),
('Chemistry', 12, 'Amines', 13),
('Chemistry', 12, 'Biomolecules', 14),
-- Mathematics Class 11
('Mathematics', 11, 'Sets', 1),
('Mathematics', 11, 'Relations and Functions', 2),
('Mathematics', 11, 'Trigonometric Functions', 3),
('Mathematics', 11, 'Complex Numbers', 4),
('Mathematics', 11, 'Linear Inequalities', 5),
('Mathematics', 11, 'Permutations and Combinations', 6),
('Mathematics', 11, 'Binomial Theorem', 7),
('Mathematics', 11, 'Sequences and Series', 8),
('Mathematics', 11, 'Straight Lines', 9),
('Mathematics', 11, 'Conic Sections', 10),
('Mathematics', 11, 'Limits and Derivatives', 11),
('Mathematics', 11, 'Mathematical Reasoning', 12),
('Mathematics', 11, 'Statistics', 13),
('Mathematics', 11, 'Probability', 14),
-- Mathematics Class 12
('Mathematics', 12, 'Relations and Functions', 1),
('Mathematics', 12, 'Inverse Trigonometric Functions', 2),
('Mathematics', 12, 'Matrices', 3),
('Mathematics', 12, 'Determinants', 4),
('Mathematics', 12, 'Continuity and Differentiability', 5),
('Mathematics', 12, 'Applications of Derivatives', 6),
('Mathematics', 12, 'Integrals', 7),
('Mathematics', 12, 'Applications of Integrals', 8),
('Mathematics', 12, 'Differential Equations', 9),
('Mathematics', 12, 'Vector Algebra', 10),
('Mathematics', 12, 'Three Dimensional Geometry', 11),
('Mathematics', 12, 'Linear Programming', 12),
('Mathematics', 12, 'Probability', 13)
ON CONFLICT (subject, grade, name) DO NOTHING;
