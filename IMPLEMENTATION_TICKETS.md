# Obsidian Audit Platform - Implementation Tickets

**Generated From:** DESIGN_DOC.md
**Date:** December 27, 2024
**Target Deadline:** 14 days

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tickets** | 42 |
| **Estimated Total Effort** | 84 hours (~12 days at 7 hours/day) |
| **Buffer** | 2 days for integration testing and fixes |
| **Critical Path Length** | 28 tickets (DB → Context → Features → Demo) |

---

## Critical Path

The following tickets form the critical path and must be completed in order:

```
DB-001 → DB-002 → DB-003 → DB-004 → DB-005 → DB-006 → DB-007 → DB-008
    ↓
NAV-001 → NAV-002 → NAV-003
    ↓
CTX-001 → CTX-002
    ↓
UI-001 → UI-002 → UI-003
    ↓
FEAT-001 → FEAT-002 → FEAT-003 → FEAT-004 → FEAT-005 → FEAT-006
    ↓
DEMO-001 → DEMO-002 → DEMO-003
```

---

## Daily Execution Plan

| Day | Tickets | Focus Area | Hours |
|-----|---------|------------|-------|
| **Day 1** | DB-001, DB-002, DB-003, DB-004 | Database migrations (new tables) | 6h |
| **Day 2** | DB-005, DB-006, DB-007, DB-008, DB-009 | Database modifications & triggers | 7h |
| **Day 3** | NAV-001, NAV-002, NAV-003, NAV-004 | Navigation & routing | 7h |
| **Day 4** | CTX-001, CTX-002, CTX-003 | Context providers & state | 7h |
| **Day 5** | UI-001, UI-002, UI-003 | Layout components | 6h |
| **Day 6** | UI-004, UI-005, UI-006 | Engagement components | 6h |
| **Day 7** | FEAT-001, FEAT-002 | Sign-off workflow | 7h |
| **Day 8** | FEAT-003, FEAT-004 | Review notes | 7h |
| **Day 9** | FEAT-005, FEAT-006 | Procedure execution | 7h |
| **Day 10** | FEAT-007, FEAT-008 | Finding creation & linking | 6h |
| **Day 11** | UI-007, UI-008, FEAT-009 | Dashboard & Inbox | 7h |
| **Day 12** | DEMO-001, DEMO-002 | Demo data seeding | 6h |
| **Day 13** | DEMO-003, DEMO-004, DEMO-005 | Demo validation & polish | 7h |
| **Day 14** | DEMO-006, Buffer | Final testing & fixes | 6h |

---

## Category 1: Database & Schema (DB-XXX)

### DB-001: Create workpaper_signoffs table

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** FEAT-001, FEAT-002

**Description:**
Create the `workpaper_signoffs` table to track electronic sign-offs on workpapers with preparer, reviewer, manager, and partner levels.

**Acceptance Criteria:**
- [ ] Table created with all columns per design doc
- [ ] Indexes created for workpaper_id, user_id, signoff_type
- [ ] UNIQUE constraint on (workpaper_id, signoff_type)
- [ ] RLS policies created for firm isolation
- [ ] Table visible in Supabase dashboard

**Technical Details:**
```sql
-- File: supabase/migrations/20251228000001_create_workpaper_signoffs.sql
CREATE TABLE workpaper_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES audit_workpapers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  signoff_type VARCHAR(50) NOT NULL CHECK (signoff_type IN ('preparer', 'reviewer', 'manager', 'partner')),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments TEXT,
  signature_hash VARCHAR(256),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workpaper_id, signoff_type)
);
```

**Files:**
- `supabase/migrations/20251228000001_create_workpaper_signoffs.sql`

**Testing:**
- Run migration locally
- Verify table in database
- Test insert/select operations
- Verify RLS policies work

---

### DB-002: Create review_notes table

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** FEAT-003, FEAT-004

**Description:**
Create the `review_notes` table to store review comments with threading, resolution workflow, and priority levels.

**Acceptance Criteria:**
- [ ] Table created with all columns per design doc
- [ ] Self-referencing FK for parent_id (threading)
- [ ] Self-referencing FK for thread_root_id
- [ ] Indexes for workpaper_id, status, thread_root_id
- [ ] RLS policies for firm isolation
- [ ] Trigger to auto-set thread_root_id on insert

**Technical Details:**
```sql
-- File: supabase/migrations/20251228000002_create_review_notes.sql
CREATE TABLE review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES audit_workpapers(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES engagement_procedures(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('comment', 'question', 'issue', 'suggestion')),
  content TEXT NOT NULL,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
  location_anchor TEXT,
  selection_text TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'resolved', 'wont_fix')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  parent_id UUID REFERENCES review_notes(id) ON DELETE CASCADE,
  thread_root_id UUID REFERENCES review_notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `supabase/migrations/20251228000002_create_review_notes.sql`

**Testing:**
- Run migration
- Test threading by creating parent and child notes
- Verify thread_root_id trigger works
- Test resolution workflow

---

### DB-003: Create notifications table

**Priority:** P0 - Critical Path
**Effort:** 1 hour
**Phase:** A - Foundation
**Blocks:** FEAT-009, UI-008

**Description:**
Create the `notifications` table for the user notification system.

**Acceptance Criteria:**
- [ ] Table created with all columns per design doc
- [ ] Composite index on (user_id, is_read, is_archived)
- [ ] Index on created_at DESC for efficient pagination
- [ ] RLS policy: users can only see their own notifications
- [ ] Helper function create_notification() created

**Technical Details:**
```sql
-- File: supabase/migrations/20251228000003_create_notifications.sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  action_url TEXT,
  sender_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `supabase/migrations/20251228000003_create_notifications.sql`

**Testing:**
- Create notification for user
- Verify only that user can see it
- Test mark as read functionality

---

### DB-004: Create workpaper_references table

**Priority:** P1 - High
**Effort:** 1 hour
**Phase:** A - Foundation
**Blocks:** None (optional feature)

**Description:**
Create the `workpaper_references` table to track cross-references between workpapers and other entities.

**Acceptance Criteria:**
- [ ] Table created with all columns per design doc
- [ ] Indexes for source_workpaper_id and (target_type, target_id)
- [ ] RLS policies for firm isolation
- [ ] Support for workpaper, evidence, finding, procedure, external types

**Files:**
- `supabase/migrations/20251228000004_create_workpaper_references.sql`

**Testing:**
- Create reference from workpaper to another workpaper
- Create reference from workpaper to evidence
- Verify indexes are used

---

### DB-005: Modify audit_workpapers table

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** FEAT-001, FEAT-002, UI-004
**Depends On:** DB-001

