# Implementation Tickets - Navigation Restructure

## Obsidian Audit Platform - Sprint Backlog

**Generated:** December 28, 2024
**Based on:** NAVIGATION_RESTRUCTURE_DESIGN.md
**Target Completion:** 3 Days

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tickets** | 18 |
| **Estimated Total Effort** | 24 hours |
| **Critical Path Length** | 6 tickets |
| **Parallel Workstreams** | 2 |

---

## Critical Path

```
NAV-001 → NAV-002 → NAV-003 → UI-001 → UI-002 → DEMO-001
   ↓
CTX-001 (parallel)
   ↓
FEAT-001 → FEAT-002 (parallel after NAV-003)
```

**Blocking Dependencies:**
- All NAV tickets block UI tickets
- CTX-001 blocks FEAT-001, FEAT-002
- All core tickets block DEMO tickets

---

## Daily Execution Plan

### Day 1 (8 hours) - Foundation
| Order | Ticket | Effort | Cumulative |
|-------|--------|--------|------------|
| 1 | NAV-001 | 1h | 1h |
| 2 | NAV-002 | 2h | 3h |
| 3 | CTX-001 | 1.5h | 4.5h |
| 4 | NAV-003 | 2h | 6.5h |
| 5 | NAV-004 | 1.5h | 8h |

### Day 2 (8 hours) - Core Implementation
| Order | Ticket | Effort | Cumulative |
|-------|--------|--------|------------|
| 1 | UI-001 | 2h | 2h |
| 2 | UI-002 | 1.5h | 3.5h |
| 3 | FEAT-001 | 2h | 5.5h |
| 4 | FEAT-002 | 1.5h | 7h |
| 5 | UI-003 | 1h | 8h |

### Day 3 (8 hours) - Polish & Demo
| Order | Ticket | Effort | Cumulative |
|-------|--------|--------|------------|
| 1 | UI-004 | 1h | 1h |
| 2 | UI-005 | 1h | 2h |
| 3 | DEMO-001 | 2h | 4h |
| 4 | DEMO-002 | 2h | 6h |
| 5 | DEMO-003 | 1.5h | 7.5h |
| 6 | DEMO-004 | 0.5h | 8h |

---

## Category 1: Navigation & Routing (NAV-XXX)

### NAV-001: Create Navigation Configuration Module

**Priority:** P0 - Critical
**Effort:** 1 hour
**Blocked By:** None
**Blocks:** NAV-002, NAV-003, UI-001

#### Description
Create the centralized navigation configuration file with type definitions, section structure, and role-based visibility rules.

#### Acceptance Criteria
- [ ] Create `src/config/navigation.ts`
- [ ] Define `NavigationItem` interface with id, title, url, icon, roles, badge
- [ ] Define `NavigationSection` interface with collapsible, defaultExpanded
- [ ] Export `navigationConfig` array with all 8 sections
- [ ] Export `quickAccessItems` array
- [ ] Define `ROLE_HIERARCHY` constant
- [ ] TypeScript compiles without errors

#### Files to Create/Modify
```
src/config/navigation.ts (NEW)
src/types/navigation.ts (NEW)
```

#### Implementation Notes
```typescript
// Key sections to define:
// 1. Dashboard (non-collapsible)
// 2. My Work (collapsible, role-based expand)
// 3. Engagements (collapsible, default expanded)
// 4. Audit Execution (collapsible)
// 5. Tools & Libraries (collapsible)
// 6. Planning & Risk (collapsible, manager+)
// 7. Quality & Analytics (collapsible, senior+)
// 8. Administration (collapsible, admin only)
```

---

### NAV-002: Create CollapsibleNavSection Component

**Priority:** P0 - Critical
**Effort:** 2 hours
**Blocked By:** NAV-001
**Blocks:** NAV-003, UI-001

#### Description
Build the reusable collapsible navigation section component that handles expand/collapse state, role filtering, and badge display.

