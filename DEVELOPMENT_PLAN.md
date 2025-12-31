# Obsidian Audit - Development Plan

## Executive Summary

This plan outlines the path from current state (UI prototype) to enterprise-ready audit execution engine. The focus is on building **real backend functionality** that competitors like TeamMate+ and AuditBoard have spent years developing.

---

## Current State Assessment

### What Exists (UI Layer)
- React components for audit workflows
- 17 database tables with RLS policies
- Basic CRUD operations via Supabase
- Workpaper editor (TipTap)
- Audit tools UI (materiality, sampling, confirmations)

### What's Missing (Business Logic Layer)
- No workpaper versioning/audit trail
- No procedure execution engine
- No cross-reference/tick-mark system
- No evidence chain-of-custody
- No sign-off workflow enforcement
- No materiality-driven procedure selection
- No real-time collaboration
- No report generation

---

## Development Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Make the core audit workflow actually functional

#### 1.1 Workpaper Engine (Week 1-2)
```
Priority: CRITICAL
```

**Tasks:**
- [ ] Implement workpaper versioning system
  - Store full document state on each save
  - Track who changed what and when
  - Allow rollback to previous versions
- [ ] Add workpaper locking mechanism
  - Prevent concurrent edits causing conflicts
  - Show "currently being edited by X"
- [ ] Create workpaper templates system
  - Standard workpaper formats (Lead schedules, PBC lists, etc.)
  - Template inheritance for firm customization
- [ ] Implement tick-mark system
  - Standard tick marks (√, F, T, ?, etc.)
  - Cross-reference to supporting documents
  - Tick-mark legend per workpaper

**Database Changes:**
```sql
-- Workpaper versions table
CREATE TABLE workpaper_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES workpapers(id),
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workpaper_id, version_number)
);

-- Workpaper locks
CREATE TABLE workpaper_locks (
  workpaper_id UUID PRIMARY KEY REFERENCES workpapers(id),
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Tick marks
CREATE TABLE tick_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES workpapers(id),
  symbol TEXT NOT NULL,
  meaning TEXT NOT NULL,
  cell_reference TEXT,
  linked_evidence_id UUID REFERENCES audit_documents(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Procedure Execution Engine (Week 2-3)
```
Priority: CRITICAL
```

**Tasks:**
- [ ] Build procedure assignment workflow
  - Assign based on risk assessment results
  - Track budgeted vs actual hours per procedure
  - Support bulk assignment
- [ ] Implement procedure status machine
  - Not Started → In Progress → Pending Review → Reviewed → Signed Off
  - Enforce status transitions (can't skip review)
- [ ] Create procedure documentation requirements
  - Minimum documentation standards
  - Required fields before completion
  - Exception documentation workflow
- [ ] Build procedure linking system
  - Link to relevant workpapers
  - Link to evidence collected
  - Link to findings identified

**Backend Logic:**
```typescript
// Procedure state machine
const PROCEDURE_TRANSITIONS = {
  'not_started': ['in_progress'],
  'in_progress': ['pending_review', 'not_started'],
  'pending_review': ['reviewed', 'in_progress'],
  'reviewed': ['signed_off', 'in_progress'],
  'signed_off': [] // Terminal state
};

