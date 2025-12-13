-- =============================================================================
-- Comprehensive RLS Testing Framework for Audit Management System
-- This file tests Row Level Security policies across all tables
-- Ensures proper data isolation between firms
-- =============================================================================

-- Create test schema if not exists
CREATE SCHEMA IF NOT EXISTS tests;

-- Helper function to get user's firms
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

-- =============================================================================
-- Main RLS test function for firm isolation
-- =============================================================================
CREATE OR REPLACE FUNCTION tests.test_firm_isolation()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  firm1_id uuid := gen_random_uuid();
  firm2_id uuid := gen_random_uuid();
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  client1_id uuid := gen_random_uuid();
  engagement1_id uuid := gen_random_uuid();
  test_passed boolean := true;
  v_count integer;
BEGIN
  -- Setup: Create test firms
  INSERT INTO firms (id, name, slug, settings)
  VALUES
    (firm1_id, 'Test Firm 1', 'test-firm-1', '{}'),
    (firm2_id, 'Test Firm 2', 'test-firm-2', '{}');

  -- Setup: Create test users in auth.users
  -- Note: In production, this requires admin access or service role
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (user1_id, 'test1@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email"}', '{}', now(), now()),
    (user2_id, 'test2@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email"}', '{}', now(), now());

  -- Setup: Create profiles and assign users to firms
  INSERT INTO profiles (id, firm_id, email, first_name, last_name)
  VALUES
    (user1_id, firm1_id, 'test1@example.com', 'Test', 'User1'),
    (user2_id, firm2_id, 'test2@example.com', 'Test', 'User2');

  -- Test 1: Test client isolation
  RAISE NOTICE 'Testing clients table isolation...';

  -- Insert client for firm1
  INSERT INTO clients (id, firm_id, client_name, industry, status)
  VALUES (client1_id, firm1_id, 'Test Client 1', 'Technology', 'active');

  -- Set context to user2 (firm2) and try to see firm1's client
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user2_id)::text, true);

  SELECT count(*) INTO v_count
  FROM clients
  WHERE id = client1_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'RLS VIOLATION: User from Firm2 can see Firm1 client data';
  END IF;

  -- Set context to user1 (firm1) and verify they CAN see the client
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user1_id)::text, true);

  SELECT count(*) INTO v_count
  FROM clients
  WHERE id = client1_id;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'RLS ERROR: User from Firm1 cannot see their own client data';
  END IF;

  RAISE NOTICE '✓ Clients table isolation test PASSED';

  -- Test 2: Test engagement isolation
  RAISE NOTICE 'Testing engagements table isolation...';

  -- Insert engagement for firm1
  INSERT INTO engagements (id, firm_id, client_id, engagement_type, status, fiscal_year_end)
  VALUES (engagement1_id, firm1_id, client1_id, 'audit', 'planning', '2024-12-31');

  -- Set context to user2 (firm2) and try to see firm1's engagement
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user2_id)::text, true);

  SELECT count(*) INTO v_count
  FROM engagements
  WHERE id = engagement1_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'RLS VIOLATION: User from Firm2 can see Firm1 engagement data';
  END IF;

  -- Set context to user1 (firm1) and verify they CAN see the engagement
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user1_id)::text, true);

  SELECT count(*) INTO v_count
  FROM engagements
  WHERE id = engagement1_id;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'RLS ERROR: User from Firm1 cannot see their own engagement data';
  END IF;

  RAISE NOTICE '✓ Engagements table isolation test PASSED';

  -- Test more tables
  PERFORM tests.test_table_isolation('audit_programs', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('audit_procedures', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('risk_assessments', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('materiality_calculations', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('audit_findings', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('documents', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('time_entries', firm1_id, firm2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('review_notes', firm1_id, firm2_id, user1_id, user2_id);

  -- Cleanup
  DELETE FROM engagements WHERE id = engagement1_id;
  DELETE FROM clients WHERE id = client1_id;
  DELETE FROM profiles WHERE id IN (user1_id, user2_id);
  DELETE FROM auth.users WHERE id IN (user1_id, user2_id);
  DELETE FROM firms WHERE id IN (firm1_id, firm2_id);

  RAISE NOTICE '====================================';
  RAISE NOTICE 'ALL RLS ISOLATION TESTS PASSED ✓';
  RAISE NOTICE '====================================';
END;
$$;

-- =============================================================================
-- Generic table isolation test function
-- =============================================================================
CREATE OR REPLACE FUNCTION tests.test_table_isolation(
  table_name text,
  firm1_id uuid,
  firm2_id uuid,
  user1_id uuid,
  user2_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  record_id uuid := gen_random_uuid();
  visible_count int;
  has_firm_id boolean;
  test_engagement_id uuid := gen_random_uuid();
  test_client_id uuid := gen_random_uuid();
BEGIN
  -- Check if table has firm_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = test_table_isolation.table_name
    AND column_name = 'firm_id'
  ) INTO has_firm_id;

  IF NOT has_firm_id THEN
    RAISE NOTICE 'Skipping % (no firm_id column)', table_name;
    RETURN;
  END IF;

  RAISE NOTICE 'Testing % table isolation...', table_name;

  -- Handle special cases for tables with required foreign keys
  IF table_name IN ('engagements', 'audit_programs', 'audit_procedures', 'risk_assessments',
                     'materiality_calculations', 'audit_findings') THEN
    -- Create required parent records
    INSERT INTO clients (id, firm_id, client_name, industry, status)
    VALUES (test_client_id, firm1_id, 'Test Client for Isolation', 'Technology', 'active');

    IF table_name != 'engagements' THEN
      INSERT INTO engagements (id, firm_id, client_id, engagement_type, status, fiscal_year_end)
      VALUES (test_engagement_id, firm1_id, test_client_id, 'audit', 'planning', '2024-12-31');
    END IF;
  END IF;

  -- Insert test record based on table requirements
  IF table_name = 'audit_programs' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, engagement_id, name, status) VALUES ($1, $2, $3, $4, $5)',
      table_name
    ) USING record_id, firm1_id, test_engagement_id, 'Test Program', 'draft';

  ELSIF table_name = 'audit_procedures' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, engagement_id, title, status, assigned_to) VALUES ($1, $2, $3, $4, $5, $6)',
      table_name
    ) USING record_id, firm1_id, test_engagement_id, 'Test Procedure', 'not_started', user1_id;

  ELSIF table_name = 'risk_assessments' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, engagement_id, assessment_date, status) VALUES ($1, $2, $3, $4, $5)',
      table_name
    ) USING record_id, firm1_id, test_engagement_id, current_date, 'draft';

  ELSIF table_name = 'materiality_calculations' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, engagement_id, benchmark_type, benchmark_amount, percentage) VALUES ($1, $2, $3, $4, $5, $6)',
      table_name
    ) USING record_id, firm1_id, test_engagement_id, 'total_assets', 1000000, 5.0;

  ELSIF table_name = 'audit_findings' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, engagement_id, title, severity, status) VALUES ($1, $2, $3, $4, $5, $6)',
      table_name
    ) USING record_id, firm1_id, test_engagement_id, 'Test Finding', 'low', 'draft';

  ELSIF table_name = 'documents' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, name, file_type, file_size) VALUES ($1, $2, $3, $4, $5)',
      table_name
    ) USING record_id, firm1_id, 'Test Document', 'application/pdf', 1024;

  ELSIF table_name = 'time_entries' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, user_id, date, hours, description) VALUES ($1, $2, $3, $4, $5, $6)',
      table_name
    ) USING record_id, firm1_id, user1_id, current_date, 8.0, 'Test work';

  ELSIF table_name = 'review_notes' THEN
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, engagement_id, note, created_by) VALUES ($1, $2, $3, $4, $5)',
      table_name
    ) USING record_id, firm1_id, test_engagement_id, 'Test review note', user1_id;

  ELSE
    -- Generic insert for other tables
    EXECUTE format(
      'INSERT INTO %I (id, firm_id, name) VALUES ($1, $2, $3)',
      table_name
    ) USING record_id, firm1_id, 'Test Record';
  END IF;

  -- Switch to user2 (firm2) and verify cannot see firm1 data
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user2_id)::text, true);

  EXECUTE format('SELECT count(*) FROM %I WHERE id = $1', table_name)
    INTO visible_count
    USING record_id;

  IF visible_count > 0 THEN
    RAISE EXCEPTION 'RLS VIOLATION: User2 can see User1 data in table %', table_name;
  END IF;

  -- Switch to user1 (firm1) and verify CAN see own data
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user1_id)::text, true);

  EXECUTE format('SELECT count(*) FROM %I WHERE id = $1', table_name)
    INTO visible_count
    USING record_id;

  IF visible_count = 0 THEN
    RAISE EXCEPTION 'RLS ERROR: User1 cannot see own data in table %', table_name;
  END IF;

  -- Cleanup
  EXECUTE format('DELETE FROM %I WHERE id = $1', table_name) USING record_id;

  IF table_name IN ('engagements', 'audit_programs', 'audit_procedures', 'risk_assessments',
                     'materiality_calculations', 'audit_findings', 'review_notes') AND
     table_name != 'engagements' THEN
    DELETE FROM engagements WHERE id = test_engagement_id;
  END IF;

  IF table_name IN ('engagements', 'audit_programs', 'audit_procedures', 'risk_assessments',
                     'materiality_calculations', 'audit_findings', 'review_notes') THEN
    DELETE FROM clients WHERE id = test_client_id;
  END IF;

  RAISE NOTICE '✓ Table % isolation test PASSED', table_name;