#### Acceptance Criteria
- [ ] Create `src/components/navigation/CollapsibleNavSection.tsx`
- [ ] Implement expand/collapse with smooth animation
- [ ] Filter items based on user roles
- [ ] Support `defaultExpanded: true | false | 'role-based'`
- [ ] Display badge counts for items with `badge: 'count'`
- [ ] Display dot indicator for items with `badge: 'dot'`
- [ ] Hide section entirely if no visible items
- [ ] Chevron rotates 90° when expanded
- [ ] Works in both expanded and collapsed sidebar modes

#### Files to Create/Modify
```
src/components/navigation/CollapsibleNavSection.tsx (NEW)
src/components/navigation/NavItem.tsx (NEW)
src/components/navigation/index.ts (NEW)
```

#### Implementation Notes
```typescript
// Use Radix Collapsible primitive
// Animate with CSS transitions (duration-200)
// Role filtering: item.roles?.some(r => userRoles.includes(r))
// shouldAutoExpand() helper for role-based defaults
```

---

### NAV-003: Refactor AppSidebar Component

**Priority:** P0 - Critical
**Effort:** 2 hours
**Blocked By:** NAV-001, NAV-002
**Blocks:** UI-001, UI-002, DEMO-001

#### Description
Replace the current flat navigation structure with the new collapsible section-based navigation using the configuration module.

#### Acceptance Criteria
- [ ] Import `navigationConfig` from config module
- [ ] Replace manual section rendering with `CollapsibleNavSection` mapping
- [ ] Filter sections by user role before rendering
- [ ] Pass `badgeCounts` from `useNavigationBadges` hook
- [ ] Maintain existing header (FirmSwitcher, user info)
- [ ] Update footer with Settings quick access + Sign Out
- [ ] Remove `DEMO_MODE` flag and `getDemoNavigation()`
- [ ] Remove `getNavigationByRole()` function
- [ ] Preserve sidebar collapse/expand functionality
- [ ] All existing routes remain accessible

#### Files to Create/Modify
```
src/components/AppSidebar.tsx (MODIFY - major refactor)
```

#### Implementation Notes
```typescript
// Before: 400+ lines with inline config
// After: ~100 lines using config + components
// Keep: SidebarHeader, SidebarFooter structure
// Remove: getDemoNavigation, getNavigationByRole
```

---

### NAV-004: Add Route Guards for Role-Based Access

**Priority:** P1 - High
**Effort:** 1.5 hours
**Blocked By:** NAV-001
**Blocks:** DEMO-002

#### Description
Ensure routes are protected based on role requirements defined in navigation config, redirecting unauthorized users appropriately.

#### Acceptance Criteria
- [ ] Create `src/components/auth/RoleGuard.tsx` component
- [ ] Read required roles from navigation config
- [ ] Redirect to `/dashboard` if user lacks required role
- [ ] Show "Access Denied" toast notification
- [ ] Update `App.tsx` route definitions to use guards
- [ ] Handle edge case: user has no roles assigned

#### Files to Create/Modify
```
src/components/auth/RoleGuard.tsx (NEW)
src/App.tsx (MODIFY - wrap protected routes)
```

#### Implementation Notes
```typescript
// <RoleGuard requiredRoles={['engagement_manager', 'partner']}>
//   <EngagementTemplates />
// </RoleGuard>

// Or use a HOC: withRoleGuard(Component, requiredRoles)
```

---

## Category 2: Context & State (CTX-XXX)

### CTX-001: Create useNavigationBadges Hook

**Priority:** P0 - Critical
**Effort:** 1.5 hours
**Blocked By:** None (can run parallel with NAV-001)
**Blocks:** FEAT-001, FEAT-002

#### Description
Create a hook that fetches badge counts for navigation items that display dynamic counts (pending procedures, open findings, etc.).

#### Acceptance Criteria
- [ ] Create `src/hooks/useNavigationBadges.ts`
- [ ] Query counts for:
  - `my-procedures`: Assigned procedures with status not_started or in_progress
  - `tasks`: Pending tasks assigned to user
  - `review-queue`: Procedures with status in_review
  - `approvals`: Engagements pending approval
  - `findings`: Open audit findings
  - `information-requests`: Pending information requests
  - `confirmations`: Sent confirmations awaiting response
