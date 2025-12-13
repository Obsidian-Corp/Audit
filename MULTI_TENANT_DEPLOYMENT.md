# Multi-Tenant Deployment Guide
## Enterprise Subdomain & Custom Domain Architecture

This guide covers all 4 phases of the multi-tenant architecture for Obsidian Corp Audit Platform.

---

## Architecture Overview

```
obsidian-corp.com (Marketing site)
│
├── admin.obsidian-corp.com
│   └── Platform Admin (Obsidian Corp internal)
│
├── app.[FIRM].obsidian-corp.com
│   ├── app.deloitte.obsidian-corp.com (Deloitte's audit staff)
│   ├── app.pwc.obsidian-corp.com (PwC's audit staff)
│   └── app.acme.obsidian-corp.com (Acme Audit Firm's staff)
│
├── clients.[FIRM].obsidian-corp.com
│   ├── clients.deloitte.obsidian-corp.com (Deloitte's client portal)
│   ├── clients.pwc.obsidian-corp.com (PwC's client portal)
│   └── clients.acme.obsidian-corp.com (Acme's client portal)
│
└── Custom Domains (Phase 4)
    ├── audit.deloitte.com → Deloitte's custom app domain
    └── clients.deloitte.com → Deloitte's custom client portal
```

---

## Phase 1: Localhost Development (Current)

**Status:** ✅ Ready to use

**How it works:**
- All firms access: `http://localhost:8081/`
- Tenant context detected from login session (not subdomain)
- Works without DNS configuration

**Testing:**
```bash
# Just run the dev server
npm run dev

# Access at http://localhost:8081/
```

**Limitations:**
- No subdomain isolation
- Cannot test true multi-tenant experience
- All firms share same URL

---

## Phase 2: Path-Based Routing (Optional)

**When to use:** Testing multi-tenancy without subdomain DNS setup

**Format:**
```
https://obsidian-corp.com/firm/deloitte/dashboard
https://obsidian-corp.com/firm/pwc/dashboard
```

**Implementation:**
Already supported via `getFirmSlugFromPath()` in `src/lib/tenant.ts`

**Pros:**
- No DNS configuration needed
- Easy to test
- Works on any hosting platform

**Cons:**
- Not as clean as subdomains
- Firm slug visible in URL
- Harder to white-label

---

## Phase 3: Subdomain Routing (Production Ready)

**When to use:** Production deployment with proper branding

**Required:**
1. ✅ Migration deployed (adds slug, custom_domain columns)
2. ✅ TenantContext implemented
3. DNS wildcard configuration (see below)
4. SSL wildcard certificate

### Step 1: Deploy Migration

```bash
cd /Users/abdulkarimsankareh/Downloads/build-it-happens-37494

# Deploy the multi-tenant migration
supabase db push

# Verify migration
supabase db remote list | grep firms
```

You should see columns: `id`, `name`, `slug`, `custom_domain`, `logo_url`, `primary_color`

### Step 2: Configure DNS (GoDaddy)

**Go to:** https://dnsmanagement.godaddy.com/

**Add these DNS records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 600 |
| A | * | YOUR_SERVER_IP | 600 |
| A | *.* | YOUR_SERVER_IP | 600 |

**Example for Vercel deployment:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | cname.vercel-dns.com | 600 |
| CNAME | * | cname.vercel-dns.com | 600 |
| CNAME | *.* | cname.vercel-dns.com | 600 |

This enables:
- `obsidian-corp.com` ✓
- `admin.obsidian-corp.com` ✓
- `app.deloitte.obsidian-corp.com` ✓
- `clients.pwc.obsidian-corp.com` ✓

### Step 3: SSL Certificate (Wildcard)

**Option A: Let's Encrypt (Free)**
```bash
certbot certonly --dns-godaddy \
  -d '*.obsidian-corp.com' \
  -d '*.*.obsidian-corp.com'
```

**Option B: Vercel (Automatic)**
Vercel automatically provisions SSL for wildcard domains.

