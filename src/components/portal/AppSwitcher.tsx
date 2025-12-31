/**
 * ==================================================================
 * APP SWITCHER
 * ==================================================================
 * Switch between different apps in the Obsidian suite
 * ==================================================================
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Grid3X3, FileCheck, Calculator, Scale, FileText } from 'lucide-react';

interface App {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  current?: boolean;
}

const apps: App[] = [
  {
    id: 'audit',
    name: 'Audit',
    description: 'Audit engagement management',
    icon: <FileCheck className="h-4 w-4" />,
    current: true,
  },
  {
    id: 'tax',
    name: 'Tax',
    description: 'Tax preparation and planning',
    icon: <Calculator className="h-4 w-4" />,
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Legal document management',
    icon: <Scale className="h-4 w-4" />,
  },
  {
    id: 'docs',
    name: 'Documents',
    description: 'Document management system',
    icon: <FileText className="h-4 w-4" />,
  },
];

export function AppSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden sm:inline">Apps</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Obsidian Suite</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {apps.map((app) => (
          <DropdownMenuItem
            key={app.id}
            disabled={app.current}
            className={app.current ? 'bg-accent' : ''}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0">{app.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{app.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {app.description}
                </div>
              </div>
              {app.current && (
                <span className="text-xs text-primary">Current</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AppSwitcher;
