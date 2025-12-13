# Quick Deployment Guide - Security Fixes

## TL;DR - 5 Minute Deployment

### Prerequisites
- [ ] Supabase CLI installed
- [ ] Database connection string ready
- [ ] Backup completed (or backup plan ready)
- [ ] Support team notified

### 1. Pre-Deployment (2 minutes)

```bash
# Navigate to project directory
cd /Users/abdulkarimsankareh/Downloads/build-it-happens-37494

# Save current state
psql $DATABASE_URL -f pre_deployment_verification.sql > pre_deploy_output.txt
```

### 2. Deployment (3 minutes)

```bash
# Deploy migration
supabase db push --db-url $DATABASE_URL

# Deploy tests
psql $DATABASE_URL -f supabase/tests/test_rls_policies.sql

# Run tests
psql $DATABASE_URL -c "SELECT tests.run_all_rls_tests();"

# Deploy edge functions
supabase functions deploy calculate-materiality
supabase functions deploy calculate-sampling
```

### 3. Verification (2 minutes)

```bash
# Verify deployment
psql $DATABASE_URL -f post_deployment_verification.sql > post_deploy_output.txt

# Check for errors
grep -i "error\|fail\|exception" post_deploy_output.txt

# If no errors:
echo "Deployment successful!"
```

### 4. If Something Goes Wrong

```bash
# EMERGENCY ROLLBACK
psql $DATABASE_URL -f rollback_script.sql
```

---

## Deployment Checklist

**Pre-Deployment:**
- [ ] Run `pre_deployment_verification.sql`
- [ ] Review output for anomalies
- [ ] Confirm database backup exists
- [ ] Set `DATABASE_URL` environment variable

**Deployment:**
- [ ] Migration applied successfully
- [ ] No SQL errors in output
- [ ] Test framework deployed
- [ ] All RLS tests pass (100%)
- [ ] Edge functions deployed
- [ ] Functions listed in `supabase functions list`

**Verification:**
- [ ] Run `post_deployment_verification.sql`
- [ ] Verify 56 new policies created
- [ ] Verify 4 test functions exist
- [ ] Test edge function with valid input (returns 200)
- [ ] Test edge function with invalid input (returns 400)
- [ ] Check application functionality
- [ ] Monitor error logs (30 minutes)

**Sign-Off:**
- [ ] No errors detected
- [ ] All tests passing
- [ ] Application working normally
- [ ] Performance acceptable
- [ ] Team notified of success

---

## Expected Results

### RLS Test Output
```
NOTICE: Testing clients table isolation...
NOTICE: ✓ Clients table isolation test PASSED
NOTICE: Testing engagements table isolation...
NOTICE: ✓ Engagements table isolation test PASSED
NOTICE: ALL RLS TESTS COMPLETED SUCCESSFULLY
```

### Policy Count
- Most tables: 3-4 policies each
- Total new policies: 56
- Tables covered: 20

### Edge Functions
- calculate-materiality: Deployed ✅
- calculate-sampling: Deployed ✅

---

## Troubleshooting

### Migration Fails
```bash
# Check error message
# Review policy conflicts
# Run rollback if needed
psql $DATABASE_URL -f rollback_script.sql
```

### Tests Fail
```bash
# Identify failing table
# Check that table's RLS policies
# Verify firm_id column exists
# Check user_firms() function
```

### Edge Functions Won't Deploy
```bash
# Check Supabase project URL
# Verify authentication
# Check function syntax
# Review deployment logs
supabase functions logs <function-name>
```

---

## Success Criteria

✅ Migration: No errors
✅ Tests: 100% pass rate
✅ Functions: Both deployed
✅ Validation: Returns 400 for bad input
✅ Performance: < 10% degradation
✅ Application: Working normally

---

## Emergency Contacts

- DevOps Lead: [NAME/EMAIL]
- Database Admin: [NAME/EMAIL]
- On-Call: [PHONE]

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20251201000001_fix_rls_policies.sql` | Main migration (56 policies) |
| `supabase/tests/test_rls_policies.sql` | Test framework (4 functions) |
| `supabase/functions/calculate-materiality/index.ts` | Materiality calculator |
| `supabase/functions/calculate-sampling/index.ts` | Sampling calculator |
| `pre_deployment_verification.sql` | Pre-flight checks |
| `post_deployment_verification.sql` | Post-flight checks |
| `rollback_script.sql` | Emergency rollback |
| `DEPLOYMENT_REPORT.md` | Full documentation |

---

**Quick Start:**
```bash
# Set your database URL
export DATABASE_URL="postgresql://user:pass@host:port/database"

# Run deployment
bash -c '
  psql $DATABASE_URL -f pre_deployment_verification.sql &&
  supabase db push --db-url $DATABASE_URL &&
  psql $DATABASE_URL -f supabase/tests/test_rls_policies.sql &&
  psql $DATABASE_URL -c "SELECT tests.run_all_rls_tests();" &&
  supabase functions deploy calculate-materiality &&
  supabase functions deploy calculate-sampling &&
  psql $DATABASE_URL -f post_deployment_verification.sql
'
```

Good luck! 🚀
