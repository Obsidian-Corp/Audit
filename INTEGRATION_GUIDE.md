# INTEGRATION GUIDE
**New Components Integration Reference**

This guide shows how to integrate the newly created components into your existing engagement workflows.

---

## 1. Review Notes Workflow

### Where to Integrate
Add to the Review tab of your engagement detail page.

### Integration Code
```typescript
import { ReviewNotesWorkflow } from '@/components/audit-tools/ReviewNotesWorkflow';

// Inside your component
<ReviewNotesWorkflow
  engagementId={engagementId}
  procedureId={selectedProcedureId} // Optional: filter to specific procedure
  userId={currentUser.id}
  userRole={currentUser.role} // 'preparer' | 'reviewer' | 'manager' | 'partner'
/>
```

### Usage Example
```typescript
// In EngagementDetailAudit.tsx - Review Tab
<TabsContent value="review">
  <ReviewNotesWorkflow
    engagementId={engagementId}
    userId={session.user.id}
    userRole={userProfile.role}
  />
</TabsContent>
```

---

## 2. Sign-Off Workflow

### Where to Integrate
Add to both Fieldwork and Review tabs.

### Integration Code
```typescript
import { SignOffWorkflow } from '@/components/audit-tools/SignOffWorkflow';

<SignOffWorkflow
  engagementId={engagementId}
  userId={currentUser.id}
  userRole={currentUser.role}
  userName={currentUser.full_name}
/>
```

### Usage Example
```typescript
// In AuditFieldworkTab.tsx
<Card>
  <CardHeader>
    <CardTitle>Sign-Off Status</CardTitle>
  </CardHeader>
  <CardContent>
    <SignOffWorkflow
      engagementId={engagementId}
      userId={session.user.id}
      userRole={userProfile.role}
      userName={userProfile.full_name}
    />
  </CardContent>
</Card>
```

---

## 3. Audit Report Drafting

### Where to Integrate
Add to the Reporting tab of your engagement detail page.

### Integration Code
```typescript
import { AuditReportDrafting } from '@/components/audit-tools/AuditReportDrafting';

<AuditReportDrafting
  engagementId={engagementId}
  clientName={engagement.client.client_name}
  userId={currentUser.id}
  userName={currentUser.full_name}
/>
```

### Usage Example
```typescript
// In AuditReportingTab.tsx
<TabsContent value="reports">
  <AuditReportDrafting
    engagementId={engagementId}
    clientName={engagement.client?.client_name || 'Unknown Client'}
    userId={session.user.id}
    userName={userProfile.full_name}
  />
</TabsContent>
```

---

## 4. Audit Strategy Memo

### Where to Integrate
Add to the Planning tab of your engagement detail page.

### Integration Code
```typescript
import { AuditStrategyMemo } from '@/components/audit-tools/AuditStrategyMemo';

<AuditStrategyMemo
  engagementId={engagementId}
  clientName={engagement.client.client_name}
  fiscalYearEnd={engagement.fiscal_year_end}
/>
```

### Usage Example
```typescript
// In AuditPlanningTab.tsx
<Card>
  <CardHeader>
    <CardTitle>Audit Strategy & Planning</CardTitle>
  </CardHeader>
  <CardContent>
    <AuditStrategyMemo
      engagementId={engagementId}
      clientName={engagement.client?.client_name || 'Unknown Client'}
      fiscalYearEnd={engagement.fiscal_year_end || '2024-12-31'}
    />
  </CardContent>
</Card>
```

---

## 5. Enhanced Engagement Filters

### Where to Integrate
Add to the EngagementList page.