END;
$$;

-- =============================================================================
-- Test write operations (INSERT, UPDATE, DELETE)
-- =============================================================================
CREATE OR REPLACE FUNCTION tests.test_write_policies()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  firm1_id uuid := gen_random_uuid();
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  client_id uuid := gen_random_uuid();
  v_count integer;
BEGIN
  -- Setup
  INSERT INTO firms (id, name, slug, settings)
  VALUES (firm1_id, 'Test Write Firm', 'test-write-firm', '{}');

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (user1_id, 'writer1@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email"}', '{}', now(), now()),
    (user2_id, 'writer2@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email"}', '{}', now(), now());

  INSERT INTO profiles (id, firm_id, email, first_name, last_name)
  VALUES
    (user1_id, firm1_id, 'writer1@example.com', 'Writer', 'One'),
    (user2_id, NULL, 'writer2@example.com', 'Writer', 'Two'); -- User2 has no firm

  -- Test INSERT
  RAISE NOTICE 'Testing INSERT policies...';

  -- Set context to user1 (has firm)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user1_id)::text, true);

  -- Should be able to insert
  BEGIN
    INSERT INTO clients (id, firm_id, client_name, industry, status)
    VALUES (client_id, firm1_id, 'Test Insert Client', 'Technology', 'active');

    SELECT count(*) INTO v_count FROM clients WHERE id = client_id;
    IF v_count = 0 THEN
      RAISE EXCEPTION 'INSERT policy failed: Could not insert record';
    END IF;
    RAISE NOTICE '✓ INSERT policy test PASSED';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'INSERT policy error: %', SQLERRM;
  END;

  -- Test UPDATE
  RAISE NOTICE 'Testing UPDATE policies...';

  BEGIN
    UPDATE clients
    SET client_name = 'Updated Client Name'
    WHERE id = client_id;

    SELECT count(*) INTO v_count
    FROM clients
    WHERE id = client_id AND client_name = 'Updated Client Name';

    IF v_count = 0 THEN
      RAISE EXCEPTION 'UPDATE policy failed: Could not update record';
    END IF;
    RAISE NOTICE '✓ UPDATE policy test PASSED';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'UPDATE policy error: %', SQLERRM;
  END;

  -- Test that user2 (no firm) cannot update
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user2_id)::text, true);

  UPDATE clients
  SET client_name = 'Should Not Update'
  WHERE id = client_id;

  -- Verify update didn't happen
  SELECT count(*) INTO v_count
  FROM clients
  WHERE id = client_id AND client_name = 'Should Not Update';

  IF v_count > 0 THEN
    RAISE EXCEPTION 'UPDATE policy violation: User without firm could update record';
  END IF;
  RAISE NOTICE '✓ UPDATE isolation test PASSED';

  -- Test DELETE
  RAISE NOTICE 'Testing DELETE policies...';

  -- User2 should not be able to delete
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user2_id)::text, true);

  DELETE FROM clients WHERE id = client_id;

  SELECT count(*) INTO v_count FROM clients WHERE id = client_id;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'DELETE policy violation: User without firm could delete record';
  END IF;

  -- User1 should be able to delete
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user1_id)::text, true);

  DELETE FROM clients WHERE id = client_id;

  SELECT count(*) INTO v_count FROM clients WHERE id = client_id;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'DELETE policy failed: Could not delete own record';
  END IF;
  RAISE NOTICE '✓ DELETE policy test PASSED';

  -- Cleanup
  DELETE FROM profiles WHERE id IN (user1_id, user2_id);
  DELETE FROM auth.users WHERE id IN (user1_id, user2_id);
  DELETE FROM firms WHERE id = firm1_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'ALL WRITE POLICY TESTS PASSED ✓';
  RAISE NOTICE '====================================';
END;
$$;

-- =============================================================================
-- Main test runner
-- =============================================================================
CREATE OR REPLACE FUNCTION tests.run_all_rls_tests()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'STARTING RLS POLICY TESTS';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';

  -- Run isolation tests
  PERFORM tests.test_firm_isolation();

  -- Run write policy tests
  PERFORM tests.test_write_policies();

  RAISE NOTICE '';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'ALL RLS TESTS COMPLETED SUCCESSFULLY';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
END;
$$;

-- =============================================================================
-- Instructions for running tests:
-- =============================================================================
-- 1. Connect to your Supabase database with service role or admin privileges
-- 2. Run: SELECT tests.run_all_rls_tests();
-- 3. Review output for any failures
-- 4. Tests should be run after any RLS policy changes
--
-- To run specific tests:
-- SELECT tests.test_firm_isolation();
-- SELECT tests.test_write_policies();
--
-- Note: These tests require elevated privileges to create test users in auth.users