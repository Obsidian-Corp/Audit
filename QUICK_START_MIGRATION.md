# 🚀 Quick Start: Apply Database Migrations

## TL;DR - 3 Steps to Complete Setup

### Step 1: Open Supabase Dashboard SQL Editor
https://supabase.com/dashboard/project/otbviownvtbuatjsoezq/sql

### Step 2: Copy & Run SQL
```bash
# Copy the consolidated migration script
cat APPLY_ALL_MIGRATIONS.sql
```
Paste into SQL Editor → Click "Run"

### Step 3: Verify
```bash
node verify-migrations.mjs
```

**Expected**: ✅ ALL MIGRATIONS APPLIED SUCCESSFULLY

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `APPLY_ALL_MIGRATIONS.sql` | **Copy-paste this into Supabase SQL Editor** |
| `verify-migrations.mjs` | Run to verify migrations applied successfully |
| `MIGRATION_STATUS_REPORT.md` | Full detailed report (read if issues) |
| `APPLY_MIGRATIONS_MANUALLY.md` | Step-by-step guide with explanations |

---

## ✅ What This Does

### Creates:
- ✅ `risk_assessment_requirements` table
- ✅ `check_risk_assessment_complete()` RPC function
- ✅ `get_confirmation_stats()` RPC function
- ✅ Auto-triggers for risk completion
- ✅ Activity logging for overrides
- ✅ RLS security policies

### Enables:
- ✅ Risk-first workflow enforcement (Issue #2)
- ✅ Confirmation statistics dashboard (Issue #9)
- ✅ Breadcrumb navigation (Issue #14 - already working)

---

## 🎯 After Migration

Test these features:
1. Navigate to engagement → See risk gate on program builder
2. Complete risk assessment → Program builder unlocks
3. Create confirmations → See statistics
4. Check breadcrumbs on all pages

---

**Time**: 2 minutes to apply
**Impact**: 3 major features activated
**Risk**: Low (all tested locally)