### Integration Code
```typescript
import { EngagementFilters, type EngagementFilters as FilterType } from '@/components/engagement/EngagementFilters';
import { useState, useMemo } from 'react';

// State
const [filters, setFilters] = useState<FilterType>({
  searchQuery: '',
  status: [],
  type: [],
  industry: [],
  riskLevel: [],
  teamMember: [],
  dateRange: {},
  overdue: false,
  myEngagements: false
});

// Filter function
const filteredEngagements = useMemo(() => {
  let filtered = [...engagements];

  // Search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(eng =>
      eng.audit_title.toLowerCase().includes(query) ||
      eng.audit_number.toLowerCase().includes(query) ||
      eng.client?.client_name?.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (filters.status.length > 0) {
    filtered = filtered.filter(eng =>
      filters.status.includes(eng.workflow_status)
    );
  }

  // Type filter
  if (filters.type.length > 0) {
    filtered = filtered.filter(eng =>
      filters.type.includes(eng.audit_type)
    );
  }

  // Industry filter
  if (filters.industry.length > 0) {
    filtered = filtered.filter(eng =>
      filters.industry.includes(eng.client?.industry || '')
    );
  }

  // Risk level filter
  if (filters.riskLevel.length > 0) {
    filtered = filtered.filter(eng =>
      filters.riskLevel.includes(eng.risk_level || '')
    );
  }

  // Date range filter
  if (filters.dateRange.from || filters.dateRange.to) {
    filtered = filtered.filter(eng => {
      const engDate = new Date(eng.created_at);
      if (filters.dateRange.from && engDate < filters.dateRange.from) return false;
      if (filters.dateRange.to && engDate > filters.dateRange.to) return false;
      return true;
    });
  }

  // Overdue filter
  if (filters.overdue) {
    filtered = filtered.filter(eng =>
      eng.due_date && new Date(eng.due_date) < new Date()
    );
  }

  // My engagements filter
  if (filters.myEngagements) {
    filtered = filtered.filter(eng =>
      eng.lead_auditor_id === userId ||
      eng.manager_id === userId ||
      eng.partner_id === userId
    );
  }

  return filtered;
}, [engagements, filters, userId]);

// Component
<EngagementFilters
  filters={filters}
  onFiltersChange={setFilters}
  userId={session.user.id}
/>
```

### Usage Example
```typescript
// In EngagementList.tsx
export default function EngagementList() {
  const [filters, setFilters] = useState<EngagementFilters>({...});
  const filteredEngagements = useMemo(() => {...}, [engagements, filters]);

  return (
    <div>
      <EngagementFilters
        filters={filters}
        onFiltersChange={setFilters}
        userId={session?.user?.id}
      />

      {/* Display filtered engagements */}
      <div className="mt-6">
        {filteredEngagements.map(eng => (
          <EngagementCard key={eng.id} engagement={eng} />
        ))}
      </div>
    </div>
  );
}
```

---

## Database Setup (If Tables Don't Exist)

### Run These SQL Commands in Supabase SQL Editor

```sql
-- 1. Review Notes Table
CREATE TABLE IF NOT EXISTS audit_review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES audit_procedures(id),
  reviewer_id UUID REFERENCES profiles(id),
  note TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  preparer_response TEXT,
  preparer_id UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sign-Offs Table
CREATE TABLE IF NOT EXISTS audit_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('procedure', 'section', 'engagement')),
  entity_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('preparer', 'reviewer', 'manager', 'partner')),
  user_id UUID REFERENCES profiles(id),
  signed_at TIMESTAMPTZ,
  signature_type TEXT CHECK (signature_type IN ('electronic', 'digital')),
  comments TEXT,
  locked BOOLEAN DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('pending', 'signed', 'rejected', 'delegated')),
  delegated_from UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Audit Reports Table
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES audits(id),
  report_type TEXT NOT NULL CHECK (
    report_type IN ('unqualified', 'qualified', 'adverse', 'disclaimer', 'management_letter', 'internal_control')
  ),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  version NUMERIC NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'final', 'issued')),
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  issued_date TIMESTAMPTZ,
  fiscal_year_end DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Audit Strategy Memos Table
CREATE TABLE IF NOT EXISTS audit_strategy_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES audits(id),
  memo_data JSONB NOT NULL,
  checklist_data JSONB NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE audit_review_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_strategy_memos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Example - adjust based on your security requirements)
CREATE POLICY "Users can view review notes for their engagements"
  ON audit_review_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audits a
      WHERE a.id IN (
        SELECT engagement_id FROM audit_procedures WHERE id = audit_review_notes.procedure_id
      )
      AND (
        a.lead_auditor_id = auth.uid() OR
        a.manager_id = auth.uid() OR
        a.partner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert review notes for their engagements"
  ON audit_review_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits a
      WHERE a.id IN (
        SELECT engagement_id FROM audit_procedures WHERE id = audit_review_notes.procedure_id
      )
      AND (
        a.lead_auditor_id = auth.uid() OR
        a.manager_id = auth.uid() OR
        a.partner_id = auth.uid()
      )
    )
  );

-- Add indexes for performance
CREATE INDEX idx_review_notes_procedure ON audit_review_notes(procedure_id);
CREATE INDEX idx_review_notes_status ON audit_review_notes(status);
CREATE INDEX idx_signoffs_entity ON audit_signoffs(entity_type, entity_id);
CREATE INDEX idx_signoffs_user ON audit_signoffs(user_id);
CREATE INDEX idx_reports_engagement ON audit_reports(engagement_id);
CREATE INDEX idx_memos_engagement ON audit_strategy_memos(engagement_id);
```

