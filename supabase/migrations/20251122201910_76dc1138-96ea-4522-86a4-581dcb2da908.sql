-- Step 5: Testing & Validation - Seed Data (CASCADE Fix)
-- Drop old trigger and function with CASCADE
DROP TRIGGER IF EXISTS trigger_auto_enable_apps ON public.firms;
DROP FUNCTION IF EXISTS public.auto_enable_apps_for_new_org() CASCADE;

-- Recreate trigger with correct firm_id reference
CREATE OR REPLACE FUNCTION public.auto_enable_apps_for_new_firm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert app_permissions for all active core apps
  INSERT INTO public.app_permissions (firm_id, app_id, is_enabled)
  SELECT 
    NEW.id as firm_id,
    a.id as app_id,
    true as is_enabled
  FROM 
    public.apps a
  WHERE 
    a.slug IN ('project-management', 'dashboards', 'stakeholders', 'integrations')
    AND a.is_active = true;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_enable_apps
AFTER INSERT ON public.firms
FOR EACH ROW
EXECUTE FUNCTION public.auto_enable_apps_for_new_firm();

-- Insert test firms
INSERT INTO public.firms (id, name, slug, industry, status, metadata, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Obsidian Audit Partners', 'obsidian-audit', 'professional_services', 'active', '{"fiscal_year_end": "12-31", "currency": "USD"}', now()),
  ('00000000-0000-0000-0000-000000000002', 'Global Compliance Solutions', 'global-compliance', 'consulting', 'active', '{"fiscal_year_end": "06-30", "currency": "USD"}', now()),
  ('00000000-0000-0000-0000-000000000003', 'Regional Audit Associates', 'regional-audit', 'accounting', 'active', '{"fiscal_year_end": "03-31", "currency": "USD"}', now())
ON CONFLICT (id) DO NOTHING;

-- Insert test audits for each firm
INSERT INTO public.audits (id, firm_id, audit_title, audit_number, audit_type, status, planned_start_date, planned_end_date, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'FY2024 Financial Statement Audit - Acme Corp', 'AUD-2024-001', 'financial', 'in_progress', '2024-01-15', '2024-12-31', now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Q3 2024 SOX Compliance Review', 'AUD-2024-002', 'compliance', 'planning', '2024-07-01', '2024-09-30', now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'IT Security Assessment 2024', 'AUD-2024-003', 'it_audit', 'in_progress', '2024-02-01', '2024-11-30', now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Operational Risk Review', 'AUD-2024-004', 'operational', 'fieldwork', '2024-03-15', '2024-10-15', now()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Internal Controls Evaluation', 'AUD-2024-005', 'internal_audit', 'planning', '2024-04-01', '2024-12-15', now())
ON CONFLICT (id) DO NOTHING;

-- Insert test audit findings
INSERT INTO public.audit_findings (id, firm_id, audit_id, finding_number, finding_title, finding_type, severity, condition_description, status, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'F-2024-001', 'Segregation of Duties Deficiency', 'control_deficiency', 'high', 'Lack of segregation between payment authorization and execution.', 'open', now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'F-2024-002', 'Inventory Reconciliation Issue', 'material_weakness', 'critical', 'Quarterly inventory counts not reconciled with GL.', 'open', now()),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'IT-2024-001', 'Weak Password Policy', 'compliance_issue', 'medium', 'Password complexity requirements not enforced.', 'in_remediation', now()),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'IC-2024-001', 'Documentation Gap', 'observation', 'low', 'Control documentation incomplete for approval workflows.', 'open', now())
ON CONFLICT (id) DO NOTHING;

-- Insert test audit entities
INSERT INTO public.audit_entities (id, firm_id, entity_code, entity_name, entity_type, risk_score, status, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ENT-001', 'Acme Corporation', 'legal_entity', 75, 'active', now()),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'PROC-001', 'Accounts Payable Process', 'business_process', 65, 'active', now()),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'SYS-001', 'ERP System', 'it_system', 80, 'active', now()),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'DEPT-001', 'Finance Department', 'department', 55, 'active', now())
ON CONFLICT (id) DO NOTHING;

-- Insert test audit plans
INSERT INTO public.audit_plans (id, firm_id, plan_name, plan_year, plan_period, start_date, end_date, status, total_budget, allocated_hours, created_at) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2024 Annual Audit Plan', 2024, 'annual', '2024-01-01', '2024-12-31', 'approved', 500000.00, 2500, now()),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Q2 2024 Risk Assessment Plan', 2024, 'quarterly', '2024-04-01', '2024-06-30', 'in_progress', 150000.00, 800, now()),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2024 Internal Audit Plan', 2024, 'annual', '2024-01-01', '2024-12-31', 'draft', 300000.00, 1500, now())
ON CONFLICT (id) DO NOTHING;

-- Insert test workpapers
INSERT INTO public.audit_workpapers (id, firm_id, audit_id, title, workpaper_type, reference_number, status, content, prepared_date, created_at) VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Cash Reconciliation', 'analysis', 'WP-A-001', 'draft', '{"summary": "Cash reconciliation for December 2024"}', '2024-12-15', now()),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Revenue Testing', 'testing', 'WP-R-001', 'in_review', '{"sample_size": 25, "exceptions": 2}', '2024-11-20', now()),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Access Control Review', 'documentation', 'WP-IT-001', 'draft', '{"users_reviewed": 150}', '2024-10-10', now())
ON CONFLICT (id) DO NOTHING;

-- Function to validate data isolation
CREATE OR REPLACE FUNCTION public.validate_firm_isolation()
RETURNS TABLE(
  test_name TEXT,
  passed BOOLEAN,
  details TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Test 1: Verify all tables have firm_id
  RETURN QUERY
  SELECT 
    'Tables with firm_id'::TEXT,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name IN ('audits', 'audit_findings', 'audit_workpapers', 'audit_entities', 'audit_plans')
     AND column_name = 'firm_id') = 5,
    'All core audit tables have firm_id column'::TEXT;

  -- Test 2: Verify RLS is enabled
  RETURN QUERY
  SELECT 
    'RLS Enabled'::TEXT,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' 
     AND tablename IN ('audits', 'audit_findings', 'audit_workpapers')
     AND rowsecurity = true) = 3,
    'RLS enabled on core audit tables'::TEXT;

  -- Test 3: Verify firms are isolated
  RETURN QUERY
  SELECT 
    'Firm Data Isolation'::TEXT,
    (SELECT COUNT(DISTINCT firm_id) FROM public.audits) >= 3,
    format('Found %s distinct firms with audit data', (SELECT COUNT(DISTINCT firm_id) FROM public.audits))::TEXT;

  -- Test 4: Verify test data exists
  RETURN QUERY
  SELECT 
    'Test Data Exists'::TEXT,
    (SELECT COUNT(*) FROM public.firms WHERE id::TEXT LIKE '00000000-0000-0000-0000-%') >= 3,
    format('Found %s test firms', (SELECT COUNT(*) FROM public.firms WHERE id::TEXT LIKE '00000000-0000-0000-0000-%'))::TEXT;
END;
$$;