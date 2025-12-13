import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FileText, AlertTriangle, BarChart3, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function QuickActions() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: 'Coming Soon',
      description: `${action} will be available in the next phase.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create New</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction('New Audit')}>
          <FileText className="h-4 w-4 mr-2" />
          New Audit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('New Finding')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          New Finding
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('New Risk Assessment')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Risk Assessment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction('Search Audits')}>
          <Search className="h-4 w-4 mr-2" />
          Search Audits
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