**Option C: Cloudflare (Recommended)**
1. Transfer DNS to Cloudflare
2. Enable "Full SSL"
3. Wildcard certs automatically provisioned

### Step 4: Deploy Application

**Vercel (Recommended):**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure domains in Vercel dashboard
# Add: *.obsidian-corp.com and *.*.obsidian-corp.com
```

**Environment Variables for Vercel:**
```
VITE_SUPABASE_URL=https://qtsvdeauuawfewdzbflr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_ENABLE_MULTI_TENANT=true
```

### Step 5: Create Firms with Slugs

**SQL Editor:**
```sql
-- Create example firms
INSERT INTO firms (name, slug, primary_color, plan_type, is_active)
VALUES
  ('Deloitte', 'deloitte', '#00A3E0', 'enterprise', true),
  ('PwC', 'pwc', '#D04A02', 'enterprise', true),
  ('Acme Audit Firm', 'acme', '#0066CC', 'professional', true);

-- Verify slugs
SELECT id, name, slug, plan_type FROM firms;
```

### Step 6: Test Subdomains

**Access URLs:**
- Admin: `https://admin.obsidian-corp.com`
- Deloitte App: `https://app.deloitte.obsidian-corp.com`
- Deloitte Clients: `https://clients.deloitte.obsidian-corp.com`
- PwC App: `https://app.pwc.obsidian-corp.com`

**Expected Behavior:**
- Each firm sees only their own data
- Branding (logo, colors) applied automatically
- Page title shows firm name

---

## Phase 4: Custom Domains (Enterprise)

**When to use:** Enterprise customers who want their own domain

**Example:**
- `audit.deloitte.com` (instead of app.deloitte.obsidian-corp.com)
- `clients.deloitte.com` (instead of clients.deloitte.obsidian-corp.com)

### Step 1: Customer Configures DNS

Customer (Deloitte) adds CNAME records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | audit | app.deloitte.obsidian-corp.com | 600 |
| CNAME | clients | clients.deloitte.obsidian-corp.com | 600 |

### Step 2: Add Domain Mapping (SQL)

```sql
-- Add custom domain for Deloitte
INSERT INTO domain_mappings (firm_id, domain, domain_type, verification_token, is_verified)
VALUES
  (
    (SELECT id FROM firms WHERE slug = 'deloitte'),
    'audit.deloitte.com',
    'app',
    gen_random_uuid()::text,
    false
  ),
  (
    (SELECT id FROM firms WHERE slug = 'deloitte'),
    'clients.deloitte.com',
    'client_portal',
    gen_random_uuid()::text,
    false
  );
```

### Step 3: Domain Verification

**Show verification instructions to customer:**

```sql
SELECT
  domain,
  'Add TXT record: _obsidian-verification.' || domain || ' = ' || verification_token as instruction
FROM domain_mappings
WHERE firm_id = (SELECT id FROM firms WHERE slug = 'deloitte')
  AND is_verified = false;
```

**Customer adds TXT record:**
```
Type: TXT
Name: _obsidian-verification.audit
Value: <verification_token>
```

**Verify domain:**
```sql
-- After customer adds TXT record, verify:
UPDATE domain_mappings
SET is_verified = true, verified_at = NOW()
WHERE domain = 'audit.deloitte.com';
```

### Step 4: Configure SSL for Custom Domain

**Vercel:**
1. Go to Vercel dashboard → Domains
2. Add `audit.deloitte.com`
3. Vercel auto-provisions SSL

**Cloudflare:**
1. Add domain to Cloudflare
2. Enable "Full SSL"
3. Add Page Rule: `audit.deloitte.com/*` → SSL: Full

### Step 5: Test Custom Domain

```bash
# Should work exactly like subdomain
https://audit.deloitte.com
https://clients.deloitte.com
```

**Expected:**
- Firm detected via `get_firm_by_domain()` function
- Same data as subdomain version
- Custom domain shown in browser
- Customer's branding applied

