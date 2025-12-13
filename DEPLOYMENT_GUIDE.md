# Obsidian Audit Platform - Backend Deployment Guide

**Version:** 1.0
**Date:** November 29, 2025
**Project:** Build 37494

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [Storage Configuration](#storage-configuration)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools

- **Supabase CLI** v1.50.0 or higher
- **Node.js** v18.0.0 or higher
- **Deno** v1.30.0 or higher (for Edge Functions)
- **Git** for version control

### Installation

```bash
# Install Supabase CLI
npm install -g supabase

# Install Deno (for Edge Functions)
curl -fsSL https://deno.land/install.sh | sh

# Verify installations
supabase --version
deno --version
```

### Supabase Project Setup

1. Create a Supabase project at https://app.supabase.com
2. Note your project reference ID
3. Generate service role key (Settings > API)

---

## Environment Setup

### 1. Link Local Project to Supabase

```bash
cd /Users/abdulkarimsankareh/Downloads/build-it-happens-37494

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# You'll be prompted for your database password
```

### 2. Create Environment Files

Create `.env.local` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
SITE_URL=http://localhost:5173
NODE_ENV=development

# Email Service (Optional - Resend)
RESEND_API_KEY=your_resend_key_here
```

For production, create `.env.production`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
SITE_URL=https://app.obsidianaudit.com
NODE_ENV=production
RESEND_API_KEY=your_production_resend_key
```

---

## Database Migration

### Step 1: Review Migrations

Check all migration files in order:

```bash
ls -la supabase/migrations/20251129_*.sql
```

You should see:
- `20251129_001_core_platform_tables.sql`
- `20251129_002_clients_engagements.sql`
- `20251129_003_audit_programs_procedures.sql`
- `20251129_004_audit_tools.sql`
- `20251129_005_review_collaboration.sql`
- `20251129_006_documents_storage.sql`
- `20251129_007_indexes_optimization.sql`
- `20251129_008_storage_setup.sql`
- `20251129_009_realtime_setup.sql`

### Step 2: Test Migrations Locally (Optional but Recommended)

```bash
# Start local Supabase instance
supabase start

# Apply migrations locally
supabase db reset

# Check migration status
supabase migration list
```

### Step 3: Apply Migrations to Production

```bash
# Push migrations to remote database
supabase db push

# Verify migrations were applied
supabase migration list --remote
```

### Step 4: Verify Database Schema

```bash
# Connect to your database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Check tables were created
\dt

# Check indexes
\di

# Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected output: All tables should have `rowsecurity = true`

---

## Edge Functions Deployment

### Step 1: Review Edge Functions

```bash
ls -la supabase/functions/*/index.ts
```

You should have:
- `invite-user/index.ts`
- `calculate-materiality/index.ts`
- `calculate-sampling/index.ts`
- `global-search/index.ts`

### Step 2: Deploy Edge Functions

Deploy all functions:

```bash
# Deploy invite-user function
supabase functions deploy invite-user

# Deploy calculate-materiality function
supabase functions deploy calculate-materiality

# Deploy calculate-sampling function
supabase functions deploy calculate-sampling

# Deploy global-search function
supabase functions deploy global-search
```

Or deploy all at once:

```bash
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

### Step 3: Set Environment Variables for Edge Functions

```bash
# Set environment variables for Edge Functions
supabase secrets set SITE_URL=https://app.obsidianaudit.com
supabase secrets set RESEND_API_KEY=your_resend_key

# Verify secrets
supabase secrets list
```

### Step 4: Test Edge Functions

```bash
# Test invite-user function
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/invite-user' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "test@example.com",
    "role": "staff",
    "organizationId": "your-org-id"
  }'
```

---

## Storage Configuration

### Verify Storage Buckets

```bash
# Check if buckets were created by migration
# Log into Supabase Dashboard > Storage
```

Expected buckets:
- `engagement-documents` (private)
- `workpapers` (private)
- `audit-reports` (private)
- `avatars` (public)
- `organization-logos` (public)

### Verify Storage Policies

In Supabase Dashboard:
1. Go to Storage > Policies
2. Verify each bucket has appropriate policies
3. Test upload/download permissions

---

## Environment Variables

### Required Environment Variables

#### Frontend (Vite)

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Edge Functions

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SITE_URL=https://app.obsidianaudit.com
RESEND_API_KEY=your_resend_key (optional)
```

---

## Testing

### 1. RLS Policy Tests

```bash
# Run RLS tests
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  -f supabase/tests/test_rls_policies.sql
```

### 2. Integration Tests

Create a test organization and user:

```sql
-- In Supabase SQL Editor

-- Create test organization
INSERT INTO organizations (name, slug, subscription_tier)
VALUES ('Test Organization', 'test-org', 'professional')
RETURNING id;

-- Note the returned ID and use it to create a member
-- (Replace USER_ID with actual auth.users ID)
INSERT INTO organization_members (organization_id, user_id, role, status)
VALUES ('ORG_ID_FROM_ABOVE', 'USER_ID', 'admin', 'active');
```

### 3. Frontend Integration Test

1. Start your frontend application
2. Login with test user
3. Verify you can:
   - Create a client
   - Create an engagement
   - Create audit procedures
   - Upload documents
   - Calculate materiality
   - Use global search

---

## Rollback Procedures

### Rollback Migrations

If you need to rollback migrations:

```bash
# This will remove the latest migration
supabase migration repair --status reverted <timestamp>

# Or manually delete migration records
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '<timestamp>';
```

### Rollback Edge Functions

```bash
# Delete a function
supabase functions delete <function-name>
```

### Database Backup

Always backup before major changes:

```bash
# Create backup
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  < backup_20251129_120000.sql
```

---

## Post-Deployment Checklist

- [ ] All migrations applied successfully
- [ ] All Edge Functions deployed
- [ ] Storage buckets created
- [ ] Storage policies configured
- [ ] Environment variables set
- [ ] RLS policies tested
- [ ] Integration tests passed
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Monitoring configured
- [ ] Backup procedures verified

---

## Troubleshooting

### Common Issues

**Issue:** Migration fails with "relation already exists"
**Solution:** Check if previous migration ran partially. Use `supabase migration repair`

**Issue:** Edge Function returns 500 error
**Solution:** Check function logs with `supabase functions logs <function-name>`

**Issue:** RLS policies blocking legitimate access
**Solution:** Review policies in SQL editor, verify user's organization_id matches

**Issue:** Storage upload fails
**Solution:** Verify bucket policies, check file size limits

---

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review error logs in Supabase Dashboard
- Contact development team

---

**Deployment Guide Version:** 1.0
**Last Updated:** November 29, 2025