**Description:**
Add review workflow columns to the existing audit_workpapers table for sign-off tracking.

**Acceptance Criteria:**
- [ ] review_status column added with CHECK constraint
- [ ] prepared_by, prepared_at columns added
- [ ] current_reviewer_id column added
- [ ] locked_at, locked_by columns added
- [ ] workpaper_reference column added
- [ ] Indexes created for new columns
- [ ] Existing data migrated (status → review_status)
- [ ] Trigger to prevent edits on locked workpapers

**Technical Details:**
```sql
-- File: supabase/migrations/20251228000005_modify_audit_workpapers.sql
ALTER TABLE audit_workpapers
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'pending_review', 'in_review', 'changes_requested', 'approved', 'locked')),
  ADD COLUMN IF NOT EXISTS prepared_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS workpaper_reference VARCHAR(50);

-- Data migration
UPDATE audit_workpapers
SET review_status = CASE
  WHEN status = 'draft' THEN 'draft'
  WHEN status = 'in_review' THEN 'pending_review'
  WHEN status = 'approved' THEN 'approved'
  WHEN status = 'rejected' THEN 'changes_requested'
  ELSE 'draft'
END
WHERE review_status IS NULL;
```

**Files:**
- `supabase/migrations/20251228000005_modify_audit_workpapers.sql`

**Testing:**
- Verify existing workpapers have review_status populated
- Test locked workpaper trigger prevents edits
- Verify prepared_by backfill from created_by

---

### DB-006: Modify audit_findings table

**Priority:** P0 - Critical Path
**Effort:** 1 hour
**Phase:** A - Foundation
**Blocks:** FEAT-007, FEAT-008

**Description:**
Add source linking columns to audit_findings table for tracing findings back to procedures and workpapers.

**Acceptance Criteria:**
- [ ] source_procedure_id column added with FK
- [ ] source_workpaper_id column added with FK
- [ ] finding_reference column added
- [ ] is_repeat_finding, prior_year_finding_id columns added
- [ ] Auto-generate finding_reference trigger created
- [ ] Indexes created

**Technical Details:**
```sql
-- File: supabase/migrations/20251228000006_modify_audit_findings.sql
ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS source_procedure_id UUID REFERENCES engagement_procedures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_workpaper_id UUID REFERENCES audit_workpapers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS finding_reference VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_repeat_finding BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prior_year_finding_id UUID REFERENCES audit_findings(id);

-- Trigger to auto-generate finding_reference
CREATE OR REPLACE FUNCTION generate_finding_reference()
RETURNS TRIGGER AS $$
DECLARE
  engagement_year INTEGER;
  finding_count INTEGER;
BEGIN
  SELECT EXTRACT(YEAR FROM year_end)::INTEGER INTO engagement_year
  FROM audits WHERE id = NEW.engagement_id;

  SELECT COUNT(*) + 1 INTO finding_count
  FROM audit_findings WHERE engagement_id = NEW.engagement_id;

  NEW.finding_reference := engagement_year || '-' || LPAD(finding_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Files:**
- `supabase/migrations/20251228000006_modify_audit_findings.sql`

**Testing:**
- Create finding and verify reference auto-generated
- Verify source_procedure_id link works
- Test repeat finding linking

---

### DB-007: Modify engagement_procedures table

**Priority:** P1 - High
**Effort:** 0.5 hours
**Phase:** A - Foundation
**Blocks:** FEAT-005, FEAT-006

**Description:**
Add workpaper linking and time tracking columns to engagement_procedures table.

**Acceptance Criteria:**
- [ ] workpaper_id column added with FK
- [ ] hours_budgeted, hours_actual columns added
- [ ] start_date, completion_date, review_date columns added
- [ ] Index on workpaper_id

**Files:**
- `supabase/migrations/20251228000007_modify_engagement_procedures.sql`

**Testing:**
- Link procedure to workpaper
- Update hours and dates
- Verify FK constraint works

---

### DB-008: Create workflow triggers

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** A - Foundation
**Blocks:** FEAT-001, FEAT-002, FEAT-003
**Depends On:** DB-001, DB-002, DB-005

**Description:**
Create database triggers for workflow automation (sign-off status updates, thread roots, notifications).

**Acceptance Criteria:**
- [ ] Trigger: update workpaper review_status on signoff insert
- [ ] Trigger: set thread_root_id on review_note insert
- [ ] Trigger: check all notes resolved before allowing approval
- [ ] Trigger: prevent locked workpaper edits
- [ ] Trigger: create notification on review request

**Technical Details:**
```sql
-- File: supabase/migrations/20251228000008_create_triggers.sql

-- Update workpaper status on signoff
CREATE OR REPLACE FUNCTION update_workpaper_status_on_signoff()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE audit_workpapers
  SET
    review_status = CASE
      WHEN NEW.signoff_type = 'partner' THEN 'locked'
      WHEN NEW.signoff_type = 'manager' THEN 'approved'
      WHEN NEW.signoff_type = 'reviewer' THEN 'approved'
      WHEN NEW.signoff_type = 'preparer' THEN 'pending_review'
      ELSE review_status
    END,
    prepared_by = CASE WHEN NEW.signoff_type = 'preparer' THEN NEW.user_id ELSE prepared_by END,
    prepared_at = CASE WHEN NEW.signoff_type = 'preparer' THEN NEW.signed_at ELSE prepared_at END,
    locked_at = CASE WHEN NEW.signoff_type = 'partner' THEN NEW.signed_at ELSE locked_at END,
    locked_by = CASE WHEN NEW.signoff_type = 'partner' THEN NEW.user_id ELSE locked_by END,
    updated_at = NOW()
  WHERE id = NEW.workpaper_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workpaper_on_signoff
  AFTER INSERT ON workpaper_signoffs
  FOR EACH ROW
  EXECUTE FUNCTION update_workpaper_status_on_signoff();