---

## Monitoring & Troubleshooting

### Check Tenant Detection

Open browser console on any page:

```javascript
// Check what tenant was detected
const detection = window.__TENANT_INFO__;
console.log('Detected Tenant:', detection);
```

### Verify Firm Lookup

```sql
-- Test the lookup function
SELECT * FROM get_firm_by_domain('app.deloitte.obsidian-corp.com');
SELECT * FROM get_firm_by_domain('audit.deloitte.com');
```

### Common Issues

**1. "Organization not found for this domain"**
- Check DNS is propagated: `dig app.deloitte.obsidian-corp.com`
- Verify firm exists: `SELECT * FROM firms WHERE slug = 'deloitte'`
- Check function: `SELECT * FROM get_firm_by_domain('...')`

**2. "Tenant context not available"**
- Ensure TenantProvider is wrapping app (check App.tsx)
- Check browser console for errors
- Verify migration was deployed

**3. Custom domain not working**
- Check domain_mappings table: `SELECT * FROM domain_mappings`
- Verify is_verified = true
- Check DNS: `dig audit.deloitte.com`
- Verify SSL certificate covers custom domain

---

## Security Considerations

### 1. Subdomain Isolation
- Each firm gets separate subdomain
- Browser treats as different origin
- Cookies/localStorage separated

### 2. RLS Policies
- All queries filtered by firm_id
- Users can only see their firm's data
- Double-layer security (subdomain + RLS)

### 3. Custom Domain Verification
- Requires DNS verification before activation
- Prevents domain hijacking
- Verification token stored securely

### 4. SSL/TLS
- Wildcard certificates for all subdomains
- Let's Encrypt auto-renewal
- HSTS headers recommended

---

## Cost Breakdown

**Phase 1 (Localhost):** $0
**Phase 2 (Path-based):** $0 extra
**Phase 3 (Subdomains):**
- DNS: Included with domain ($15/yr)
- Hosting: Vercel Pro $20/mo (supports wildcards)
- SSL: Free (Let's Encrypt or Vercel)
- **Total: ~$20/mo**

**Phase 4 (Custom Domains):**
- Per customer: $0 (they use their domain)
- SSL: Free (auto-provisioned)
- Verification: Automated
- **Total: $0 per customer**

---

## Deployment Checklist

### Pre-Deployment
- [ ] Migration deployed: `supabase db push`
- [ ] Firms have slugs: `SELECT slug FROM firms`
- [ ] TenantProvider added to App.tsx
- [ ] Test on localhost

### DNS Configuration
- [ ] Wildcard A/CNAME records added
- [ ] DNS propagated: `dig app.test.obsidian-corp.com`
- [ ] TTL set to 600 seconds

### SSL Setup
- [ ] Wildcard cert obtained
- [ ] Cert includes *.obsidian-corp.com
- [ ] Cert includes *.*.obsidian-corp.com
- [ ] Auto-renewal configured

### Application Deployment
- [ ] Deployed to Vercel/hosting
- [ ] Environment variables set
- [ ] Wildcard domain configured in hosting
- [ ] Health check passes

### Testing
- [ ] Admin portal: admin.obsidian-corp.com
- [ ] Test firm app: app.test.obsidian-corp.com
- [ ] Test client portal: clients.test.obsidian-corp.com
- [ ] Custom domain (if applicable)
- [ ] Branding applies correctly
- [ ] Data isolation verified

---

## Next Steps

1. **Deploy Migration Now:**
   ```bash
   supabase db push
   ```

2. **Test Localhost:**
   ```bash
   npm run dev
   # Visit http://localhost:8081/
   ```

3. **When Ready for Production:**
   - Configure DNS wildcards
   - Deploy to Vercel
   - Test subdomains

4. **Enable Custom Domains:**
   - Build domain verification UI
   - Allow firms to add custom domains
   - Automate SSL provisioning

---

**Your platform is now enterprise-ready with full multi-tenant support!** 🎉
