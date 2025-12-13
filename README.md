# Obsidian Audit

Enterprise audit execution engine for professional audit firms.

## Overview

Obsidian Audit is a focused platform for managing the core audit execution workflow:

- **Audit Programs & Procedures** - Standardized audit programs with customizable procedures
- **Workpapers** - Electronic workpaper creation, editing, and review
- **Evidence Management** - Secure evidence collection and chain-of-custody
- **Review Workflows** - Multi-level review and sign-off process
- **Findings Management** - Issue tracking from identification to remediation
- **Audit Tools** - Materiality calculators, sampling tools, analytical procedures

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **State**: TanStack Query, React Context
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Rich Text**: TipTap

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── components/
│   ├── audit/           # Audit-specific components
│   │   ├── analytics/   # Audit analytics & charts
│   │   ├── dashboard/   # Audit dashboard widgets
│   │   ├── programs/    # Program & procedure components
│   │   ├── workpapers/  # Workpaper editor & templates
│   │   └── ...
│   ├── engagement/      # Engagement management
│   └── ui/              # Shared UI components (shadcn)
├── pages/
│   ├── audit/           # Audit execution pages
│   ├── audit-tools/     # Compliance calculators
│   ├── engagement/      # Engagement pages
│   └── admin/           # Administration
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── types/               # TypeScript types
└── integrations/        # Supabase client
```

## Core Features

### Audit Execution
- `/audits` - Active audits list
- `/universe` - Audit universe management
- `/risks` - Risk assessments
- `/plans` - Audit planning

### Programs & Procedures
- `/programs` - Audit program library
- `/procedures` - Procedure library
- `/my-procedures` - Assigned procedures

### Workpapers
- `/workpapers` - Workpaper management
- `/workpapers/:id` - Workpaper editor

### Review & Quality
- `/review-queue` - Procedure review queue
- `/quality-control` - QC dashboard
- `/findings` - Findings management

### Audit Tools
- `/tools/materiality` - Materiality calculator
- `/tools/sampling` - Sample size calculator
- `/tools/confirmations` - Confirmation tracker
- `/tools/analytical-procedures` - Analytical procedures

## License

Proprietary - Obsidian Corp