- [ ] Return `{ badgeCounts: Record<string, number> }`
- [ ] Refresh every 60 seconds
- [ ] Use staleTime of 30 seconds
- [ ] Handle errors gracefully (return empty counts)

#### Files to Create/Modify
```
src/hooks/useNavigationBadges.ts (NEW)
```

#### Implementation Notes
```typescript
// Use parallel queries with Promise.all for performance
// Each query uses { count: 'exact', head: true } for efficiency
// Map item IDs to query results
```

---

## Category 3: UI Components (UI-XXX)

### UI-001: Update Sidebar Styling for Compact Navigation

**Priority:** P1 - High
**Effort:** 2 hours
**Blocked By:** NAV-003
**Blocks:** UI-002

#### Description
Adjust sidebar CSS to accommodate the new collapsible structure with appropriate spacing, typography, and visual hierarchy.

#### Acceptance Criteria
- [ ] Section labels: `text-[10px] uppercase tracking-wider`
- [ ] Menu items: `h-8` height, `gap-0.5` between items
- [ ] Icons: `h-3.5 w-3.5` size
- [ ] Text: `text-sm` for item labels
- [ ] Padding: `py-1` for sections, `p-2` for footer
- [ ] Chevron: `h-3 w-3` with rotate animation
- [ ] Scrollable content area: `overflow-y-auto`
- [ ] Hover states: `hover:bg-muted/50`
- [ ] Active states: `bg-muted text-primary font-medium`

#### Files to Create/Modify
```
src/components/navigation/CollapsibleNavSection.tsx (MODIFY)
src/components/AppSidebar.tsx (MODIFY)
```

---

### UI-002: Implement Badge Components for Navigation

**Priority:** P1 - High
**Effort:** 1.5 hours
**Blocked By:** UI-001
**Blocks:** None

#### Description
Create badge components for displaying counts and status indicators in navigation items.

#### Acceptance Criteria
- [ ] Count badge: Numeric display (e.g., "12")
- [ ] Dot badge: Small colored circle indicator
- [ ] Badge styling: `h-5 min-w-5 text-xs` for counts
- [ ] Dot styling: `h-2 w-2 rounded-full bg-primary`
- [ ] Animate badge on count change (optional)
- [ ] Hide badge when count is 0
- [ ] Truncate large numbers (99+)

#### Files to Create/Modify
```
src/components/navigation/NavBadge.tsx (NEW)
src/components/navigation/NavItem.tsx (MODIFY)
```

---

### UI-003: Add Keyboard Navigation Support

**Priority:** P2 - Medium
**Effort:** 1 hour
**Blocked By:** NAV-003
**Blocks:** None

#### Description
Enable keyboard navigation through sidebar sections and items for accessibility.

#### Acceptance Criteria
- [ ] Arrow Up/Down: Move between items
- [ ] Enter/Space: Activate item or toggle section
- [ ] Left Arrow: Collapse current section
- [ ] Right Arrow: Expand current section
- [ ] Tab: Move focus to next focusable element
- [ ] Escape: Close expanded sections
- [ ] Focus indicators visible on all interactive elements

#### Files to Create/Modify
```
src/components/navigation/CollapsibleNavSection.tsx (MODIFY)
src/components/AppSidebar.tsx (MODIFY)
```

---

### UI-004: Add Tooltips for Collapsed Sidebar Mode

**Priority:** P2 - Medium
**Effort:** 1 hour
**Blocked By:** NAV-003
**Blocks:** None

#### Description
When sidebar is collapsed to icon-only mode, show tooltips on hover to identify navigation items.

#### Acceptance Criteria
- [ ] Tooltips appear on hover when sidebar collapsed
- [ ] Show item title in tooltip
- [ ] Position tooltip to the right of icon
- [ ] No delay on tooltip appearance
- [ ] Tooltips for section headers show section label
- [ ] Use Radix TooltipProvider with `delayDuration={0}`

#### Files to Create/Modify
```
src/components/navigation/NavItem.tsx (MODIFY)
src/components/navigation/CollapsibleNavSection.tsx (MODIFY)
```

---

### UI-005: Implement Sidebar Section Persistence

