-- Public read access for key tables to ensure pages render without login
-- Guarded to avoid errors if tables are missing or policies already exist

-- 1) audit_entities
ALTER TABLE IF EXISTS public.audit_entities ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audit_entities') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audit_entities' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audit_entities
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 2) audits
ALTER TABLE IF EXISTS public.audits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audits') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audits' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audits
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 3) audit_findings
ALTER TABLE IF EXISTS public.audit_findings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audit_findings') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audit_findings' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audit_findings
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 4) audit_workpapers (for counts/landing pages)
ALTER TABLE IF EXISTS public.audit_workpapers ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audit_workpapers') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audit_workpapers' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audit_workpapers
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 5) risk_assessments (dashboard widgets)
ALTER TABLE IF EXISTS public.risk_assessments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.risk_assessments') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='risk_assessments' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.risk_assessments
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 6) audit_programs (task inbox)
ALTER TABLE IF EXISTS public.audit_programs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audit_programs') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audit_programs' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audit_programs
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 7) audit_logs (UnifiedActivity feed)
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audit_logs
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;

-- 8) audit_team_members (PortalMetrics)
ALTER TABLE IF EXISTS public.audit_team_members ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.audit_team_members') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='audit_team_members' AND policyname='Public read access'
    ) THEN
      CREATE POLICY "Public read access" ON public.audit_team_members
      FOR SELECT TO anon, authenticated
      USING (true);
    END IF;
  END IF;
END$$;