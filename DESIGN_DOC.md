# Obsidian Audit Platform - Comprehensive Design Document

**Version:** 2.0
**Date:** December 27, 2024
**Status:** Implementation Ready
**Target:** Demo-Ready Platform in 14 Days

---

## Table of Contents

1. [Executive Summary](#section-1-executive-summary)
2. [Technical Architecture](#section-2-technical-architecture)
   - 2.1 Navigation Restructure
   - 2.2 Engagement Context Architecture
   - 2.3 Database Schema Changes
   - 2.4 New Components Specification
   - 2.5 API/Hook Design
3. [Migration Plan](#section-3-migration-plan)
   - 3.1 Database Migrations
   - 3.2 Data Migrations
   - 3.3 Breaking Changes
4. [Implementation Phases](#section-4-implementation-phases)
5. [Demo Data Requirements](#section-5-demo-data-requirements)
6. [Risk Assessment](#section-6-risk-assessment)

---

## Section 1: Executive Summary

### 1.1 Target Market
- **Primary:** Small to mid-sized CPA firms (5-50 employees)
- **Focus:** External financial statement audits
- **Standards:** ISA (International Standards on Auditing) with AU-C compliance

### 1.2 Demo Deadline
- **Timeline:** 14 days from start
- **Deliverable:** Fully functional demo with realistic data on ALL pages

### 1.3 Technical Constraints
- Keep React 18 + TypeScript + Supabase + Tailwind stack
- No framework changes
- Leverage existing 150+ database tables and 98 hooks

### 1.4 Key Objectives
1. Engagement-centric navigation (all work flows through engagements)
2. Working sign-off workflow (preparer → reviewer → manager → partner)
3. Review notes with threading and resolution
4. Real data on every page (no empty states in demo)
5. Professional audit tool integration (materiality, sampling, confirmations)

---

## Section 2: Technical Architecture

### 2.1 Navigation Restructure

#### Current Navigation Issues
- 83% of routes orphaned or inaccessible
- Tools disconnected from engagement context
- Inconsistent URL patterns
- Demo mode showing all items regardless of workflow

#### New Navigation Structure

```
/dashboard                          # Personal dashboard
/inbox                              # Notifications & action items
/engagements                        # Engagement list
/engagements/:id                    # Engagement overview (index)
/engagements/:id/team               # Team management
/engagements/:id/timeline           # Project timeline
/engagements/:id/risk               # Risk assessment
/engagements/:id/materiality        # Materiality calculator (scoped)
/engagements/:id/plan               # Audit plan
/engagements/:id/programs           # Assigned programs
/engagements/:id/procedures         # Procedures list
/engagements/:id/procedures/:procId # Procedure execution
/engagements/:id/workpapers         # Workpapers list
/engagements/:id/workpapers/:wpId   # Workpaper editor
/engagements/:id/evidence           # Evidence library
/engagements/:id/findings           # Findings list
/engagements/:id/findings/new       # Create finding
/engagements/:id/findings/:findId   # Finding detail
/engagements/:id/review             # Review status dashboard
/engagements/:id/budget             # Time & budget tracking
/engagements/:id/requests           # Information requests
/engagements/:id/settings           # Engagement settings

# Global routes (not engagement-scoped)
/programs                           # Program library (templates)
/procedures                         # Procedure library (templates)
/tools/materiality                  # Standalone materiality calculator
/tools/sampling                     # Standalone sampling calculator
/admin                              # Admin dashboard
/admin/users                        # User management
/settings                           # User settings
```

#### Route Configuration

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
  {
    id: 'overview',
    label: 'Overview',
    path: '',
    icon: LayoutDashboard,
  },
  {
    id: 'planning',
    label: 'Planning',
    path: '',
    icon: ClipboardList,
    children: [
      { id: 'team', label: 'Team', path: 'team', icon: Users },
      { id: 'timeline', label: 'Timeline', path: 'timeline', icon: Calendar },
      { id: 'risk', label: 'Risk Assessment', path: 'risk', icon: AlertTriangle },
      { id: 'materiality', label: 'Materiality', path: 'materiality', icon: Calculator },
      { id: 'plan', label: 'Audit Plan', path: 'plan', icon: FileText },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    path: '',
    icon: PlayCircle,
    children: [
      { id: 'programs', label: 'Programs', path: 'programs', icon: Layers },
      { id: 'procedures', label: 'Procedures', path: 'procedures', icon: ListChecks, badge: 'count' },
      { id: 'workpapers', label: 'Workpapers', path: 'workpapers', icon: FileSearch },
      { id: 'evidence', label: 'Evidence', path: 'evidence', icon: Paperclip },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    path: '',
    icon: CheckCircle,
    children: [
      { id: 'findings', label: 'Findings', path: 'findings', icon: AlertCircle, badge: 'count' },
      { id: 'review', label: 'Review Status', path: 'review', icon: Eye },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '',
    icon: Settings,
    children: [
      { id: 'budget', label: 'Time & Budget', path: 'budget', icon: DollarSign },
      { id: 'requests', label: 'Info Requests', path: 'requests', icon: MessageSquare },
      { id: 'settings', label: 'Settings', path: 'settings', icon: Settings },
    ],
  },
];

export const GLOBAL_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home },
  { id: 'inbox', label: 'Inbox', path: '/inbox', icon: Inbox, badge: 'count' },
  { id: 'engagements', label: 'Engagements', path: '/engagements', icon: Briefcase },
  {
    id: 'library',
    label: 'Library',
    path: '',
    icon: Library,
    children: [
      { id: 'programs', label: 'Programs', path: '/programs', icon: Layers },
      { id: 'procedures', label: 'Procedures', path: '/procedures', icon: ListChecks },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    path: '',
    icon: Wrench,
    children: [
      { id: 'materiality', label: 'Materiality', path: '/tools/materiality', icon: Calculator },
      { id: 'sampling', label: 'Sampling', path: '/tools/sampling', icon: BarChart },
    ],
  },
];
```

### 2.2 Engagement Context Architecture

#### Context Flow Diagram

```
URL: /engagements/:id/workpapers/:wpId

     ┌─────────────────────────────────────────────────────────┐
     │                    React Router                         │
     │  useParams() → { id: "eng-123", wpId: "wp-456" }       │
     └─────────────────────────┬───────────────────────────────┘
                               │
                               ▼
     ┌─────────────────────────────────────────────────────────┐
     │                  EngagementLayout                       │
     │  ┌─────────────────────────────────────────────────┐   │
     │  │            EngagementProvider                    │   │
     │  │  • Fetches engagement by id                      │   │
     │  │  • Fetches team, materiality, stats             │   │
     │  │  • Provides context to all children             │   │
     │  └─────────────────────────────────────────────────┘   │
     │                         │                               │
     │     ┌───────────────────┼───────────────────┐          │
     │     ▼                   ▼                   ▼          │
     │ ┌─────────┐      ┌───────────┐      ┌─────────────┐   │
     │ │ Sidebar │      │  Header   │      │  <Outlet /> │   │
     │ │ (ctx)   │      │  (ctx)    │      │ Child pages │   │
     │ └─────────┘      └───────────┘      └─────────────┘   │
     └─────────────────────────────────────────────────────────┘
```

#### EngagementContext Type Definition

```typescript
// src/contexts/EngagementContext.tsx

interface EngagementContextType {
  // Core Data
  engagement: Engagement | null;
  engagementId: string | null;
  client: Client | null;

  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;

  // Team
  team: TeamMember[];
  currentUserRole: EngagementRole | null;

  // Materiality (latest active)
  materiality: MaterialityCalculation | null;

  // Statistics (computed)
  procedureStats: {
    total: number;
    not_started: number;
    in_progress: number;
    in_review: number;
    complete: number;
  };
  findingStats: {
    total: number;
    open: number;
    resolved: number;
    by_severity: Record<string, number>;
  };
  workpaperStats: {
    total: number;
    draft: number;
    pending_review: number;
    approved: number;
    locked: number;
  };

  // Computed Properties
  completionPercentage: number;
  hoursRemaining: number;
  budgetVariance: number;
  daysUntilDue: number;

  // Actions
  refreshEngagement: () => Promise<void>;
  updateStatus: (status: EngagementStatus) => Promise<void>;
  updatePhase: (phase: EngagementPhase) => Promise<void>;
  navigateToSection: (section: string) => void;
}

type EngagementStatus =
  | 'draft'
  | 'accepted'
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'complete'
  | 'on_hold'
  | 'cancelled';

type EngagementPhase =
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'complete';

type EngagementRole =
  | 'partner'
  | 'manager'
  | 'senior'
  | 'staff'
  | 'observer';
```

#### Context Provider Implementation

```typescript
// src/contexts/EngagementContext.tsx

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Main engagement query with related data
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['engagement', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          clients (id, client_name, industry, entity_type),
          audit_team_members (
            id, user_id, role, hours_allocated, hours_actual,
            profiles (id, full_name, email, avatar_url)
          ),
          materiality_calculations (
            id, benchmark_type, benchmark_amount,
            overall_materiality, performance_materiality,
            clearly_trivial_threshold, is_active
          )
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

  // Procedure stats query
  const { data: procedureStats } = useQuery({
    queryKey: ['engagement-procedure-stats', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_procedures')
        .select('status')
        .eq('engagement_id', id);

      return {
        total: data?.length || 0,
        not_started: data?.filter(p => p.status === 'not_started').length || 0,
        in_progress: data?.filter(p => p.status === 'in_progress').length || 0,
        in_review: data?.filter(p => p.status === 'in_review').length || 0,
        complete: data?.filter(p => p.status === 'complete' || p.status === 'signed_off').length || 0,
      };
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  // Similar queries for findings and workpapers...

  const value = useMemo(() => ({
    engagement: data,
    engagementId: id,
    client: data?.clients,
    isLoading,
    isRefreshing: isRefetching,
    error,
    team: data?.audit_team_members || [],
    materiality: data?.materiality_calculations?.[0] || null,
    procedureStats: procedureStats || { total: 0, not_started: 0, in_progress: 0, in_review: 0, complete: 0 },
    // ... computed values
    refreshEngagement: refetch,
    updateStatus: async (status) => { /* mutation */ },
    updatePhase: async (phase) => { /* mutation */ },
    navigateToSection: (section) => navigate(`/engagements/${id}/${section}`),
  }), [data, id, isLoading, isRefetching, error, procedureStats]);

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

### 2.3 Database Schema Changes

#### New Tables

##### 1. workpaper_signoffs

```sql
CREATE TABLE workpaper_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES audit_workpapers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  signoff_type VARCHAR(50) NOT NULL
    CHECK (signoff_type IN ('preparer', 'reviewer', 'manager', 'partner')),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments TEXT,
  signature_hash VARCHAR(256),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workpaper_id, signoff_type)
);

CREATE INDEX idx_signoffs_workpaper ON workpaper_signoffs(workpaper_id);
CREATE INDEX idx_signoffs_user ON workpaper_signoffs(user_id);
```

##### 2. review_notes

```sql
CREATE TABLE review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES audit_workpapers(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES engagement_procedures(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  note_type VARCHAR(50) NOT NULL
    CHECK (note_type IN ('comment', 'question', 'issue', 'suggestion')),
  content TEXT NOT NULL,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
  location_anchor TEXT,
  selection_text TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'addressed', 'resolved', 'wont_fix')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  parent_id UUID REFERENCES review_notes(id) ON DELETE CASCADE,
  thread_root_id UUID REFERENCES review_notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_workpaper ON review_notes(workpaper_id);
CREATE INDEX idx_notes_status ON review_notes(status);
CREATE INDEX idx_notes_thread ON review_notes(thread_root_id);
```

##### 3. notifications

```sql
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
  priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, is_archived);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

##### 4. workpaper_references

```sql
CREATE TABLE workpaper_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_workpaper_id UUID NOT NULL REFERENCES audit_workpapers(id) ON DELETE CASCADE,
  source_location TEXT,
  target_type VARCHAR(50) NOT NULL
    CHECK (target_type IN ('workpaper', 'evidence', 'finding', 'procedure', 'external')),
  target_id UUID,
  target_reference TEXT NOT NULL,
  reference_text TEXT,
  is_auto_detected BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refs_source ON workpaper_references(source_workpaper_id);
CREATE INDEX idx_refs_target ON workpaper_references(target_type, target_id);
```

#### Modified Tables

##### audit_workpapers (add columns)

```sql
ALTER TABLE audit_workpapers
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'draft'
    CHECK (review_status IN (
      'draft', 'pending_review', 'in_review',
      'changes_requested', 'approved', 'locked'
    )),
  ADD COLUMN IF NOT EXISTS prepared_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS workpaper_reference VARCHAR(50);

CREATE INDEX idx_workpapers_review_status ON audit_workpapers(review_status);
```

##### audit_findings (add columns)

```sql
ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS source_procedure_id UUID REFERENCES engagement_procedures(id),
  ADD COLUMN IF NOT EXISTS source_workpaper_id UUID REFERENCES audit_workpapers(id),
  ADD COLUMN IF NOT EXISTS finding_reference VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_repeat_finding BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prior_year_finding_id UUID REFERENCES audit_findings(id);

CREATE INDEX idx_findings_procedure ON audit_findings(source_procedure_id);
CREATE INDEX idx_findings_workpaper ON audit_findings(source_workpaper_id);
```

##### engagement_procedures (add columns)

```sql
ALTER TABLE engagement_procedures
  ADD COLUMN IF NOT EXISTS workpaper_id UUID REFERENCES audit_workpapers(id),
  ADD COLUMN IF NOT EXISTS hours_budgeted NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hours_actual NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS completion_date DATE,
  ADD COLUMN IF NOT EXISTS review_date DATE;
```

### 2.4 New Components Specification

#### Required Components

| Component | Location | Purpose |
|-----------|----------|---------|
| EngagementLayout | `src/components/layouts/` | Wrapper with sidebar, header, context |
| EngagementSidebar | `src/components/engagement/` | Engagement-scoped navigation |
| EngagementHeader | `src/components/engagement/` | Client name, status, due date |
| EngagementOverview | `src/pages/engagement/` | Dashboard with stats |
| WorkpaperSignoff | `src/components/audit/` | Sign-off trail and actions |
| ReviewNotesPanel | `src/components/audit/` | Review notes management |
| ProcedureExecution | `src/pages/engagement/` | Execute procedure, link workpaper |
| FindingCreator | `src/pages/engagement/` | Create finding from procedure |
| Dashboard | `src/pages/` | Personal workspace |
| Inbox | `src/pages/` | Notification center |

#### Component: WorkpaperSignoff

```typescript
// src/components/audit/WorkpaperSignoff.tsx

interface WorkpaperSignoffProps {
  workpaperId: string;
  currentStatus: WorkpaperReviewStatus;
  onStatusChange?: (newStatus: WorkpaperReviewStatus) => void;
}

interface Signoff {
  id: string;
  signoff_type: 'preparer' | 'reviewer' | 'manager' | 'partner';
  user_id: string;
  signed_at: string;
  comments: string | null;
  user: { first_name: string; last_name: string };
}

// Visual Layout:
// ┌─────────────────────────────────────────────────────┐
// │ Sign-off Trail                            [Approved]│
// ├─────────────────────────────────────────────────────┤
// │  ✓ Prepared by                                      │
// │    John Smith                                       │
// │    Dec 15, 2024 3:42 PM                            │
// │    "Ready for review"                               │
// ├─────────────────────────────────────────────────────┤
// │  ✓ Reviewed by                                      │
// │    Jane Manager                                     │
// │    Dec 18, 2024 11:23 AM                           │
// ├─────────────────────────────────────────────────────┤
// │  ○ Manager Approval                                 │
// │    Awaiting signature                               │
// ├─────────────────────────────────────────────────────┤
// │  ○ Partner Approval                                 │
// │    Not started                                      │
// ├─────────────────────────────────────────────────────┤
// │ Comments (optional):                                │
// │ ┌─────────────────────────────────────────────────┐│
// │ │                                                  ││
// │ └─────────────────────────────────────────────────┘│
// │ [        Sign as Manager        ]                   │
// └─────────────────────────────────────────────────────┘
```

#### Component: ReviewNotesPanel

```typescript
// src/components/audit/ReviewNotesPanel.tsx

interface ReviewNotesPanelProps {
  workpaperId: string;
}

interface ReviewNote {
  id: string;
  author_id: string;
  note_type: 'comment' | 'question' | 'issue' | 'suggestion';
  content: string;
  priority: 'low' | 'medium' | 'high' | null;
  status: 'open' | 'addressed' | 'resolved' | 'wont_fix';
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  parent_id: string | null;
  author: { first_name: string; last_name: string };
  replies?: ReviewNote[];
}

// Visual Layout:
// ┌─────────────────────────────────────────────────────┐
// │ Review Notes                              [3 open]  │
// ├─────────────────────────────────────────────────────┤
// │ [All (5)] [Open (3)] [Resolved (2)]                │
// ├─────────────────────────────────────────────────────┤
// │ ? Jane Manager [question] [open]                    │
// │ Please confirm client response for the $15K item    │
// │ Dec 18, 2024 11:30 AM                              │
// │   ↳ John Smith                                      │
// │     Discussed with CFO on 1/20. Adjustment coming. │
// │     Jan 20, 2024 2:15 PM                           │
// │ [Reply] [Resolve]                                   │
// ├─────────────────────────────────────────────────────┤
// │ ! Sarah Staff [issue] [high] [open]                 │
// │ Missing support for transaction dated 12/15         │
// │ Dec 17, 2024 4:22 PM                               │
// │ [Reply] [Resolve]                                   │
// ├─────────────────────────────────────────────────────┤
// │ Add Note:                                           │
// │  Type: [Question ▼]   Priority: [Med ▼]            │
// │ ┌─────────────────────────────────────────────────┐│
// │ │ Enter your note...                              ││
// │ └─────────────────────────────────────────────────┘│
// │ [       Add Note       ]                            │
// └─────────────────────────────────────────────────────┘
```

### 2.5 API/Hook Design

#### Hook: useEngagementContext

```typescript
// Hook: useEngagementContext
// Purpose: Access engagement data and actions from any component within engagement routes
// File: src/contexts/EngagementContext.tsx (exported hook)

interface InputParams {
  // None - uses route params internally
}

interface ReturnType {
  engagement: Engagement | null;
  engagementId: string | null;
  client: Client | null;
  isLoading: boolean;
  error: Error | null;
  team: TeamMember[];
  materiality: MaterialityCalculation | null;
  procedureStats: ProcedureStats;
  findingStats: FindingStats;
  completionPercentage: number;
  refreshEngagement: () => Promise<void>;
  updateStatus: (status: EngagementStatus) => Promise<void>;
  navigateToSection: (section: string) => void;
}

// Queries: ['engagement', id], ['engagement-procedure-stats', id], ['engagement-finding-stats', id]
// Mutations: updateEngagementStatus, updateEngagementPhase
```

#### Hook: useWorkpaperSignoffs

```typescript
// Hook: useWorkpaperSignoffs
// Purpose: Manage sign-off workflow for workpapers
// File: src/hooks/useWorkpaperSignoffs.ts

interface InputParams {
  workpaperId: string;
}

interface ReturnType {
  signoffs: Signoff[];
  isLoading: boolean;
  currentStatus: WorkpaperReviewStatus;
  canUserSign: boolean;
  nextRequiredSignoff: SignoffType | null;
  signoffProgress: number; // 0-100
  recordSignoff: (type: SignoffType, comments?: string) => Promise<void>;
  undoSignoff: (signoffId: string) => Promise<void>;
  requestChanges: (notes: string) => Promise<void>;
}

// Key queries:
// - ['workpaper-signoffs', workpaperId]: Fetch existing signoffs
// - Depends on user role from useAuth()

// Key mutations:
// - createSignoff: INSERT into workpaper_signoffs
// - deleteSignoff: DELETE from workpaper_signoffs (admin only)
// - updateWorkpaperStatus: UPDATE audit_workpapers.review_status
```

#### Hook: useReviewNotes

```typescript
// Hook: useReviewNotes
// Purpose: Manage review notes with threading for workpapers
// File: src/hooks/useReviewNotes.ts

interface InputParams {
  workpaperId: string;
  filter?: 'all' | 'open' | 'resolved';
}

interface ReturnType {
  notes: ReviewNote[];
  openCount: number;
  isLoading: boolean;
  createNote: (note: CreateNoteInput) => Promise<void>;
  replyToNote: (parentId: string, content: string) => Promise<void>;
  resolveNote: (noteId: string, resolutionNotes?: string) => Promise<void>;
  reopenNote: (noteId: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

interface CreateNoteInput {
  content: string;
  note_type: 'comment' | 'question' | 'issue' | 'suggestion';
  priority?: 'low' | 'medium' | 'high';
  location_anchor?: string;
  selection_text?: string;
}

// Key queries:
// - ['review-notes', workpaperId, filter]: Fetch notes with thread structure
// - Realtime subscription for live updates

// Key mutations:
// - createReviewNote: INSERT into review_notes
// - resolveReviewNote: UPDATE status, resolved_by, resolved_at
```

#### Hook: useProcedureExecution

```typescript
// Hook: useProcedureExecution
// Purpose: Execute procedures within engagement context
// File: src/hooks/useProcedureExecution.ts

interface InputParams {
  procedureId: string;
}

interface ReturnType {
  procedure: EngagementProcedure | null;
  workpaper: Workpaper | null;
  isLoading: boolean;
  status: ProcedureStatus;
  availableActions: ProcedureAction[];

  // Actions
  startProcedure: () => Promise<void>;
  updateWorkPerformed: (content: any) => Promise<void>;
  recordConclusion: (conclusion: string) => Promise<void>;
  submitForReview: () => Promise<void>;
  createFinding: (findingData: CreateFindingInput) => Promise<string>;
  linkEvidence: (evidenceId: string) => Promise<void>;

  // Workflow
  canTransition: (action: ProcedureAction) => { allowed: boolean; reason?: string };
  performAction: (action: ProcedureAction) => Promise<void>;
}

// Key queries:
// - ['procedure-execution', procedureId]: Procedure with related workpaper
// - Realtime subscription for collaborative editing

// Key mutations:
// - updateProcedureStatus
// - createOrUpdateWorkpaper
// - createFinding (with source_procedure_id link)
```

#### Hook: useNotifications

```typescript
// Hook: useNotifications
// Purpose: Manage user notifications and action items
// File: src/hooks/useNotifications.ts

interface InputParams {
  filter?: 'all' | 'unread' | 'review_requests' | 'mentions';
  limit?: number;
}

interface ReturnType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archive: (notificationId: string) => Promise<void>;
  archiveAll: () => Promise<void>;
  loadMore: () => Promise<void>;
}

// Key queries:
// - ['notifications', userId, filter]: Paginated notifications
// - Realtime subscription for instant updates

// Key mutations:
// - updateNotification: Mark as read/archived
// - createNotification: (internal use by triggers)
```

#### Hook: useDashboardStats

```typescript
// Hook: useDashboardStats
// Purpose: Fetch aggregated stats for user dashboard
// File: src/hooks/useDashboardStats.ts

interface InputParams {
  userId: string;
}

interface ReturnType {
  assignedProcedures: number;
  pendingReviews: number;
  openFindings: number;
  hoursThisWeek: number;
  activeEngagements: EngagementSummary[];
  upcomingDueDates: DueDateItem[];
  recentActivity: ActivityItem[];
  isLoading: boolean;
}

// Key queries:
// - ['dashboard-stats', userId]: Aggregated stats
// - ['my-engagements', userId]: User's active engagements
// - ['my-procedures-due', userId]: Procedures due this week
```

---

## Section 3: Migration Plan

### 3.1 Database Migrations

All migrations in order of execution:

| # | Migration Name | Purpose | Dependencies |
|---|----------------|---------|--------------|
| 1 | `20251228000001_create_workpaper_signoffs.sql` | Create sign-off tracking table | audit_workpapers exists |
| 2 | `20251228000002_create_review_notes.sql` | Create review notes with threading | audit_workpapers, engagement_procedures |
| 3 | `20251228000003_create_notifications.sql` | Create notification system | firms, auth.users |
| 4 | `20251228000004_create_workpaper_references.sql` | Create cross-reference tracking | audit_workpapers |
| 5 | `20251228000005_modify_audit_workpapers.sql` | Add review workflow columns | workpaper_signoffs (for triggers) |
| 6 | `20251228000006_modify_audit_findings.sql` | Add source linking columns | engagement_procedures, audit_workpapers |
| 7 | `20251228000007_modify_engagement_procedures.sql` | Add workpaper link and hours | audit_workpapers |
| 8 | `20251228000008_create_triggers.sql` | Create all triggers for workflow automation | All above tables |
| 9 | `20251228000009_create_rls_policies.sql` | Create RLS policies for new tables | All above tables |
| 10 | `20251228000010_seed_demo_data.sql` | Insert demo data | All tables ready |

### 3.2 Data Migrations

#### Existing Data Transformations

1. **audit_workpapers.status → review_status mapping**
   ```sql
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

2. **Backfill prepared_by from created_by**
   ```sql
   UPDATE audit_workpapers
   SET prepared_by = created_by
   WHERE prepared_by IS NULL AND created_by IS NOT NULL;
   ```

3. **Generate finding_reference for existing findings**
   ```sql
   WITH numbered AS (
     SELECT id, engagement_id,
       ROW_NUMBER() OVER (PARTITION BY engagement_id ORDER BY created_at) as num
     FROM audit_findings
     WHERE finding_reference IS NULL
   )
   UPDATE audit_findings f
   SET finding_reference = EXTRACT(YEAR FROM e.year_end)::TEXT || '-' || LPAD(n.num::TEXT, 3, '0')
   FROM numbered n
   JOIN audits e ON e.id = f.engagement_id
   WHERE f.id = n.id;
   ```

### 3.3 Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|------------|
| Route `/audits/:id/workpapers` → `/engagements/:id/workpapers` | Bookmarks and external links break | Redirect middleware for old URLs |
| `useWorkpapers(auditId)` → `useEngagementWorkpapers()` (from context) | Hook signature change | Keep old hook as deprecated wrapper |
| Workpaper status field renamed | Components checking `status` break | Update all references, add migration for data |
| AppSidebar navigation structure | All sidebar navigation changes | Phase in new sidebar component |
| EngagementDetail page restructure | Page splits into EngagementLayout + child routes | Parallel deployment, feature flag |

#### Redirect Strategy

```typescript
// src/utils/redirects.ts

export const LEGACY_REDIRECTS: Record<string, string> = {
  '/audits/:id': '/engagements/:id',
  '/audits/:id/workpapers': '/engagements/:id/workpapers',
  '/audits/:id/workpapers/:wpId': '/engagements/:id/workpapers/:wpId',
  '/tools/materiality': '/tools/materiality', // No change
  '/programs/:id': '/programs/:id', // No change (library)
};

// In App.tsx, add redirect routes
{Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
  <Route
    key={from}
    path={from}
    element={<Navigate to={to.replace(':id', useParams().id || '')} replace />}
  />
))}
```

---

## Section 4: Implementation Phases

### Phase A: Foundation (Days 1-3)

**What's Included:**
- Create navigation configuration (`src/config/navigation.ts`)
- Build EngagementLayout component with sidebar and header
- Implement EngagementContext provider
- Set up new route structure in App.tsx
- Run database migrations 1-4 (new tables)

**Dependencies:**
- None (starting point)

**Testable Outcome:**
- Navigate to `/engagements/:id` and see layout with sidebar
- Context provides engagement data to child components
- New tables exist in database

**Files Created/Modified:**
- `src/config/navigation.ts` (new)
- `src/contexts/EngagementContext.tsx` (new)
- `src/components/layouts/EngagementLayout.tsx` (new)
- `src/components/engagement/EngagementSidebar.tsx` (new)
- `src/components/engagement/EngagementHeader.tsx` (new)
- `src/App.tsx` (modified - routes)

### Phase B: Sign-off Workflow (Days 4-6)

**What's Included:**
- Build WorkpaperSignoff component
- Implement useWorkpaperSignoffs hook
- Create sign-off trigger functions
- Add review_status to workpaper UI
- Run migrations 5-7 (modify existing tables)

**Dependencies:**
- Phase A complete (EngagementContext available)

**Testable Outcome:**
- Open workpaper, see sign-off panel
- Sign as preparer (changes status to pending_review)
- Sign as reviewer (status changes accordingly)
- Partner sign-off locks workpaper

**Files Created/Modified:**
- `src/components/audit/WorkpaperSignoff.tsx` (new)
- `src/hooks/useWorkpaperSignoffs.ts` (new)
- `src/pages/engagement/WorkpaperEditor.tsx` (modified)

### Phase C: Review Notes (Days 7-8)

**What's Included:**
- Build ReviewNotesPanel component
- Implement useReviewNotes hook
- Add reply threading UI
- Add resolution workflow
- Real-time note updates

**Dependencies:**
- Phase A complete
- review_notes table exists

**Testable Outcome:**
- Add review note to workpaper
- Reply to existing note
- Resolve note with resolution text
- See unresolved count in header

**Files Created/Modified:**
- `src/components/audit/ReviewNotesPanel.tsx` (new)
- `src/components/audit/ReviewNoteCard.tsx` (new)
- `src/hooks/useReviewNotes.ts` (new)

### Phase D: Procedure Execution (Days 9-10)

**What's Included:**
- Build ProcedureExecution page
- Link procedure to workpaper
- Enable finding creation from procedure
- Implement useProcedureExecution hook
- Add procedure status workflow

**Dependencies:**
- Phase A, B complete
- engagement_procedures modified

**Testable Outcome:**
- Navigate to procedure within engagement
- Complete work, create workpaper
- Create finding from procedure (auto-linked)
- Submit for review

**Files Created/Modified:**
- `src/pages/engagement/ProcedureExecution.tsx` (new)
- `src/hooks/useProcedureExecution.ts` (new)
- `src/pages/engagement/CreateFinding.tsx` (new)

### Phase E: Dashboard & Inbox (Days 11-12)

**What's Included:**
- Build Dashboard page (personal workspace)
- Build Inbox page (notifications)
- Implement notification triggers
- Add useDashboardStats hook
- Add useNotifications hook

**Dependencies:**
- All previous phases
- notifications table exists

**Testable Outcome:**
- Dashboard shows user's engagements, procedures, stats
- Inbox shows notifications
- Actions trigger notifications (assignment, review request)

**Files Created/Modified:**
- `src/pages/Dashboard.tsx` (new or major rewrite)
- `src/pages/Inbox.tsx` (new)
- `src/hooks/useDashboardStats.ts` (new)
- `src/hooks/useNotifications.ts` (enhanced)

### Phase F: Demo Data & Polish (Days 13-14)

**What's Included:**
- Seed comprehensive demo data
- Fix any remaining UI issues
- Add loading states everywhere
- Polish empty states with meaningful messages
- Test full workflow end-to-end

**Dependencies:**
- All previous phases complete

**Testable Outcome:**
- Every page has realistic data
- Full workflow: Create engagement → Execute procedures → Review workpapers → Sign off → Create findings
- No console errors, no broken links

**Files Created/Modified:**
- `supabase/migrations/20251228000010_seed_demo_data.sql` (new)
- `scripts/seed-demo-data.ts` (new)
- Various components (polish)

---

## Section 5: Demo Data Requirements

### 5.1 Firms

| Firm | Industry Focus | Size |
|------|---------------|------|
| Acme Audit Partners LLP | General | 25 users |

### 5.2 Clients

| Client | Industry | Entity Type | Risk Level |
|--------|----------|-------------|------------|
| ABC Manufacturing Corp | Manufacturing | Corporation | Moderate |
| XYZ Retail Holdings | Retail | Corporation | High |
| Sunshine Healthcare Inc | Healthcare | Non-profit | Low |
| Tech Innovations LLC | Technology | LLC | Moderate |
| First National Bank | Financial Services | Bank | High |

### 5.3 Engagements

| Client | Year End | Phase | Completion | Due Date |
|--------|----------|-------|------------|----------|
| ABC Manufacturing | Dec 31, 2024 | Fieldwork | 68% | Mar 15, 2025 |
| XYZ Retail | Dec 31, 2024 | Planning | 25% | Apr 30, 2025 |
| Sunshine Healthcare | Jun 30, 2024 | Review | 85% | Sep 30, 2024 |
| Tech Innovations | Dec 31, 2024 | Complete | 100% | Feb 28, 2025 |
| First National Bank | Dec 31, 2024 | Fieldwork | 45% | Mar 31, 2025 |

### 5.4 Team Members (per engagement)

| Role | Count | Example Names |
|------|-------|---------------|
| Partner | 1 | Robert Chen |
| Manager | 1 | Jane Williams |
| Senior | 2 | John Smith, Sarah Johnson |
| Staff | 3 | Mike Brown, Lisa Garcia, David Lee |

### 5.5 Procedures (per engagement)

| Area | Procedures | Status Distribution |
|------|------------|---------------------|
| Cash | 8 | 3 complete, 3 in progress, 2 not started |
| Accounts Receivable | 12 | 5 complete, 4 in progress, 3 not started |
| Inventory | 10 | 2 complete, 5 in progress, 3 not started |
| Revenue | 15 | 8 complete, 4 in progress, 3 not started |
| Payroll | 6 | 4 complete, 2 in progress |

**Total per engagement:** ~50 procedures

### 5.6 Workpapers (per engagement)

| Section | Count | Status Distribution |
|---------|-------|---------------------|
| Lead Schedules | 10 | 5 approved, 3 pending, 2 draft |
| Testing Workpapers | 30 | 10 approved, 12 pending, 8 draft |
| Memos | 5 | 3 approved, 2 pending |

**Total per engagement:** ~45 workpapers

### 5.7 Findings (across all engagements)

| Severity | Count | Status |
|----------|-------|--------|
| Material Weakness | 1 | Open |
| Significant Deficiency | 3 | 1 Open, 2 Resolved |
| Control Deficiency | 8 | 4 Open, 4 Resolved |
| Observation | 12 | 3 Open, 9 Resolved |

### 5.8 Time Entries

- **Per user per week:** 35-45 hours
- **Distribution:** 70% to primary engagement, 30% split
- **Categories:** Fieldwork (60%), Review (20%), Planning (10%), Admin (10%)

### 5.9 Materiality Calculations

Each engagement should have one active materiality calculation:

| Engagement | Benchmark | Amount | Overall | Performance | Trivial |
|------------|-----------|--------|---------|-------------|---------|
| ABC Manufacturing | Revenue | $50M | $500K | $375K | $25K |
| XYZ Retail | Assets | $80M | $800K | $600K | $40K |
| Sunshine Healthcare | Revenue | $25M | $250K | $187.5K | $12.5K |

---

## Section 6: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Database migration failures** | Medium | High | Test migrations on copy of production first; have rollback scripts ready |
| **Context performance issues** | Medium | Medium | Use React Query caching; memoize computed values; lazy load stats |
| **Sign-off workflow edge cases** | High | Medium | Comprehensive test cases; allow admin override; audit trail for recovery |
| **Route changes break existing links** | High | Low | Implement redirect middleware; communicate changes; phase rollout |
| **Real-time subscriptions overload** | Low | High | Throttle updates; use presence channels wisely; test with concurrent users |
| **Demo data doesn't look realistic** | Medium | High | Use real-world account names; vary data; include edge cases |
| **Timeline slippage** | Medium | High | Daily standups; cut scope to core workflow if needed; parallel work |
| **Role-based access gaps** | Medium | Medium | Test with each role; default to restrictive; add permissions incrementally |
| **Component reuse conflicts** | Low | Medium | Clear prop interfaces; composition over modification; storybook testing |
| **Supabase RLS policy errors** | Medium | High | Test policies thoroughly; use service role for seeding; log policy failures |

### Critical Path Items

1. **EngagementContext** - Everything depends on this working
2. **Sign-off workflow** - Core differentiator for demo
3. **Demo data seeding** - Must be realistic and complete
4. **Route restructure** - Foundation for navigation

### Contingency Plans

| If | Then |
|----|------|
| Database migrations fail | Revert and fix; delay by 1 day max |
| Context too slow | Cache at component level; optimize queries |
| Sign-off workflow incomplete | Ship with preparer/reviewer only; add manager/partner later |
| Demo data insufficient | Focus on 2 engagements with depth over 5 with breadth |
| Phase slips by 2+ days | Cut Phase E (Dashboard/Inbox) and polish existing |

---

## Appendix A: File Structure After Implementation

```
src/
├── App.tsx                         # Updated routes
├── config/
│   └── navigation.ts               # NEW: Navigation configuration
├── contexts/
│   ├── AuthContext.tsx             # Existing
│   ├── TenantContext.tsx           # Existing
│   └── EngagementContext.tsx       # NEW: Engagement context
├── components/
│   ├── layouts/
│   │   └── EngagementLayout.tsx    # NEW: Engagement wrapper
│   ├── engagement/
│   │   ├── EngagementSidebar.tsx   # NEW: Engagement nav
│   │   ├── EngagementHeader.tsx    # NEW: Engagement header
│   │   └── EngagementBreadcrumbs.tsx # NEW
│   ├── audit/
│   │   ├── WorkpaperSignoff.tsx    # NEW: Sign-off component
│   │   ├── ReviewNotesPanel.tsx    # NEW: Review notes
│   │   ├── ReviewNoteCard.tsx      # NEW: Single note
│   │   └── SignoffBadge.tsx        # NEW: Status badge
│   └── ... (existing)
├── pages/
│   ├── Dashboard.tsx               # NEW/REWRITE: Personal dashboard
│   ├── Inbox.tsx                   # NEW: Notifications
│   └── engagement/
│       ├── EngagementOverview.tsx  # NEW: Index page
│       ├── EngagementTeam.tsx      # Existing or new
│       ├── EngagementProcedures.tsx # NEW
│       ├── ProcedureExecution.tsx  # NEW
│       ├── EngagementWorkpapers.tsx # NEW
│       ├── WorkpaperEditor.tsx     # MODIFIED
│       ├── EngagementFindings.tsx  # NEW
│       ├── CreateFinding.tsx       # NEW
│       ├── FindingDetail.tsx       # NEW
│       └── EngagementReview.tsx    # NEW
├── hooks/
│   ├── useWorkpaperSignoffs.ts     # NEW
│   ├── useReviewNotes.ts           # NEW
│   ├── useProcedureExecution.ts    # NEW
│   ├── useDashboardStats.ts        # NEW
│   └── ... (existing)
└── ...

supabase/
└── migrations/
    ├── 20251228000001_create_workpaper_signoffs.sql
    ├── 20251228000002_create_review_notes.sql
    ├── 20251228000003_create_notifications.sql
    ├── 20251228000004_create_workpaper_references.sql
    ├── 20251228000005_modify_audit_workpapers.sql
    ├── 20251228000006_modify_audit_findings.sql
    ├── 20251228000007_modify_engagement_procedures.sql
    ├── 20251228000008_create_triggers.sql
    ├── 20251228000009_create_rls_policies.sql
    └── 20251228000010_seed_demo_data.sql
```

---

## Appendix B: Demo Workflow Script

### Scenario: Complete Audit Procedure Flow

```
1. OPEN ENGAGEMENT
   Navigate to: /engagements
   Click: "ABC Manufacturing Corp - 2024 Financial Audit"
   Result: EngagementOverview with 68% complete

2. VIEW PROCEDURES
   Click: "Procedures" in sidebar
   Result: List of 50 procedures with status badges
   Filter: "Assigned to me"
   Result: 8 procedures assigned to logged-in user

3. EXECUTE PROCEDURE
   Click: "Cash - Test Bank Reconciliations"
   Result: ProcedureExecution page with:
   - Procedure details
   - Linked workpaper (or create new)
   - Evidence section
   - Finding creation button

4. WORK IN WORKPAPER
   Click: "Open Workpaper" or "Create Workpaper"
   Result: WorkpaperEditor with:
   - Rich text editor (TipTap)
   - Sign-off panel (right side)
   - Review notes panel (bottom or right)

5. PREPARER SIGN-OFF
   Complete work in editor
   Click: "Sign as Preparer" in sign-off panel
   Enter: "Ready for review"
   Result:
   - Status changes to "Pending Review"
   - Notification sent to senior/manager
   - Sign-off recorded with timestamp

6. REVIEWER ADDS NOTE
   (Switch to reviewer account or impersonate)
   Open same workpaper
   Select text, click "Add Note"
   Type: "Please confirm the $15K reconciling item"
   Select: Type = Question, Priority = Medium
   Click: "Add Note"
   Result: Note appears in panel, count shows "1 open"

7. PREPARER RESPONDS
   (Switch back to preparer)
   Click: "Reply" on the note
   Type: "Discussed with CFO, adjustment will be recorded"
   Click: "Reply"
   Result: Reply nested under original note

8. REVIEWER RESOLVES & SIGNS
   (As reviewer)
   Click: "Resolve" on note
   Enter: "Confirmed, adjustment recorded in WP A-2"
   Click: "Resolve"
   Click: "Sign as Reviewer"
   Result:
   - Note status = Resolved
   - Second sign-off recorded
   - Status = "In Review" or "Approved" depending on config

9. CREATE FINDING
   (If issue found during work)
   Click: "Create Finding" in procedure
   Fill form:
   - Title: "Aged Reconciling Items"
   - Severity: Deficiency
   - Condition, Criteria, Cause, Effect
   Click: "Save Finding"
   Result:
   - Finding created with source_procedure_id linked
   - Finding reference auto-generated (2024-001)
   - Notification sent to manager

10. MANAGER/PARTNER SIGN-OFF
    (As manager, then partner)
    Open workpaper
    Review all notes resolved
    Click: "Sign as Manager" / "Sign as Partner"
    Result:
    - Final sign-off recorded
    - Workpaper locked (no further edits)
    - Procedure marked complete
```

---

**Document End**

*This document should be the single source of truth for the demo-ready implementation. Refer to DESIGN_ADDENDUM.md for even more detailed component specifications and SQL schemas.*