**Priority:** P3 - Low
**Effort:** 1 hour
**Blocked By:** NAV-003
**Blocks:** None

#### Description
Remember which sections the user has expanded/collapsed across page reloads using localStorage.

#### Acceptance Criteria
- [ ] Store expanded section IDs in localStorage
- [ ] Key: `obsidian-nav-expanded-sections`
- [ ] Restore state on page load
- [ ] Merge with default expanded states
- [ ] Clear storage on logout
- [ ] Handle storage quota exceeded gracefully

#### Files to Create/Modify
```
src/hooks/useNavigationState.ts (NEW)
src/components/navigation/CollapsibleNavSection.tsx (MODIFY)
```

---

## Category 4: Core Features (FEAT-XXX)

### FEAT-001: Integrate Badge Counts with Real Data

**Priority:** P1 - High
**Effort:** 2 hours
**Blocked By:** CTX-001
**Blocks:** DEMO-001

#### Description
Wire up the useNavigationBadges hook to actual database queries and ensure counts are accurate.

#### Acceptance Criteria
- [ ] My Procedures count matches `/my-procedures` page count
- [ ] Review Queue count matches `/review-queue` page count
- [ ] Findings count matches open findings
- [ ] Approvals count matches pending engagements
- [ ] Tasks count matches pending tasks
- [ ] Info Requests count matches pending requests
- [ ] Confirmations count matches sent confirmations
- [ ] Counts update after CRUD operations

#### Files to Create/Modify
```
src/hooks/useNavigationBadges.ts (MODIFY)
```

#### Testing Notes
```
1. Create a new procedure → My Procedures count increases
2. Complete a procedure → count decreases
3. Submit for review → Review Queue count increases
4. Approve procedure → Review Queue count decreases
```

---

### FEAT-002: Role-Based Default Expansion Logic

**Priority:** P1 - High
**Effort:** 1.5 hours
**Blocked By:** CTX-001, NAV-003
**Blocks:** None

#### Description
Implement smart defaults for which sections are expanded based on user's role.

#### Acceptance Criteria
- [ ] Staff Auditor: "My Work" expanded by default
- [ ] Senior Auditor: "My Work" + "Quality & Analytics" expanded
- [ ] Engagement Manager: "Engagements" + "Planning & Risk" expanded
- [ ] Partner: "Engagements" + "Quality & Analytics" expanded
- [ ] Admin: All sections collapsed except "Administration"
- [ ] User preference overrides role defaults (after first interaction)

#### Files to Create/Modify
```
src/components/navigation/CollapsibleNavSection.tsx (MODIFY)
src/config/navigation.ts (MODIFY - add roleDefaults)
```

---

## Category 5: Demo & Polish (DEMO-XXX)

### DEMO-001: Update Demo Seed Data for Navigation Testing

**Priority:** P1 - High
**Effort:** 2 hours
**Blocked By:** FEAT-001
**Blocks:** DEMO-002

#### Description
Ensure demo data includes appropriate counts for all badge-enabled navigation items.

#### Acceptance Criteria
- [ ] 5+ procedures assigned to demo user (various statuses)
- [ ] 3+ tasks pending for demo user
- [ ] 2+ procedures in_review status
- [ ] 1+ engagement pending approval
- [ ] 3+ open findings
- [ ] 2+ pending information requests
- [ ] 2+ sent confirmations
- [ ] Data visible for all demo account roles

#### Files to Create/Modify
```
scripts/seed-demo-data.mjs (MODIFY)
scripts/seed-navigation-demo.mjs (NEW)
```

---

### DEMO-002: Validate Navigation with All Demo Roles

**Priority:** P1 - High
**Effort:** 2 hours
**Blocked By:** DEMO-001, NAV-004
**Blocks:** DEMO-003

#### Description
Test the navigation structure with each demo account to verify role-based visibility.

#### Acceptance Criteria
- [ ] Test with `staff@obsidian-audit.com`:
  - See: Dashboard, My Work (4 items), Engagements (2 items), Audit Execution, Tools
  - Don't see: Planning & Risk, Administration
- [ ] Test with `manager@obsidian-audit.com`:
  - See: All above + Templates, Approvals, Planning & Risk
  - Don't see: Administration
