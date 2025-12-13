# Layout System

This directory contains the three standard layout components used throughout the Obsidian Platform. Each layout serves a specific purpose and provides consistent structure across the application.

## Layout Components

### 1. PortalLayout
**Purpose**: 12-column asymmetric grid for dashboard-style pages  
**Used for**: Portal, Dashboard, Analytics pages

```tsx
import { PortalLayout } from '@/components/layouts';

function DashboardPage() {
  return (
    <PortalLayout>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">Main content</div>
        <div className="col-span-4">Sidebar</div>
      </div>
    </PortalLayout>
  );
}
```

**Features**:
- Full-width container with responsive padding
- Ideal for complex dashboard layouts
- Supports asymmetric column layouts

---

### 2. AppLayout
**Purpose**: Standard layout with optional breadcrumbs, title, and actions  
**Used for**: Most app pages with list views, forms, tables

```tsx
import { AppLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';

function ProjectsList() {
  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Portal', href: '/portal' },
        { label: 'Projects' }
      ]}
      title="Projects"
      description="Manage all your projects in one place"
      actions={
        <Button>Create Project</Button>
      }
    >
      {/* Your content here */}
      <ProjectsTable />
    </AppLayout>
  );
}
```

**Props**:
- `breadcrumbs?: BreadcrumbItem[]` - Navigation breadcrumbs
- `title?: string` - Page title
- `description?: string` - Page description
- `actions?: ReactNode` - Action buttons (top right)
- `children: ReactNode` - Main content

---

### 3. DetailLayout
**Purpose**: Narrow content with optional context sidebar  
**Used for**: Detail pages like Project Details, Task Details, Entity views

```tsx
import { DetailLayout } from '@/components/layouts';
import { RelatedFeatures } from '@/components/shared';

function ProjectDetails() {
  return (
    <DetailLayout
      breadcrumbs={[
        { label: 'Portal', href: '/portal' },
        { label: 'Projects', href: '/apps/pm/projects' },
        { label: 'Project Alpha' }
      ]}
      title="Project Alpha"
      subtitle="Enterprise Cloud Migration"
      backUrl="/apps/pm/projects"
      actions={
        <>
          <Button variant="outline">Edit</Button>
          <Button>Share</Button>
        </>
      }
      sidebar={
        <RelatedFeatures
          features={[
            {
              title: 'Stakeholders',
              description: 'View project stakeholders',
              icon: Users,
              path: '/apps/stakeholders'
            }
          ]}
        />
      }
    >
      {/* Main content */}
      <ProjectOverview />
      <TasksList />
    </DetailLayout>
  );
}
```

**Props**:
- `breadcrumbs?: BreadcrumbItem[]` - Navigation breadcrumbs
- `title?: string` - Main title (larger, bold)
- `subtitle?: string` - Subtitle/description
- `backUrl?: string` - Optional back button URL
- `actions?: ReactNode` - Action buttons (top right)
- `sidebar?: ReactNode` - Right sidebar content (4 columns on large screens)
- `children: ReactNode` - Main content (8 columns when sidebar present)

---

## When to Use Which Layout

### Use PortalLayout when:
- Building dashboard/overview pages
- Need custom grid layouts
- Combining multiple data visualizations
- Creating asymmetric layouts (e.g., 8-4 split)

### Use AppLayout when:
- Building standard CRUD list pages
- Creating forms
- Displaying data tables
- Need consistent header with breadcrumbs and actions

### Use DetailLayout when:
- Showing entity details (Project, Task, User, etc.)
- Need a sidebar for related info or actions
- Want a prominent back button
- Displaying long-form content

---

## Best Practices

1. **Consistent Breadcrumbs**: Always include breadcrumbs on detail pages
2. **Action Placement**: Put primary actions in the `actions` prop
3. **Sidebar Content**: Use RelatedFeatures component for cross-feature navigation
4. **Responsive**: All layouts are mobile-responsive by default
5. **Nesting**: Avoid nesting layouts inside each other

---

## Related Components

- `<Breadcrumbs />` - Used internally by AppLayout and DetailLayout
- `<RelatedFeatures />` - Perfect for DetailLayout sidebars
- `<Card />` - Use for content within layouts

---

## Migration Guide

If you have pages using custom layout logic:

**Before**:
```tsx
function OldPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1>My Page</h1>
        {/* content */}
      </div>
    </div>
  );
}
```

**After**:
```tsx
import { AppLayout } from '@/components/layouts';

function NewPage() {
  return (
    <AppLayout title="My Page">
      {/* content */}
    </AppLayout>
  );
}
```
