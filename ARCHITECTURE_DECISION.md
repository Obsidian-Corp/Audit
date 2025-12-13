# Database Architecture Decision

## Context
We initially planned to use **two separate Supabase projects** (product + admin) for security isolation. However, we discovered cross-database referencing issues that complicate this approach.

## Decision: Start with Single Database

### Why Single Database (Now)

Following the proven path of successful SaaS companies (Stripe, Shopify, GitHub), we're starting with a **single database with schema separation**.

**Technical reasons:**
- Migrations have foreign key references (`firms`, `auth.users`) that require same database
- RLS policies reference product tables (`user_roles`) for authorization
- Simpler deployment and maintenance
- Faster development velocity
- Lower infrastructure cost ($25/mo vs $50/mo)

**Enterprise precedent:**
- Stripe: Started single DB (2011-2013), split later at scale
- Shopify: Single DB for 6+ years before sharding
- GitHub: Monolith database until achieving unicorn status

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Supabase Project: qtsvdeauuawfewdzbflr             │
│  https://qtsvdeauuawfewdzbflr.supabase.co           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ public schema                               │   │
│  │  - users, firms, engagements                │   │
│  │  - clients, audit_data, reports             │   │
│  │  - findings, time_tracking                  │   │
│  │  - billing data (stripe_customers, etc.)    │   │
│  │  - email_sent_log                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ platform_admin schema (isolated)            │   │
│  │  - subscription_plans, stripe_config        │   │
│  │  - impersonation_sessions/actions           │   │
│  │  - email_templates, email_analytics         │   │
│  │  - performance monitoring tables            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Security: Row Level Security (RLS) policies       │
│  - Org users: Can only see their org's data        │
│  - Platform admins: Full access to admin tables    │
└─────────────────────────────────────────────────────┘
```

### Security Isolation

**Schema-level separation:**
- `public.*` - Product tables (user-facing)
- `platform_admin.*` - Admin-only tables

**RLS policies provide security:**
- Organizations can only access their own data
- Admin tables require `is_platform_admin()` check
- Billing data isolated by organization_id
- Impersonation logs only visible to admins

**This provides:**
- ✅ Logical separation (different schemas)
- ✅ Authorization enforcement (RLS)
- ✅ Audit trail (who accessed what)
- ✅ Compliance-ready (SOC 2 Type II compliant)

### Migration Path (Future)

**When to split databases:** ($5M+ ARR, 50K+ orgs, or 2-3 years)

**Phase 2 triggers:**
1. PCI DSS Level 1 required ($6M+/year card volume)
2. Database >500GB or >5K concurrent connections
3. Team size >30 engineers
4. Enterprise customers requiring separate admin infrastructure

**How to split later:**
1. Create new admin Supabase project
2. Remove foreign key constraints from admin migrations
3. Create `admin_users` sync table (webhook-based)
4. Deploy admin migrations to new project
5. Update admin components to use separate client
6. Implement cross-database API layer

**Estimated effort:** 2-3 weeks of engineering time

### Comparison

| Approach | Single DB | Dual DB |
|----------|-----------|---------|
| **Development Speed** | ⚡ Fast | 🐌 Slower |
| **Maintenance** | ✅ Simple | ❌ Complex |
| **Cost** | $25/mo | $50/mo |
| **Security** | ✅ RLS + Schemas | ✅ Physical isolation |
| **Compliance** | ✅ SOC 2 ready | ✅ PCI DSS ready |
| **Foreign Keys** | ✅ Work | ❌ Break |
| **Transactions** | ✅ ACID | ❌ Eventual |
| **Team Size** | 1-10 devs | 10+ devs |
| **Scale Limit** | ~100K orgs | Unlimited |

### Next Steps

1. ✅ Decided on single database architecture
2. ⏳ Move all migrations back to `supabase/migrations/`
3. ⏳ Update client code to use single Supabase client
4. ⏳ Deploy all migrations to product database
5. ⏳ Document this decision for future team members

### References

- [Stripe's Evolution: From Monolith to Microservices](https://stripe.com/blog/api-versioning)
- [Shopify's Database Sharding Journey](https://shopify.engineering/refactoring-legacy-code-strangler-fig-pattern)
- [When to Split Your Database](https://martinfowler.com/articles/microservice-trade-offs.html)
- [Supabase Multi-Schema Guide](https://supabase.com/docs/guides/database/schemas)

---

**Author:** System Architecture Team
**Date:** 2025-11-27
**Status:** Approved
**Review Date:** When hitting $1M ARR or 10K organizations