- [ ] Test with `partner@obsidian-audit.com`:
  - See: All above + Quality & Analytics
  - Don't see: Administration
- [ ] Test with `demo@obsidian-audit.com` (admin):
  - See: All sections including Administration

#### Testing Checklist
```
For each role:
1. Login with credentials
2. Verify visible sections match expected
3. Verify hidden sections are not accessible
4. Click each visible item and confirm page loads
5. Verify badge counts display correctly
6. Test section expand/collapse
7. Test sidebar collapse mode
```

---

### DEMO-003: Create Navigation Demo Script

**Priority:** P2 - Medium
**Effort:** 1.5 hours
**Blocked By:** DEMO-002
**Blocks:** DEMO-004

#### Description
Document a step-by-step demo script showcasing the new navigation system.

#### Acceptance Criteria
- [ ] Create `docs/NAVIGATION_DEMO_SCRIPT.md`
- [ ] Cover all 8 sections with talking points
- [ ] Highlight role-based visibility differences
- [ ] Show badge count updates in real-time
- [ ] Demonstrate keyboard navigation
- [ ] Include screenshots or screen recording links

#### Files to Create/Modify
```
docs/NAVIGATION_DEMO_SCRIPT.md (NEW)
```

---

### DEMO-004: Final Polish and Cleanup

**Priority:** P2 - Medium
**Effort:** 0.5 hours
**Blocked By:** All other tickets
**Blocks:** None (Final ticket)

#### Description
Final cleanup, removing debug code and ensuring production readiness.

#### Acceptance Criteria
- [ ] Remove all `console.log` statements
- [ ] Remove any TODO comments that are resolved
- [ ] Verify no TypeScript errors: `npm run typecheck`
- [ ] Verify build succeeds: `npm run build`
- [ ] Update CHANGELOG.md with navigation changes
- [ ] Tag release: `v1.1.0-navigation`

#### Files to Create/Modify
```
CHANGELOG.md (MODIFY)
Various files (cleanup)
```

---

## Appendix A: File Change Summary

### New Files (9)
```
src/config/navigation.ts
src/types/navigation.ts
src/components/navigation/CollapsibleNavSection.tsx
src/components/navigation/NavItem.tsx
src/components/navigation/NavBadge.tsx
src/components/navigation/index.ts
src/components/auth/RoleGuard.tsx
src/hooks/useNavigationBadges.ts
src/hooks/useNavigationState.ts
```

### Modified Files (5)
```
src/components/AppSidebar.tsx (major refactor)
src/App.tsx (add route guards)
scripts/seed-demo-data.mjs (add nav demo data)
docs/NAVIGATION_DEMO_SCRIPT.md (new documentation)
CHANGELOG.md (update)
```

### Deleted Code
```
- getDemoNavigation() function
- getNavigationByRole() function
- DEMO_MODE constant
- Inline navigation configuration (~300 lines)
```

---

## Appendix B: Rollback Plan

If issues are discovered post-deployment:

1. **Immediate Rollback:**
   ```bash
   git revert HEAD~N  # N = number of nav commits
   npm run build && npm run deploy
   ```

2. **Feature Flag Alternative:**
   ```typescript
   // In AppSidebar.tsx
   const USE_NEW_NAV = localStorage.getItem('use-new-nav') === 'true';

   if (USE_NEW_NAV) {
     return <NewNavigation />;
   }
   return <LegacyNavigation />;
   ```

3. **Gradual Rollout:**
   - Deploy to staging first
   - Enable for internal users via feature flag
   - Monitor error rates for 24 hours
   - Full production rollout

---

## Appendix C: Success Metrics

Track these metrics post-implementation:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg. clicks to reach feature | ≤ 2 | Analytics tracking |
| Navigation-related support tickets | -50% | Ticket analysis |
| Time to complete common tasks | -20% | User testing |
| Accessibility score | 100% | Lighthouse audit |
| User satisfaction (survey) | ≥ 4.0/5.0 | Post-launch survey |

---

*Tickets Generated: December 28, 2024*
*Total Implementation Time: ~24 hours (3 days)*
