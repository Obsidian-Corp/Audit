# Obsidian Audit - Production Deployment Guide

This guide covers the complete deployment process for Obsidian Audit to production environments.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Supabase project (production)
- Vercel account (optional)
- GitHub account with CI/CD secrets configured

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env
```

Required environment variables:
- `VITE_SUPABASE_URL` - Production Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `VITE_APP_URL` - Production application URL

### 2. Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

### 3. Build & Deploy

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Deploy to production
vercel --prod
```

#### Option B: Docker

```bash
# Build production image
docker build -t obsidian-audit:latest \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_APP_URL=$VITE_APP_URL \
  .

# Run container
docker run -d -p 80:80 --name obsidian-audit obsidian-audit:latest
```

#### Option C: Docker Compose

```bash
# Production deployment
docker-compose up -d app

# With monitoring stack
docker-compose --profile monitoring up -d
```

---

## CI/CD Pipeline

### GitHub Actions Secrets

Configure these secrets in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_APP_URL` | Production app URL |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token |
| `SUPABASE_PRODUCTION_PROJECT_REF` | Production project reference |
| `SLACK_WEBHOOK_URL` | Slack notifications (optional) |
| `SENTRY_AUTH_TOKEN` | Sentry release tracking |
| `SENTRY_ORG` | Sentry organization |
| `SENTRY_PROJECT` | Sentry project name |
| `SNYK_TOKEN` | Snyk security scanning (optional) |
| `CODECOV_TOKEN` | Code coverage tracking (optional) |

### Pipeline Triggers

- **Push to `main`**: Full build, test, security scan, deploy to production
- **Push to `develop`**: Build, test, deploy to staging
- **Pull requests**: Build, test, security scan (no deploy)
- **Manual trigger**: Workflow dispatch available

---

## Monitoring & Observability

### Health Checks

The application exposes health endpoints:

```
GET /health    -> Returns "healthy" (HTTP 200)
GET /ready     -> Returns "ready" (HTTP 200)
```

### Error Tracking (Sentry)

Configure Sentry for production error tracking:

```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
```

### Logging

Application logs are structured JSON for easy parsing:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "API request failed",
  "context": {
    "userId": "user-123",
    "action": "create_engagement"
  },
  "error": {
    "name": "Error",
    "message": "Database connection failed"
  }
}
```

### Prometheus Metrics

When running with monitoring profile:

```bash
docker-compose --profile monitoring up -d
```

Access:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in CI/CD, not in code
- [ ] Environment variables validated
- [ ] HTTPS configured
- [ ] CSP headers configured
- [ ] RLS policies reviewed and tested
- [ ] Supabase edge functions have proper JWT verification

### Post-Deployment

- [ ] Health endpoints responding
- [ ] Error tracking connected
- [ ] Database connections working
- [ ] File uploads working
- [ ] Authentication flows tested
- [ ] All user roles tested

---

## Backup & Recovery

### Database Backups

Supabase provides automatic daily backups. For additional protection:

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240115.sql
```

### Migration Rollback

```bash
# List migrations
supabase migration list

# Rollback last migration (if needed)
# Note: Must be done manually with reverse migration
supabase db reset --linked
```

---

## Scaling Considerations

### Horizontal Scaling

1. Deploy multiple container instances
2. Use load balancer (nginx, AWS ALB, etc.)
3. Configure session affinity if needed

### Database Scaling

1. Supabase handles connection pooling
2. Consider read replicas for reporting
3. Use database indexes for performance

### CDN Configuration

1. Configure CloudFlare or AWS CloudFront
2. Set cache headers for static assets
3. Enable compression

---

## Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm ci --legacy-peer-deps
npm run build
```

**Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check RLS policies
supabase db lint
```

**Authentication Issues**
- Verify Supabase URL and keys
- Check JWT expiration settings
- Verify redirect URLs in Supabase dashboard

### Getting Help

- GitHub Issues: https://github.com/Obsidian-Corp/Audit/issues
- Documentation: /docs directory
- Support: support@obsidiancorp.com

---

## Version Information

- **Application**: 0.1.0
- **Node.js**: 20.x
- **React**: 18.3.x
- **Supabase Client**: 2.79.x

---

## File Structure Reference

```
/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Main CI/CD pipeline
│       └── database.yml        # Database migrations
├── monitoring/
│   └── prometheus.yml          # Prometheus config
├── supabase/
│   ├── migrations/             # Database migrations (113+)
│   ├── functions/              # Edge functions (60+)
│   └── config.toml             # Supabase config
├── src/
│   ├── components/             # React components (203+)
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   ├── types/                  # TypeScript types
│   └── test/                   # Test utilities
├── .env.example                # Environment template
├── Dockerfile                  # Production container
├── docker-compose.yml          # Container orchestration
├── nginx.conf                  # Web server config
├── vercel.json                 # Vercel deployment
├── vitest.config.ts            # Test configuration
└── package.json                # Dependencies
```

---

## Changelog

### 0.1.0 (Initial Release)
- Complete audit execution platform
- Professional standards compliance (AU-C, ISA, PCAOB)
- Multi-tenant architecture
- 44+ professional standards tables
- 203+ React components
- 60+ Supabase edge functions
- Full CI/CD pipeline
- Docker containerization
- Comprehensive testing setup
