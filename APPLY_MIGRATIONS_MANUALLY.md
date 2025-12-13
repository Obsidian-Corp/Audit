# Manual Migration Application Guide

## Status: Migrations Not Yet Applied to Remote Database

The Supabase CLI `db push` command requires Docker, which is not running. Apply these migrations manually via the Supabase Dashboard.

---

## ✅ Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/otbviownvtbuatjsoezq
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Apply Migration #1: Risk-First Workflow

**File**: `supabase/migrations/20251130120000_enforce_risk_first_workflow.sql`

Copy the ENTIRE contents of this file and paste into the SQL Editor, then click **Run**.

This will create:
- ✅ `risk_assessment_requirements` table
- ✅ `check_risk_assessment_complete()` RPC function
- ✅ `mark_risk_assessment_complete()` trigger function
- ✅ `log_risk_requirement_override()` activity logging
- ✅ RLS policies
- ✅ Seed data for existing engagements

**Expected Output**: Query executed successfully (should take 2-3 seconds)

---

### 3. Apply Migration #2: Confirmation Tracker RPC Function

**File**: `supabase/migrations/20251130120001_create_confirmation_tracker.sql`

**NOTE**: The `confirmations` table already exists, so we need to apply ONLY the RPC function from this migration.

Copy and paste **ONLY THIS SQL** into the SQL Editor:

```sql
-- ================================================================
-- GET CONFIRMATION STATS RPC FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_confirmation_stats(engagement_id_param UUID)
RETURNS TABLE (
  total_confirmations BIGINT,
  pending_count BIGINT,
  received_count BIGINT,
  exception_count BIGINT,
  not_responded_count BIGINT,
  response_rate NUMERIC,
  overdue_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_confirmations,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_count,
    COUNT(*) FILTER (WHERE status = 'received')::BIGINT AS received_count,
    COUNT(*) FILTER (WHERE status = 'exception')::BIGINT AS exception_count,
    COUNT(*) FILTER (WHERE status = 'not_responded')::BIGINT AS not_responded_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('received', 'exception'))::NUMERIC / COUNT(*)::NUMERIC) * 100,
          1
        )
      ELSE 0
    END AS response_rate,
    COUNT(*) FILTER (
      WHERE status = 'pending'
        AND follow_up_date IS NOT NULL
        AND follow_up_date < CURRENT_DATE
    )::BIGINT AS overdue_count
  FROM public.confirmations
  WHERE engagement_id = engagement_id_param;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_confirmation_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmation_stats(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.get_confirmation_stats IS 'Calculate confirmation statistics for engagement dashboard';
```

**Expected Output**: Function created successfully

---

### 4. Verify Migrations Applied

After running both migrations, verify by running this query in SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('risk_assessment_requirements', 'confirmations')
ORDER BY table_name;

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('check_risk_assessment_complete', 'get_confirmation_stats')
ORDER BY routine_name;
```

**Expected Output**:
- 2 tables: `confirmations`, `risk_assessment_requirements`
- 2 functions: `check_risk_assessment_complete`, `get_confirmation_stats`

---

### 5. Verify from Command Line

After applying migrations in the dashboard, run this verification script:

```bash
node verify-migrations.mjs
```

**Expected Output**:
```
✅ ALL MIGRATIONS APPLIED SUCCESSFULLY
```

---

## 📋 What Gets Created

### Migration #1: Risk-First Workflow Enforcement
- **Table**: `risk_assessment_requirements`
  - Tracks engagement risk assessment completion status
  - Stores partner override justifications
  - Links to engagements, firms, users

- **RPC Function**: `check_risk_assessment_complete(engagement_id_param UUID)`
  - Returns TRUE if risk assessment complete OR override granted
  - Used by frontend to show/hide risk gate

- **Trigger Function**: `mark_risk_assessment_complete()`
  - Auto-marks risk complete when assessment approved
  - Runs on INSERT/UPDATE to risk_assessments table

- **Activity Logging**: `log_risk_requirement_override()`
  - Logs all partner overrides to engagement_activity
  - Provides audit trail for quality control

### Migration #2: Confirmation Tracker (RPC Only)
- **RPC Function**: `get_confirmation_stats(engagement_id_param UUID)`
  - Calculates confirmation statistics
  - Returns: total, pending, received, exceptions, response rate, overdue count
  - Used by dashboard widgets

---

## 🔧 Alternative: Apply via Supabase CLI with DB URL

If you have the database connection string with password, you can apply migrations directly:

```bash
npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.otbviownvtbuatjsoezq.supabase.co:5432/postgres"
```

To get the connection string:
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the "Connection string" (URI format)
3. Replace `[PASSWORD]` with your database password

---

## ⚠️ Important Notes

1. **Confirmations table already exists** - Don't re-create it, only add the RPC function
2. **RLS policies** - Migration #1 includes RLS policies for multi-tenant security
3. **Seed data** - Migration #1 seeds existing engagements with risk requirement records
4. **Triggers** - Auto-triggers will start working immediately after application
5. **Schema cache** - Supabase PostgREST may take 10-30 seconds to refresh schema cache

---

## ✅ Success Criteria

After applying migrations, you should be able to:

1. ✅ See risk gate appear in engagement program builder
2. ✅ Create confirmations and see statistics
3. ✅ Partner override dialog works (requires 20-char justification)
4. ✅ All activity logged to engagement_activity table
5. ✅ Breadcrumb navigation working across all pages

---

**Prepared**: 2025-11-30
**Project ID**: otbviownvtbuatjsoezq
**Migration Files**:
- `supabase/migrations/20251130120000_enforce_risk_first_workflow.sql`
- `supabase/migrations/20251130120001_create_confirmation_tracker.sql`
