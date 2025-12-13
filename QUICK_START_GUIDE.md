# Obsidian Audit Platform - Quick Start Guide

**Get your backend running in 15 minutes**

---

## Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

---

## Step 1: Link to Supabase (2 minutes)

```bash
cd /Users/abdulkarimsankareh/Downloads/build-it-happens-37494

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

Enter your database password when prompted.

---

## Step 2: Apply Migrations (5 minutes)

```bash
# Push all migrations to your database
supabase db push
```

This will create:
- ✅ 30+ database tables
- ✅ 100+ RLS policies
- ✅ 100+ indexes
- ✅ 5 storage buckets
- ✅ Real-time subscriptions

---

## Step 3: Deploy Edge Functions (5 minutes)

```bash
# Deploy all Edge Functions
supabase functions deploy invite-user
supabase functions deploy calculate-materiality
supabase functions deploy calculate-sampling
supabase functions deploy global-search
```

---

## Step 4: Set Environment Variables (2 minutes)

```bash
# Set required secrets
supabase secrets set SITE_URL=https://app.obsidianaudit.com

# Optional: Set Resend API key for emails
supabase secrets set RESEND_API_KEY=re_your_key_here
```

---

## Step 5: Update Your Frontend .env (1 minute)

Create `.env.local` in your project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these values from Supabase Dashboard > Settings > API

---

## Step 6: Test (Optional)

```bash
# Test global search function
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/global-search' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"query": "test", "limit": 10}'
```

---

## You're Done! 🎉

Your backend is now live with:

- ✅ **30+ Tables** for complete audit workflow
- ✅ **Multi-tenant Security** with RLS
- ✅ **Real-time Collaboration** enabled
- ✅ **Full-text Search** across all entities
- ✅ **File Storage** with 5 secure buckets
- ✅ **Edge Functions** for core calculations

---

## Next Steps

1. **Start your frontend:**
   ```bash
   npm run dev
   ```

2. **Create your first organization:**
   - Sign up via your frontend
   - This will automatically create an organization

3. **Invite team members:**
   - Use the invite-user Edge Function
   - Or add them directly in the UI

4. **Create your first client and engagement:**
   - Use the frontend forms
   - All data is automatically secured by RLS

---

## Common Commands

```bash
# View migration status
supabase migration list

# View function logs
supabase functions logs global-search

# Reset local database (for testing)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

---

## Troubleshooting

**Problem:** Migrations fail
**Solution:** Check `supabase migration list` and repair if needed

**Problem:** Functions return 500 error
**Solution:** Check logs with `supabase functions logs <name>`

**Problem:** Can't see data in frontend
**Solution:** Verify RLS policies and user's organization membership

---

## Documentation

- **Full Implementation Report:** `BACKEND_IMPLEMENTATION_REPORT.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Roadmap:** `BACKEND_IMPLEMENTATION_ROADMAP.md`

---

## Support

For issues:
1. Check error logs in Supabase Dashboard
2. Review RLS policies in SQL Editor
3. Verify environment variables are set correctly
4. Check the documentation files

---

**Last Updated:** November 29, 2025