---

## Route Configuration

### Add These Routes to Your App.tsx

```typescript
import { ReviewNotesWorkflow } from '@/components/audit-tools/ReviewNotesWorkflow';
import { SignOffWorkflow } from '@/components/audit-tools/SignOffWorkflow';
import { AuditReportDrafting } from '@/components/audit-tools/AuditReportDrafting';
import { AuditStrategyMemo } from '@/components/audit-tools/AuditStrategyMemo';

// If you want standalone pages for these tools:
<Route path="/audit-tools/review-notes" element={<ReviewNotesWorkflow />} />
<Route path="/audit-tools/sign-offs" element={<SignOffWorkflow />} />
<Route path="/audit-tools/reports" element={<AuditReportDrafting />} />
<Route path="/audit-tools/strategy-memo" element={<AuditStrategyMemo />} />
```

**Note:** These components are designed to be embedded in engagement tabs, not as standalone pages. Only create standalone routes if needed for specific workflows.

---

## Testing Checklist

After integration, test the following:

### Review Notes Workflow
- ✅ Add a review note to a procedure
- ✅ Filter notes by status (Open, In Progress, Resolved)
- ✅ Filter notes by priority (High, Medium, Low)
- ✅ Add preparer response to a note
- ✅ Mark note as resolved
- ✅ Search notes by keyword

### Sign-Off Workflow
- ✅ Sign off as preparer
- ✅ Sign off as reviewer (after preparer)
- ✅ Sign off as manager (after reviewer)
- ✅ Sign off as partner (after manager)
- ✅ Verify procedure locks after partner sign-off
- ✅ Delegate a sign-off to another user
- ✅ View sign-off history

### Audit Report Drafting
- ✅ Select a report template
- ✅ Edit report sections
- ✅ Insert findings from findings register
- ✅ Save draft report
- ✅ Send report for review
- ✅ Approve report
- ✅ Export report to PDF

### Audit Strategy Memo
- ✅ Complete client information section
- ✅ Complete engagement information section
- ✅ Complete risk assessment section
- ✅ Complete audit approach section
- ✅ Complete resource planning section
- ✅ Check all required checklist items
- ✅ View summary and verify progress = 100%
- ✅ Save memo and export to PDF

### Enhanced Filters
- ✅ Apply "My Engagements" preset
- ✅ Apply "Overdue" preset
- ✅ Apply "High Risk" preset
- ✅ Use advanced filters (status, type, industry, risk)
- ✅ Select date range
- ✅ Save a filter view
- ✅ Load a saved filter view
- ✅ Delete a saved filter view
- ✅ Verify filters persist after page reload

---

## Troubleshooting

### Issue: "Table does not exist" error
**Solution:** Run the database setup SQL commands above in Supabase SQL Editor.

### Issue: "Permission denied" error
**Solution:** Check RLS policies. Make sure users have appropriate permissions to view/edit data.

### Issue: Components not rendering
**Solution:**
1. Verify import paths are correct
2. Ensure all required props are passed
3. Check browser console for errors
4. Verify data is being fetched from database

### Issue: Filters not working
**Solution:**
1. Verify `filteredEngagements` function includes all filter logic
2. Check that engagement data has required fields (industry, risk_level, etc.)
3. Ensure localStorage is enabled in browser

### Issue: Real-time updates not working
**Solution:** Implement Supabase realtime subscriptions:
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('review-notes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'audit_review_notes'
    }, (payload) => {
      // Refetch data or update state
      queryClient.invalidateQueries(['review-notes']);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

---

## Support

For questions or issues with integration:
1. Check the FINAL_IMPLEMENTATION_REPORT.md for detailed feature documentation
2. Review component source code for prop definitions and usage examples
3. Check Supabase dashboard for database table structure and RLS policies
4. Verify all dependencies are installed: `npm install`

---

*Integration Guide - Build 37494*