// Validation before transition
async function canTransitionProcedure(
  procedureId: string,
  targetStatus: string
): Promise<{valid: boolean; errors: string[]}> {
  const procedure = await getProcedure(procedureId);
  const errors = [];

  if (targetStatus === 'pending_review') {
    if (!procedure.work_performed) errors.push('Work performed is required');
    if (!procedure.conclusion) errors.push('Conclusion is required');
    if (procedure.exceptions && !procedure.exception_resolution) {
      errors.push('Exceptions must be resolved before review');
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### 1.3 Review & Sign-off Workflow (Week 3-4)
```
Priority: CRITICAL
```

**Tasks:**
- [ ] Implement multi-level review
  - Staff → Senior → Manager → Partner
  - Each level must sign before next can review
- [ ] Build review notes system
  - Questions from reviewer to preparer
  - Response tracking
  - Resolution status
- [ ] Create digital signature system
  - Capture signoff timestamp
  - Immutable once signed
  - Support for re-signing after changes
- [ ] Add review dashboard
  - Items pending my review
  - Items I've submitted for review
  - Review aging metrics

**Database Changes:**
```sql
-- Enhanced signoffs with immutability
CREATE TABLE signoff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'workpaper', 'procedure', 'program', 'engagement'
  entity_id UUID NOT NULL,
  signoff_level TEXT NOT NULL,
  signed_by UUID NOT NULL REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT NOT NULL, -- SHA-256 of content at signing
  digital_signature TEXT, -- For future PKI integration
  is_valid BOOLEAN DEFAULT true,
  invalidated_at TIMESTAMPTZ,
  invalidated_reason TEXT,
  CONSTRAINT unique_signoff UNIQUE(entity_type, entity_id, signoff_level)
);

-- Trigger to invalidate signoffs when content changes
CREATE OR REPLACE FUNCTION invalidate_signoffs_on_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    UPDATE signoff_records
    SET is_valid = false,
        invalidated_at = NOW(),
        invalidated_reason = 'Content modified after signoff'
    WHERE entity_id = NEW.id
      AND entity_type = TG_TABLE_NAME
      AND is_valid = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Phase 2: Audit Intelligence (Weeks 5-8)
**Goal**: Add the "smart" features that differentiate from spreadsheets

#### 2.1 Risk-Based Procedure Engine (Week 5-6)
```
Priority: HIGH
```

**Tasks:**
- [ ] Build risk assessment scoring engine
  - Inherent risk × Control risk matrix
  - Fraud risk factors integration
  - Industry-specific risk indicators
- [ ] Create procedure recommendation system
  - Map risks to suggested procedures
  - Calculate required sample sizes based on risk
  - Suggest extent of testing based on risk level
- [ ] Implement procedure library with risk mapping
  - Standard procedures by account area
  - Required assertions coverage
  - Control objective alignment

**Business Logic:**
```typescript
interface RiskBasedProcedureRecommendation {
  accountArea: string;
  combinedRisk: 'low' | 'moderate' | 'high';
  recommendedProcedures: {
    procedure: string;
    type: 'substantive' | 'test_of_controls';
    extent: 'limited' | 'moderate' | 'extensive';
    sampleSize: number;
    rationale: string;
  }[];
  assertionsCovered: string[];
}

function calculateSampleSize(
  populationSize: number,
  materialityAmount: number,
  combinedRisk: 'low' | 'moderate' | 'high',
  method: 'mus' | 'attributes'
): number {
  const riskFactors = { low: 1.0, moderate: 1.5, high: 2.3 };
  const confidenceLevel = { low: 0.90, moderate: 0.95, high: 0.99 };

  // Actual MUS/Attributes sampling formulas
  // ...
}
```

#### 2.2 Materiality Engine (Week 6-7)
```
Priority: HIGH
```

**Tasks:**
- [ ] Build materiality calculation engine
  - Multiple benchmark support
  - Industry-specific guidance
  - Component materiality allocation
- [ ] Create materiality impact analysis
  - Misstatements vs materiality tracking
  - SAM (Summary of Audit Misstatements) automation
  - Impact on opinion assessment
- [ ] Implement revision workflow
  - Materiality revision triggers
  - Re-evaluation of procedures after revision

#### 2.3 Evidence Chain-of-Custody (Week 7-8)
```
Priority: HIGH
```

**Tasks:**
- [ ] Build evidence ingestion system
  - Upload with metadata capture
  - Automatic hash generation for integrity
  - Virus scanning integration
- [ ] Create evidence linking system
  - Link evidence to procedures
  - Link to workpaper cells
  - Cross-reference across engagements
- [ ] Implement evidence integrity verification
  - Hash verification on access
  - Tamper detection alerts
  - Audit trail of all access

**Database Changes:**
```sql
CREATE TABLE evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id),
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_hash_sha256 TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT, -- 'client_upload', 'internal_creation', 'third_party'
  client_contact TEXT,
  received_date DATE,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE evidence_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence_files(id),
  accessed_by UUID REFERENCES auth.users(id),
  access_type TEXT, -- 'view', 'download', 'link'
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence_files(id),
  linked_entity_type TEXT NOT NULL, -- 'procedure', 'workpaper', 'finding'
  linked_entity_id UUID NOT NULL,
  link_description TEXT,
  linked_by UUID REFERENCES auth.users(id),
  linked_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Phase 3: Collaboration & Reporting (Weeks 9-12)
**Goal**: Enable team work and deliverable generation

#### 3.1 Real-Time Collaboration (Week 9-10)
```
Priority: MEDIUM
```

**Tasks:**
- [ ] Implement presence indicators
  - Who's currently viewing what
  - Active users per engagement
- [ ] Build comment/mention system
  - @mention team members
  - Thread-based discussions
  - Resolution tracking
- [ ] Create notification system
  - Assignment notifications
  - Review request notifications
  - Due date reminders

#### 3.2 Report Generation (Week 10-11)
```
Priority: MEDIUM
```

**Tasks:**
- [ ] Build report assembly engine
  - Pull data from procedures, findings, adjustments
  - Standard report templates
  - Customizable sections
- [ ] Create PDF export
  - Professional formatting
  - Watermarks for draft versions
  - Table of contents generation
- [ ] Implement report versioning
  - Track changes between versions
  - Approval workflow for final

#### 3.3 Analytics Dashboard (Week 11-12)
```
Priority: MEDIUM
```

**Tasks:**
- [ ] Build engagement metrics
  - Budget vs actual hours
  - Procedure completion rate
  - Review note aging
- [ ] Create firm-wide analytics
  - Utilization by team member
  - Engagement profitability
  - Risk distribution across clients
- [ ] Implement quality metrics
  - Review note density
  - Signoff cycle time
  - Exception rates

---

### Phase 4: Enterprise Features (Weeks 13-16)
**Goal**: Features required for serious enterprise adoption

#### 4.1 Audit Trail & Compliance (Week 13-14)
```
Priority: CRITICAL for Enterprise
```

**Tasks:**
- [ ] Implement comprehensive audit logging
  - Every data access logged
  - Every change tracked
  - Immutable log storage
- [ ] Build compliance reports
  - SOC 2 evidence collection
  - Data access reports
  - Change history exports
- [ ] Create data retention policies
  - Configurable retention periods
  - Legal hold support
  - Automated archival

#### 4.2 Integration Framework (Week 14-15)
```
Priority: HIGH for Enterprise
```

**Tasks:**
- [ ] Build API layer
  - RESTful API for integrations
  - Webhook support for events
  - Rate limiting and security
- [ ] Create accounting software connectors
  - QuickBooks integration
  - Xero integration
  - Trial balance import
- [ ] Implement SSO
  - SAML 2.0 support
  - SCIM provisioning
  - Directory sync

#### 4.3 Multi-Firm Support (Week 15-16)
```
Priority: MEDIUM for Enterprise
```

**Tasks:**
- [ ] Enhance multi-tenant architecture
  - Data isolation verification
  - Cross-tenant analytics for platform
  - Tenant onboarding automation
- [ ] Build white-labeling
  - Custom branding per firm
  - Custom domains
  - Email templates

---

## Technical Architecture Decisions

### 1. Workpaper Storage
**Decision**: Store workpaper content as JSONB with version history
- Pros: Easy querying, no file system complexity
- Cons: Large documents need chunking

### 2. Real-Time Updates
**Decision**: Supabase Realtime for presence and notifications
- Pros: Already in stack, low latency
- Cons: May need separate WebSocket for collaborative editing

### 3. Evidence Storage
**Decision**: Supabase Storage with hash verification
- Pros: Integrated auth, CDN support
- Cons: May need S3 migration for compliance

### 4. PDF Generation
**Decision**: Server-side rendering with Puppeteer
- Pros: Pixel-perfect output, complex layouts
- Cons: Resource intensive, needs compute

---

## Resource Requirements

### Team Structure
- **1 Senior Full-Stack Developer** - Core engine development
- **1 Backend Developer** - Database, APIs, integrations
- **1 Frontend Developer** - UI/UX polish
- **1 QA Engineer** - Testing, compliance verification
- **1 Audit Domain Expert** (Part-time) - Requirements validation

### Infrastructure
- Supabase Pro ($25/month base, scales with usage)
- Vercel/Netlify for frontend ($20/month)
- Puppeteer/Serverless for PDF generation
- Error tracking (Sentry) and analytics

---

## Success Metrics

### Phase 1 Completion Criteria
- [ ] Can create, edit, and version a workpaper
- [ ] Can execute a procedure through full lifecycle
- [ ] Can sign off and the signoff is enforced
- [ ] Basic audit trail captured

### Phase 2 Completion Criteria
- [ ] Risk assessment drives procedure recommendations
- [ ] Materiality calculator produces correct results
- [ ] Evidence has chain-of-custody tracking

### Phase 3 Completion Criteria
- [ ] Can generate a professional PDF report
- [ ] Team can collaborate with presence awareness
- [ ] Dashboards show real data

### Phase 4 Completion Criteria
- [ ] Passes internal SOC 2 type controls review
- [ ] Can integrate with at least one accounting system
- [ ] Can onboard a new firm without manual intervention

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Audit methodology incorrect | Hire/consult with former Big 4 auditor |
| Performance at scale | Load testing early, optimize queries |
| Data loss | Backup strategy, version control |
| Security breach | Security audit before launch |
| Compliance issues | Legal review of audit trail |

---

## Next Steps

1. **Week 1**: Set up development environment, create database migrations for Phase 1
2. **Week 1**: Begin workpaper versioning implementation
3. **Week 2**: Build procedure state machine
4. **Week 3**: Implement review workflow
5. **Week 4**: Integration testing, bug fixes
6. **Week 5**: Begin Phase 2 with risk engine

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Author: Obsidian Engineering*
