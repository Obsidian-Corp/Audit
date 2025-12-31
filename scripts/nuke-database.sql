-- ============================================================
-- NUCLEAR DATABASE RESET
-- This script drops ALL objects from the public schema
-- and clears auth users and migration history
-- ============================================================

-- Step 1: Drop all views first (they depend on tables)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
END $$;

-- Step 2: Drop all tables
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- Step 3: Drop all sequences
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- Step 4: Drop all functions in public schema
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
            RAISE NOTICE 'Dropped function: %(%)', r.proname, r.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function: % - %', r.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 5: Drop all custom types (enums)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT t.typname
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public' AND t.typtype = 'e'
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Dropped type: %', r.typname;
    END LOOP;
END $$;

-- Step 6: Drop platform_admin schema if exists
DROP SCHEMA IF EXISTS platform_admin CASCADE;

-- Step 7: Clear auth schema (users, sessions, etc.)
TRUNCATE auth.users CASCADE;
TRUNCATE auth.identities CASCADE;
TRUNCATE auth.sessions CASCADE;
TRUNCATE auth.refresh_tokens CASCADE;
TRUNCATE auth.mfa_factors CASCADE;
TRUNCATE auth.mfa_challenges CASCADE;
TRUNCATE auth.mfa_amr_claims CASCADE;
TRUNCATE auth.flow_state CASCADE;
TRUNCATE auth.saml_providers CASCADE;
TRUNCATE auth.saml_relay_states CASCADE;
TRUNCATE auth.sso_providers CASCADE;
TRUNCATE auth.sso_domains CASCADE;
TRUNCATE auth.one_time_tokens CASCADE;

-- Step 8: Clear migration history so we can start fresh
TRUNCATE supabase_migrations.schema_migrations;

-- Step 9: Verify - count remaining objects
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';
    SELECT COUNT(*) INTO type_count FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATABASE RESET COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Remaining tables: %', table_count;
    RAISE NOTICE 'Remaining functions: %', function_count;
    RAISE NOTICE 'Remaining types: %', type_count;
    RAISE NOTICE '============================================';
END $$;