```

**Files:**
- `supabase/migrations/20251228000008_create_triggers.sql`

**Testing:**
- Insert preparer signoff → workpaper status = pending_review
- Insert reviewer signoff → workpaper status = approved
- Insert partner signoff → workpaper locked
- Try to edit locked workpaper → should fail

---

### DB-009: Create RLS policies for new tables

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** All feature tickets
**Depends On:** DB-001, DB-002, DB-003, DB-004

**Description:**
Create Row Level Security policies for all new tables to ensure proper multi-tenant data isolation.

**Acceptance Criteria:**
- [ ] workpaper_signoffs: View/insert for firm members
- [ ] review_notes: View/insert/update for firm members
- [ ] notifications: View/update only own notifications
- [ ] workpaper_references: View/manage for firm members
- [ ] All policies tested with different user roles

**Files:**
- `supabase/migrations/20251228000009_create_rls_policies.sql`

**Testing:**
- Create user in Firm A
- Try to access data from Firm B → should fail
- Verify user can only see own notifications

---

### DB-010: Regenerate Supabase types

**Priority:** P1 - High
**Effort:** 0.5 hours
**Phase:** A - Foundation
**Blocks:** All TypeScript code using new tables
**Depends On:** All DB-XXX tickets

**Description:**
Regenerate TypeScript types from Supabase schema after all migrations are applied.

**Acceptance Criteria:**
- [ ] Run `supabase gen types typescript`
- [ ] types.ts updated with new tables
- [ ] No TypeScript errors in existing code
- [ ] New table types available for use

**Commands:**
```bash
npx supabase gen types typescript --project-id $PROJECT_ID > src/integrations/supabase/types.ts
```

**Files:**
- `src/integrations/supabase/types.ts`

**Testing:**
- Import types in a test file
- Verify IntelliSense works for new tables

---

## Category 2: Navigation & Routing (NAV-XXX)

### NAV-001: Create navigation configuration

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** NAV-002, UI-002

**Description:**
Create centralized navigation configuration for both global and engagement-scoped navigation.

**Acceptance Criteria:**
- [ ] NavigationItem interface defined
- [ ] GLOBAL_NAVIGATION constant with all top-level routes
- [ ] ENGAGEMENT_NAVIGATION constant with engagement-scoped routes
- [ ] Role-based filtering support
- [ ] Badge support for counts

**Technical Details:**
```typescript
// src/config/navigation.ts
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  requiredRoles?: AppRole[];
  badge?: 'count' | 'status';
  children?: NavigationItem[];
}

export const ENGAGEMENT_NAVIGATION: NavigationItem[] = [
  { id: 'overview', label: 'Overview', path: '', icon: LayoutDashboard },
  {
    id: 'planning',
    label: 'Planning',
    path: '',
    icon: ClipboardList,
    children: [
      { id: 'team', label: 'Team', path: 'team', icon: Users },
      { id: 'risk', label: 'Risk', path: 'risk', icon: AlertTriangle },
      { id: 'materiality', label: 'Materiality', path: 'materiality', icon: Calculator },
    ],
  },
  // ... etc
];

export const GLOBAL_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home },
  { id: 'inbox', label: 'Inbox', path: '/inbox', icon: Inbox, badge: 'count' },
  { id: 'engagements', label: 'Engagements', path: '/engagements', icon: Briefcase },
  // ... etc
];
```

**Files:**
- `src/config/navigation.ts` (new)

**Testing:**
- Import config in test file
- Verify all items have required properties
- Verify icons are valid Lucide components

---

### NAV-002: Update App.tsx route structure

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** A - Foundation
**Blocks:** All feature pages
**Depends On:** NAV-001

**Description:**
Update the main App.tsx to support the new engagement-scoped route structure with nested routes.

**Acceptance Criteria:**
- [ ] EngagementLayout wraps all /engagements/:id/* routes
- [ ] Child routes render in <Outlet />
- [ ] Legacy routes redirect to new structure
- [ ] Protected routes maintain auth guards
- [ ] 404 handling for invalid routes

**Technical Details:**
```tsx
// src/App.tsx (partial)
<Route path="/engagements/:id" element={<EngagementLayout />}>
  <Route index element={<EngagementOverview />} />
  <Route path="team" element={<EngagementTeam />} />
  <Route path="risk" element={<EngagementRisk />} />
  <Route path="materiality" element={<EngagementMateriality />} />
  <Route path="procedures" element={<EngagementProcedures />} />
  <Route path="procedures/:procId" element={<ProcedureExecution />} />
  <Route path="workpapers" element={<EngagementWorkpapers />} />
  <Route path="workpapers/:wpId" element={<WorkpaperEditor />} />
  <Route path="findings" element={<EngagementFindings />} />
  <Route path="findings/new" element={<CreateFinding />} />
  <Route path="findings/:findId" element={<FindingDetail />} />
  <Route path="review" element={<EngagementReview />} />
</Route>

{/* Legacy redirects */}
<Route path="/audits/:id" element={<Navigate to="/engagements/:id" replace />} />
<Route path="/audits/:id/workpapers" element={<Navigate to="/engagements/:id/workpapers" replace />} />
```

**Files:**
- `src/App.tsx`

**Testing:**
- Navigate to /engagements/[id] → shows EngagementLayout
- Navigate to /engagements/[id]/procedures → shows procedures in layout
- Navigate to /audits/[id] → redirects to /engagements/[id]

---

### NAV-003: Update AppSidebar for global navigation

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** User navigation
**Depends On:** NAV-001

**Description:**
Update AppSidebar to use the new GLOBAL_NAVIGATION configuration and support engagement detection.

**Acceptance Criteria:**
- [ ] Use GLOBAL_NAVIGATION for menu items
- [ ] Detect when inside engagement (useMatch)
- [ ] Hide engagement-specific items from global nav
- [ ] Active state highlighting works
- [ ] Collapse/expand state persists

**Files:**
- `src/components/AppSidebar.tsx`

**Testing:**
- Navigate to /dashboard → Global sidebar shown
- Navigate to /engagements/[id] → Different sidebar (EngagementSidebar)
- Click items → Navigates correctly
- Active item highlighted

---

### NAV-004: Create redirect middleware

**Priority:** P2 - Medium
**Effort:** 1 hour
**Phase:** A - Foundation
**Blocks:** None (nice to have)

**Description:**
Create redirect handling for legacy URLs to maintain backward compatibility.

**Acceptance Criteria:**
- [ ] LEGACY_REDIRECTS map defined
- [ ] Redirects work with URL parameters
- [ ] Console warning for deprecated URLs
- [ ] Analytics event for redirect usage (optional)

**Files:**
- `src/utils/redirects.ts` (new)
- `src/App.tsx` (integration)

**Testing:**
- Navigate to /audits/123 → Redirects to /engagements/123
- URL parameters preserved in redirect

---

## Category 3: Context & State (CTX-XXX)

### CTX-001: Create EngagementContext provider

**Priority:** P0 - Critical Path
**Effort:** 3 hours
**Phase:** A - Foundation
**Blocks:** All engagement-scoped features
**Depends On:** DB-005, DB-010, NAV-002

**Description:**
Create the EngagementContext provider that fetches and provides engagement data to all child components.

**Acceptance Criteria:**
- [ ] EngagementContextType interface implemented
- [ ] useParams to get engagement ID from URL
- [ ] Fetch engagement with client, team, materiality
- [ ] Compute procedureStats, findingStats, workpaperStats
- [ ] Compute completionPercentage, hoursRemaining
- [ ] Actions: refreshEngagement, updateStatus, updatePhase, navigateToSection
- [ ] Loading and error states handled
- [ ] useEngagementContext hook exported

**Technical Details:**
```typescript
// src/contexts/EngagementContext.tsx

interface EngagementContextType {
  engagement: Engagement | null;
  engagementId: string | null;
  client: Client | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  team: TeamMember[];
  materiality: MaterialityCalculation | null;
  procedureStats: ProcedureStats;
  findingStats: FindingStats;
  workpaperStats: WorkpaperStats;
  completionPercentage: number;
  hoursRemaining: number;
  budgetVariance: number;
  refreshEngagement: () => Promise<void>;
  updateStatus: (status: EngagementStatus) => Promise<void>;
  updatePhase: (phase: EngagementPhase) => Promise<void>;
  navigateToSection: (section: string) => void;
}

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['engagement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          clients (id, client_name, industry),
          audit_team_members (*, profiles (*)),
          materiality_calculations (*)
        `)
        .eq('id', id)
        .eq('materiality_calculations.is_active', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // ... stats queries, computed values, actions

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
}

export function useEngagementContext() {
  const context = useContext(EngagementContext);
  if (!context) {
    throw new Error('useEngagementContext must be used within EngagementProvider');
  }
  return context;
}
```

**Files:**
- `src/contexts/EngagementContext.tsx` (new)

**Testing:**
- Wrap test component in provider
- Access context values
- Verify data fetched correctly
- Test updateStatus mutation
- Test navigateToSection

---

### CTX-002: Create useOptionalEngagementContext hook

**Priority:** P1 - High
**Effort:** 0.5 hours
**Phase:** A - Foundation
**Blocks:** Components that may or may not be in engagement
**Depends On:** CTX-001

**Description:**
Create a hook variant that returns null if not within EngagementProvider (for shared components).

**Acceptance Criteria:**
- [ ] Returns context if available
- [ ] Returns null if not in provider (no error)
- [ ] TypeScript types correct (nullable)

**Files:**
- `src/contexts/EngagementContext.tsx` (add export)

**Testing:**
- Use in component outside engagement → null
- Use in component inside engagement → data

---

### CTX-003: Add real-time subscription to EngagementContext

**Priority:** P2 - Medium
**Effort:** 1 hour
**Phase:** A - Foundation
**Blocks:** Real-time updates
**Depends On:** CTX-001

**Description:**
Add Supabase real-time subscriptions to keep engagement data fresh when collaborating.

**Acceptance Criteria:**
- [ ] Subscribe to engagement changes
- [ ] Subscribe to procedure status changes
- [ ] Subscribe to workpaper status changes
- [ ] Cleanup subscriptions on unmount
- [ ] Debounce rapid updates

**Files:**
- `src/contexts/EngagementContext.tsx`

**Testing:**
- Open engagement in two browsers
- Change procedure status in one
- Other browser updates automatically

---

## Category 4: Core Features (FEAT-XXX)

### FEAT-001: Create useWorkpaperSignoffs hook

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** B - Sign-off Workflow
**Blocks:** FEAT-002
**Depends On:** DB-001, DB-005, DB-008, CTX-001

**Description:**
Create the hook that manages the sign-off workflow for workpapers.

**Acceptance Criteria:**
- [ ] Fetch existing signoffs for workpaper
- [ ] Determine canUserSign based on role and current status
- [ ] Determine nextRequiredSignoff
- [ ] Calculate signoffProgress (0-100)
- [ ] recordSignoff mutation
- [ ] undoSignoff mutation (admin only)
- [ ] requestChanges action
- [ ] Real-time updates when others sign

**Technical Details:**
```typescript
// src/hooks/useWorkpaperSignoffs.ts

interface UseWorkpaperSignoffsReturn {
  signoffs: Signoff[];
  isLoading: boolean;
  currentStatus: WorkpaperReviewStatus;
  canUserSign: boolean;
  nextRequiredSignoff: SignoffType | null;
  signoffProgress: number;
  recordSignoff: (type: SignoffType, comments?: string) => Promise<void>;
  undoSignoff: (signoffId: string) => Promise<void>;
  requestChanges: (notes: string) => Promise<void>;
}

export function useWorkpaperSignoffs(workpaperId: string): UseWorkpaperSignoffsReturn {
  const { user, roles } = useAuth();

  const { data: signoffs, isLoading } = useQuery({
    queryKey: ['workpaper-signoffs', workpaperId],
    queryFn: async () => {
      const { data } = await supabase
        .from('workpaper_signoffs')
        .select('*, user:profiles(first_name, last_name)')
        .eq('workpaper_id', workpaperId)
        .order('signed_at');
      return data || [];
    },
    enabled: !!workpaperId,
  });

  const canUserSign = useMemo(() => {
    // Logic: Check user role, check if previous signoffs complete
    const roleOrder = ['preparer', 'reviewer', 'manager', 'partner'];
    // ...
  }, [signoffs, roles]);

  const recordSignoffMutation = useMutation({
    mutationFn: async ({ type, comments }: { type: SignoffType; comments?: string }) => {
      const { error } = await supabase.from('workpaper_signoffs').insert({
        workpaper_id: workpaperId,
        user_id: user.id,
        signoff_type: type,
        comments,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workpaper-signoffs', workpaperId]);
    },
  });

  // ... rest of implementation
}
```

**Files:**
- `src/hooks/useWorkpaperSignoffs.ts` (new)

**Testing:**
- Sign as preparer → signoff recorded
- Try to sign as reviewer before preparer → fails
- Sign all levels → workpaper locked
- Verify progress calculation

---

### FEAT-002: Build WorkpaperSignoff component

**Priority:** P0 - Critical Path
**Effort:** 2.5 hours
**Phase:** B - Sign-off Workflow
**Blocks:** None
**Depends On:** FEAT-001, UI-001

**Description:**
Build the UI component that displays the sign-off trail and allows users to sign at appropriate level.

**Acceptance Criteria:**
- [ ] Display all 4 sign-off levels (preparer, reviewer, manager, partner)
- [ ] Show completed signoffs with name and timestamp
- [ ] Show pending signoffs with "Awaiting" state
- [ ] Comments input for signoff
- [ ] Sign button enabled only when canUserSign
- [ ] Status badge showing current overall status
- [ ] Responsive design for sidebar panel

**Files:**
- `src/components/audit/WorkpaperSignoff.tsx` (new)
- `src/components/audit/SignoffBadge.tsx` (new)

**Testing:**
- Open workpaper with no signoffs → all pending
- Sign as preparer → checkmark appears
- Sign as reviewer → second checkmark
- Partner signoff → "Locked" badge

---

### FEAT-003: Create useReviewNotes hook

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** C - Review Notes
**Blocks:** FEAT-004
**Depends On:** DB-002, DB-008, CTX-001

**Description:**
Create the hook that manages review notes with threading and resolution.

**Acceptance Criteria:**
- [ ] Fetch notes with nested replies
- [ ] Filter by status (all, open, resolved)
- [ ] createNote mutation
- [ ] replyToNote mutation
- [ ] resolveNote mutation
- [ ] reopenNote mutation
- [ ] deleteNote mutation (author only)
- [ ] Real-time updates
- [ ] openCount computed

**Technical Details:**
```typescript
// src/hooks/useReviewNotes.ts

interface UseReviewNotesReturn {
  notes: ReviewNote[];
  openCount: number;
  isLoading: boolean;
  createNote: (note: CreateNoteInput) => Promise<void>;
  replyToNote: (parentId: string, content: string) => Promise<void>;
  resolveNote: (noteId: string, resolutionNotes?: string) => Promise<void>;
  reopenNote: (noteId: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

export function useReviewNotes(
  workpaperId: string,
  filter: 'all' | 'open' | 'resolved' = 'all'
): UseReviewNotesReturn {
  // Fetch notes with thread structure
  const { data, isLoading } = useQuery({
    queryKey: ['review-notes', workpaperId, filter],
    queryFn: async () => {
      let query = supabase
        .from('review_notes')
        .select('*, author:profiles(first_name, last_name)')
        .eq('workpaper_id', workpaperId)
        .is('parent_id', null); // Only root notes

      if (filter === 'open') query = query.eq('status', 'open');
      if (filter === 'resolved') query = query.neq('status', 'open');

      const { data } = await query.order('created_at', { ascending: false });

      // Fetch replies for each note
      // ...

      return data;
    },
  });

  // ... mutations
}
```

**Files:**
- `src/hooks/useReviewNotes.ts` (new)

**Testing:**
- Create note → appears in list
- Reply to note → nested under parent
- Resolve note → status changes
- Filter open → only open shown

---

### FEAT-004: Build ReviewNotesPanel component

**Priority:** P0 - Critical Path
**Effort:** 3 hours
**Phase:** C - Review Notes
**Blocks:** None
**Depends On:** FEAT-003

**Description:**
Build the UI panel for viewing and managing review notes on workpapers.

**Acceptance Criteria:**
- [ ] List all notes with type icons (?, !, comment, lightbulb)
- [ ] Priority badges (low, medium, high)
- [ ] Status badges (open, resolved)
- [ ] Thread replies nested under parent
- [ ] Reply button expands inline form
- [ ] Resolve dialog with resolution notes
- [ ] Add note form with type and priority selectors
- [ ] Filter tabs (All, Open, Resolved)
- [ ] Open count badge in header

**Files:**
- `src/components/audit/ReviewNotesPanel.tsx` (new)
- `src/components/audit/ReviewNoteCard.tsx` (new)
- `src/components/audit/AddNoteForm.tsx` (new)
- `src/components/audit/ResolveNoteDialog.tsx` (new)

**Testing:**
- Add note with type=question → ? icon shown
- Set priority=high → red badge
- Reply to note → reply appears nested
- Resolve with notes → status changes, resolution shown

---

### FEAT-005: Create useProcedureExecution hook

**Priority:** P0 - Critical Path
**Effort:** 2.5 hours
**Phase:** D - Procedure Execution
**Blocks:** FEAT-006
**Depends On:** DB-007, CTX-001

**Description:**
Create the hook that manages procedure execution within an engagement context.

**Acceptance Criteria:**
- [ ] Fetch procedure with linked workpaper
- [ ] Get available actions based on status
- [ ] startProcedure mutation
- [ ] updateWorkPerformed mutation
- [ ] recordConclusion mutation
- [ ] submitForReview mutation
- [ ] createFinding mutation (returns finding ID)
- [ ] linkEvidence mutation
- [ ] canTransition check with reason

**Files:**
- `src/hooks/useProcedureExecution.ts` (new)

**Testing:**
- Start procedure → status changes
- Complete work → workpaper updated
- Submit for review → status = in_review
- Create finding → linked to procedure

---

### FEAT-006: Build ProcedureExecution page

**Priority:** P0 - Critical Path
**Effort:** 3 hours
**Phase:** D - Procedure Execution
**Blocks:** None
**Depends On:** FEAT-005, CTX-001

**Description:**
Build the page for executing a single procedure within an engagement.

**Acceptance Criteria:**
- [ ] Display procedure details (name, objective, risk level)
- [ ] Work performed section (rich text or form)
- [ ] Conclusion section
- [ ] Link to workpaper (create or open)
- [ ] Evidence attachments section
- [ ] Create Finding button
- [ ] Status workflow actions
- [ ] Progress indicator
- [ ] Back to procedures list

**Files:**
- `src/pages/engagement/ProcedureExecution.tsx` (new)

**Testing:**
- Navigate to procedure → details shown
- Start procedure → status updates
- Complete and submit → moves to review
- Create finding → navigates to finding form

---

### FEAT-007: Build CreateFinding page

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** D - Procedure Execution
**Blocks:** None
**Depends On:** DB-006, CTX-001

**Description:**
Build the page for creating a new finding, with optional pre-linking to source procedure/workpaper.

**Acceptance Criteria:**
- [ ] Form with all finding fields
- [ ] Pre-fill source_procedure_id if navigated from procedure
- [ ] Pre-fill source_workpaper_id if navigated from workpaper
- [ ] Severity dropdown with color indicators
- [ ] Repeat finding checkbox and prior year selector
- [ ] Condition, Criteria, Cause, Effect, Recommendation fields
- [ ] Quantified amount field
- [ ] Auto-generate finding_reference on save
- [ ] Redirect to finding detail or list after save

**Files:**
- `src/pages/engagement/CreateFinding.tsx` (new)

**Testing:**
- Create finding from scratch → saves correctly
- Create from procedure → source linked
- Mark as repeat → shows prior year selector

---

### FEAT-008: Build FindingDetail page

**Priority:** P1 - High
**Effort:** 1.5 hours
**Phase:** D - Procedure Execution
**Blocks:** None
**Depends On:** FEAT-007

**Description:**
Build the page for viewing and editing a finding's details.

**Acceptance Criteria:**
- [ ] Display all finding fields
- [ ] Edit mode toggle
- [ ] Show source procedure and workpaper links
- [ ] Status workflow (open → resolved)
- [ ] Management response section
- [ ] Audit response section
- [ ] Activity history

**Files:**
- `src/pages/engagement/FindingDetail.tsx` (new)

**Testing:**
- View finding → all fields shown
- Edit and save → updates persisted
- Click source link → navigates to procedure

---

### FEAT-009: Build Inbox page

**Priority:** P1 - High
**Effort:** 2 hours
**Phase:** E - Dashboard & Inbox
**Blocks:** None
**Depends On:** DB-003

**Description:**
Build the notification inbox page for viewing and managing notifications.

**Acceptance Criteria:**
- [ ] List all notifications
- [ ] Filter by type, read/unread
- [ ] Mark as read (single and bulk)
- [ ] Archive (single and bulk)
- [ ] Deep link to related item
- [ ] Unread count badge
- [ ] Infinite scroll or pagination
- [ ] Empty state for no notifications

**Files:**
- `src/pages/Inbox.tsx` (new)
- `src/hooks/useNotifications.ts` (new or enhanced)

**Testing:**
- View notifications → list displayed
- Click notification → mark as read, navigate to item
- Mark all read → all cleared
- Archive → removed from list

---

## Category 5: UI Components (UI-XXX)

### UI-001: Build EngagementLayout component

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** A - Foundation
**Blocks:** All engagement pages
**Depends On:** CTX-001, NAV-001

**Description:**
Build the layout wrapper for all engagement-scoped routes with sidebar, header, and outlet.

**Acceptance Criteria:**
- [ ] Wraps children in EngagementProvider
- [ ] Renders EngagementSidebar on left
- [ ] Renders EngagementHeader at top
- [ ] Renders <Outlet /> for child routes
- [ ] Loading skeleton while engagement loads
- [ ] Error state with retry button
- [ ] Responsive design (sidebar collapses on mobile)

**Technical Details:**
```tsx
// src/components/layouts/EngagementLayout.tsx

export function EngagementLayout() {
  return (
    <EngagementProvider>
      <div className="flex h-screen">
        <EngagementSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EngagementHeader />
          <main className="flex-1 overflow-auto p-6">
            <EngagementLoadingGate>
              <Outlet />
            </EngagementLoadingGate>
          </main>
        </div>
      </div>
    </EngagementProvider>
  );
}

function EngagementLoadingGate({ children }: { children: ReactNode }) {
  const { isLoading, error } = useEngagementContext();

  if (isLoading) return <EngagementSkeleton />;
  if (error) return <EngagementError error={error} />;
  return <>{children}</>;
}
```

**Files:**
- `src/components/layouts/EngagementLayout.tsx` (new)

**Testing:**
- Navigate to /engagements/[id] → Layout renders
- Loading state shown while fetching
- Error state on invalid ID
- Child routes render in outlet

---

### UI-002: Build EngagementSidebar component

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** A - Foundation
**Blocks:** Navigation within engagement
**Depends On:** CTX-001, NAV-001

**Description:**
Build the sidebar navigation specific to engagement context.

**Acceptance Criteria:**
- [ ] Client name at top
- [ ] Progress bar with percentage
- [ ] Collapsible sections (Planning, Execution, Results, Admin)
- [ ] Active item highlighting
- [ ] Badge counts for procedures, findings
- [ ] Link to engagement list (back button)
- [ ] Collapse/expand button

**Files:**
- `src/components/engagement/EngagementSidebar.tsx` (new)

**Testing:**
- Sidebar shows client name from context
- Progress bar reflects completion
- Clicking items navigates correctly
- Badges update with real counts

---

### UI-003: Build EngagementHeader component

**Priority:** P0 - Critical Path
**Effort:** 1.5 hours
**Phase:** A - Foundation
**Blocks:** None
**Depends On:** CTX-001

**Description:**
Build the header bar showing engagement name, status, and key actions.

**Acceptance Criteria:**
- [ ] Client name and engagement title
- [ ] Status badge (planning, fieldwork, review, etc.)
- [ ] Due date with countdown
- [ ] Phase indicator pills
- [ ] Quick actions dropdown (change status, add team member)
- [ ] Breadcrumbs for current location

**Files:**
- `src/components/engagement/EngagementHeader.tsx` (new)
- `src/components/engagement/EngagementBreadcrumbs.tsx` (new)

**Testing:**
- Header shows correct client/engagement
- Status badge color matches status
- Due date countdown accurate
- Actions work from dropdown

---

### UI-004: Build EngagementOverview page

**Priority:** P0 - Critical Path
**Effort:** 2.5 hours
**Phase:** A - Foundation
**Blocks:** None
**Depends On:** CTX-001, UI-001

**Description:**
Build the index page for an engagement showing dashboard with stats and quick access.

**Acceptance Criteria:**
- [ ] Overall progress ring/bar
- [ ] Stats cards (procedures, workpapers, findings, hours)
- [ ] Phase timeline visualization
- [ ] Team panel with members and hours
- [ ] Materiality summary (if calculated)
- [ ] Recent activity feed
- [ ] Quick action buttons

**Files:**
- `src/pages/engagement/EngagementOverview.tsx` (new)

**Testing:**
- Stats reflect real data from context
- Progress matches procedure completion
- Team shows all members with hours
- Activity feed shows recent items

---

### UI-005: Build EngagementProcedures page

**Priority:** P1 - High
**Effort:** 2 hours
**Phase:** B - Sign-off Workflow
**Blocks:** None
**Depends On:** CTX-001

**Description:**
Build the procedures list page for an engagement.

**Acceptance Criteria:**
- [ ] List all procedures for engagement
- [ ] Filter by status, assigned to, area
- [ ] Status badges with colors
- [ ] Sign-off progress indicator per procedure
- [ ] Click to navigate to ProcedureExecution
- [ ] Bulk actions (assign, change status)

**Files:**
- `src/pages/engagement/EngagementProcedures.tsx` (new)

**Testing:**
- List shows all engagement procedures
- Filter works correctly
- Click navigates to procedure detail
- Bulk select and action works

---

### UI-006: Build EngagementWorkpapers page

**Priority:** P1 - High
**Effort:** 2 hours
**Phase:** B - Sign-off Workflow
**Blocks:** None
**Depends On:** CTX-001

**Description:**
Build the workpapers list page for an engagement.

**Acceptance Criteria:**
- [ ] List all workpapers for engagement
- [ ] Filter by status, area, reviewer
- [ ] Review status badges
- [ ] Sign-off progress indicator
- [ ] Reference number column
- [ ] Click to open workpaper editor
- [ ] Create new workpaper button

**Files:**
- `src/pages/engagement/EngagementWorkpapers.tsx` (new)

**Testing:**
- List shows all engagement workpapers
- Review status accurate
- Create workpaper works
- Click opens editor

---

### UI-007: Build Dashboard page

**Priority:** P1 - High
**Effort:** 2.5 hours
**Phase:** E - Dashboard & Inbox
**Blocks:** None
**Depends On:** CTX-001 (optional context)

**Description:**
Build the personal dashboard showing user's work across all engagements.

**Acceptance Criteria:**
- [ ] Welcome message with user name
- [ ] Stats cards (assigned procedures, pending reviews, open findings, hours)
- [ ] My active engagements list with progress
- [ ] My procedures list with due dates
- [ ] Recent activity feed
- [ ] Quick action buttons

**Files:**
- `src/pages/Dashboard.tsx` (new or rewrite)
- `src/hooks/useDashboardStats.ts` (new)

**Testing:**
- Stats reflect user's actual data
- Engagements show user's assignments
- Procedures sorted by due date
- Activity shows recent user actions

---

### UI-008: Build notification badge and dropdown

**Priority:** P2 - Medium
**Effort:** 1 hour
**Phase:** E - Dashboard & Inbox
**Blocks:** None
**Depends On:** DB-003

**Description:**
Build the notification bell icon with unread count and quick preview dropdown.

**Acceptance Criteria:**
- [ ] Bell icon in header
- [ ] Unread count badge
- [ ] Dropdown with recent notifications
- [ ] Mark as read inline
- [ ] Link to full Inbox page
- [ ] Real-time update of count

**Files:**
- `src/components/NotificationBell.tsx` (new)

**Testing:**
- Badge shows correct unread count
- Dropdown shows recent items
- Click notification navigates
- Count updates in real-time

---

## Category 6: Demo & Polish (DEMO-XXX)

### DEMO-001: Create demo data seed script

**Priority:** P0 - Critical Path
**Effort:** 3 hours
**Phase:** F - Demo Data
**Blocks:** DEMO-002, DEMO-003
**Depends On:** All DB-XXX, All FEAT-XXX

**Description:**
Create comprehensive seed script for realistic demo data.

**Acceptance Criteria:**
- [ ] 1 firm with complete setup
- [ ] 5 clients with varied industries
- [ ] 5 engagements at different phases (25-100% complete)
- [ ] 7 team members per engagement with role distribution
- [ ] ~50 procedures per engagement with realistic status distribution
- [ ] ~45 workpapers per engagement with sign-off progress
- [ ] 24 findings across severity levels
- [ ] Time entries with realistic distribution
- [ ] Materiality calculations per engagement
- [ ] Review notes on key workpapers
- [ ] Notifications for pending actions

**Files:**
- `supabase/migrations/20251228000010_seed_demo_data.sql`
- `scripts/seed-demo-data.ts` (alternative Node script)

**Testing:**
- Run seed script
- Verify all engagements have data
- Verify no empty states on any page
- Verify data relationships correct

---

### DEMO-002: Create demo user accounts

**Priority:** P0 - Critical Path
**Effort:** 1 hour
**Phase:** F - Demo Data
**Blocks:** Demo walkthrough
**Depends On:** DEMO-001

**Description:**
Create demo user accounts for each role to demonstrate the system.

**Acceptance Criteria:**
- [ ] Partner account (robert.chen@demo.com / demo123)
- [ ] Manager account (jane.williams@demo.com / demo123)
- [ ] Senior account (john.smith@demo.com / demo123)
- [ ] Staff account (sarah.johnson@demo.com / demo123)
- [ ] Each has appropriate role assignments
- [ ] Each has data assigned (procedures, workpapers)

**Files:**
- Part of DEMO-001 seed script

**Testing:**
- Login as each user
- Verify role-appropriate access
- Verify assigned items visible

---

### DEMO-003: Validate full demo workflow

**Priority:** P0 - Critical Path
**Effort:** 2 hours
**Phase:** F - Demo Data
**Blocks:** None
**Depends On:** All previous tickets

**Description:**
Manually execute the complete demo workflow to validate all features work end-to-end.

**Acceptance Criteria:**
- [ ] Login as staff, complete procedure, submit workpaper
- [ ] Login as senior, review and sign
- [ ] Login as manager, add review note, sign
- [ ] Login as partner, final signoff (locks workpaper)
- [ ] Create finding from procedure
- [ ] View dashboard with real stats
- [ ] View inbox with notifications
- [ ] No console errors
- [ ] No broken links

**Files:**
- `docs/DEMO_SCRIPT.md` (document the workflow)

**Testing:**
- Follow demo script step by step
- Record any issues
- Fix blockers immediately

---

### DEMO-004: Add loading states everywhere

**Priority:** P1 - High
**Effort:** 1.5 hours
**Phase:** F - Demo Data
**Blocks:** None
**Depends On:** All UI-XXX

**Description:**
Ensure all pages and components have proper loading states.

**Acceptance Criteria:**
- [ ] Skeleton loaders for lists
- [ ] Spinner for buttons during mutations
- [ ] Disabled state during loading
- [ ] No layout shift on load
- [ ] Loading states match design system

**Files:**
- Various components (audit)

**Testing:**
- Throttle network in DevTools
- Verify loading states appear
- No content jump on load

---

### DEMO-005: Add empty states with context

**Priority:** P1 - High
**Effort:** 1.5 hours
**Phase:** F - Demo Data
**Blocks:** None

**Description:**
Ensure empty states have helpful messages and actions.

**Acceptance Criteria:**
- [ ] Empty procedures: "No procedures assigned yet"
- [ ] Empty workpapers: "Create your first workpaper"
- [ ] Empty findings: "No findings recorded" (good thing!)
- [ ] Empty notifications: "All caught up!"
- [ ] Each has relevant action button

**Files:**
- Various page components

**Testing:**
- Create new engagement with no data
- Verify empty states on each page
- Click action buttons work

---

### DEMO-006: Final polish and bug fixes

**Priority:** P0 - Critical Path
**Effort:** 4 hours (buffer)
**Phase:** F - Demo Data
**Blocks:** None
**Depends On:** All other tickets

**Description:**
Reserved time for fixing issues found during demo validation.

**Acceptance Criteria:**
- [ ] All critical bugs fixed
- [ ] No console errors
- [ ] No broken navigation
- [ ] Performance acceptable (< 3s page load)
- [ ] Mobile responsive (basic)

**Files:**
- Various (as needed)

**Testing:**
- Full regression test
- Multiple browser test
- Mobile quick test

---

## Appendix: Ticket Dependencies Graph

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                    DATABASE LAYER                        │
                        │  DB-001 ─┬─ DB-002 ─┬─ DB-003 ─┬─ DB-004                │
                        │          │          │          │                         │
                        │          ▼          ▼          ▼                         │
                        │       DB-005     DB-006     DB-007                       │
                        │          │          │          │                         │
                        │          └────┬─────┴────┬─────┘                         │
                        │               ▼          ▼                               │
                        │            DB-008     DB-009                             │
                        │               │                                          │
                        │               ▼                                          │
                        │            DB-010                                        │
                        └───────────────┼──────────────────────────────────────────┘
                                        │
                        ┌───────────────▼──────────────────────────────────────────┐
                        │                  NAVIGATION LAYER                        │
                        │            NAV-001                                       │
                        │               │                                          │
                        │      ┌────────┼────────┐                                │
                        │      ▼        ▼        ▼                                │
                        │  NAV-002  NAV-003  NAV-004                              │
                        └──────────────┼───────────────────────────────────────────┘
                                       │
                        ┌──────────────▼───────────────────────────────────────────┐
                        │                  CONTEXT LAYER                           │
                        │            CTX-001                                       │
                        │               │                                          │
                        │      ┌────────┴────────┐                                │
                        │      ▼                 ▼                                │
                        │  CTX-002           CTX-003                              │
                        └──────────────┼───────────────────────────────────────────┘
                                       │
                        ┌──────────────▼───────────────────────────────────────────┐
                        │                    UI LAYER                              │
                        │            UI-001                                        │
                        │               │                                          │
                        │      ┌────────┼────────┐                                │
                        │      ▼        ▼        ▼                                │
                        │  UI-002   UI-003   UI-004                               │
                        │      │                 │                                 │
                        │      ▼                 ▼                                 │
                        │  UI-005            UI-006                               │
                        │                        │                                 │
                        │                        ▼                                 │
                        │                    UI-007                               │
                        └──────────────┼───────────────────────────────────────────┘
                                       │
                        ┌──────────────▼───────────────────────────────────────────┐
                        │                  FEATURE LAYER                           │
                        │                                                          │
                        │  FEAT-001 ──► FEAT-002                                  │
                        │                                                          │
                        │  FEAT-003 ──► FEAT-004                                  │
                        │                                                          │
                        │  FEAT-005 ──► FEAT-006 ──► FEAT-007 ──► FEAT-008       │
                        │                                                          │
                        │  FEAT-009 ◄── UI-008                                    │
                        └──────────────┼───────────────────────────────────────────┘
                                       │
                        ┌──────────────▼───────────────────────────────────────────┐
                        │                   DEMO LAYER                             │
                        │                                                          │
                        │  DEMO-001 ──► DEMO-002 ──► DEMO-003                     │
                        │                    │                                     │
                        │      ┌─────────────┼─────────────┐                      │
                        │      ▼             ▼             ▼                      │
                        │  DEMO-004      DEMO-005      DEMO-006                   │
                        └──────────────────────────────────────────────────────────┘
```

---

## Ticket Status Tracking

| ID | Title | Status | Assigned | Est | Actual |
|----|-------|--------|----------|-----|--------|
| DB-001 | Create workpaper_signoffs table | Not Started | - | 1.5h | - |
| DB-002 | Create review_notes table | Not Started | - | 1.5h | - |
| DB-003 | Create notifications table | Not Started | - | 1h | - |
| DB-004 | Create workpaper_references table | Not Started | - | 1h | - |
| DB-005 | Modify audit_workpapers table | Not Started | - | 1.5h | - |
| DB-006 | Modify audit_findings table | Not Started | - | 1h | - |
| DB-007 | Modify engagement_procedures table | Not Started | - | 0.5h | - |
| DB-008 | Create workflow triggers | Not Started | - | 2h | - |
| DB-009 | Create RLS policies | Not Started | - | 1.5h | - |
| DB-010 | Regenerate Supabase types | Not Started | - | 0.5h | - |
| NAV-001 | Create navigation configuration | Not Started | - | 1.5h | - |
| NAV-002 | Update App.tsx route structure | Not Started | - | 2h | - |
| NAV-003 | Update AppSidebar | Not Started | - | 1.5h | - |
| NAV-004 | Create redirect middleware | Not Started | - | 1h | - |
| CTX-001 | Create EngagementContext | Not Started | - | 3h | - |
| CTX-002 | Create useOptionalEngagementContext | Not Started | - | 0.5h | - |
| CTX-003 | Add real-time subscriptions | Not Started | - | 1h | - |
| UI-001 | Build EngagementLayout | Not Started | - | 2h | - |
| UI-002 | Build EngagementSidebar | Not Started | - | 2h | - |
| UI-003 | Build EngagementHeader | Not Started | - | 1.5h | - |
| UI-004 | Build EngagementOverview | Not Started | - | 2.5h | - |
| UI-005 | Build EngagementProcedures | Not Started | - | 2h | - |
| UI-006 | Build EngagementWorkpapers | Not Started | - | 2h | - |
| UI-007 | Build Dashboard | Not Started | - | 2.5h | - |
| UI-008 | Build notification badge | Not Started | - | 1h | - |
| FEAT-001 | Create useWorkpaperSignoffs | Not Started | - | 2h | - |
| FEAT-002 | Build WorkpaperSignoff | Not Started | - | 2.5h | - |
| FEAT-003 | Create useReviewNotes | Not Started | - | 2h | - |
| FEAT-004 | Build ReviewNotesPanel | Not Started | - | 3h | - |
| FEAT-005 | Create useProcedureExecution | Not Started | - | 2.5h | - |
| FEAT-006 | Build ProcedureExecution | Not Started | - | 3h | - |
| FEAT-007 | Build CreateFinding | Not Started | - | 2h | - |
| FEAT-008 | Build FindingDetail | Not Started | - | 1.5h | - |
| FEAT-009 | Build Inbox page | Not Started | - | 2h | - |
| DEMO-001 | Create demo data seed | Not Started | - | 3h | - |
| DEMO-002 | Create demo user accounts | Not Started | - | 1h | - |
| DEMO-003 | Validate full demo workflow | Not Started | - | 2h | - |
| DEMO-004 | Add loading states | Not Started | - | 1.5h | - |
| DEMO-005 | Add empty states | Not Started | - | 1.5h | - |
| DEMO-006 | Final polish | Not Started | - | 4h | - |

**Total Estimated:** 84 hours

---

*Document generated from DESIGN_DOC.md specifications*
