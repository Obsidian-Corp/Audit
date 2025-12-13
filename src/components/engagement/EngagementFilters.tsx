/**
 * ==================================================================
 * ADVANCED ENGAGEMENT FILTERS COMPONENT
 * ==================================================================
 * Enhanced filtering system for engagement list with:
 * - Advanced filter options (date range, team member, industry, risk rating)
 * - Filter presets (My Engagements, Overdue, High Risk)
 * - Filter persistence across sessions
 * - Saved filter views
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Filter,
  X,
  Save,
  Star,
  AlertCircle,
  Clock,
  Users,
  Building,
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format, isAfter, isBefore, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface EngagementFilters {
  searchQuery: string;
  status: string[];
  type: string[];
  industry: string[];
  riskLevel: string[];
  teamMember: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  overdue?: boolean;
  myEngagements?: boolean;
}

interface FilterPreset {
  id: string;
  name: string;
  icon: any;
  description: string;
  filters: Partial<EngagementFilters>;
}

interface SavedFilterView {
  id: string;
  name: string;
  filters: EngagementFilters;
  createdAt: string;
}

interface EngagementFiltersProps {
  filters: EngagementFilters;
  onFiltersChange: (filters: EngagementFilters) => void;
  userId?: string;
}

const defaultFilters: EngagementFilters = {
  searchQuery: '',
  status: [],
  type: [],
  industry: [],
  riskLevel: [],
  teamMember: [],
  dateRange: {},
  overdue: false,
  myEngagements: false
};

const filterPresets: FilterPreset[] = [
  {
    id: 'my-engagements',
    name: 'My Engagements',
    icon: Users,
    description: 'Engagements where I am a team member',
    filters: {
      myEngagements: true
    }
  },
  {
    id: 'overdue',
    name: 'Overdue',
    icon: Clock,
    description: 'Engagements past their deadline',
    filters: {
      overdue: true
    }
  },
  {
    id: 'high-risk',
    name: 'High Risk',
    icon: AlertCircle,
    description: 'High risk engagements requiring special attention',
    filters: {
      riskLevel: ['high']
    }
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: RefreshCw,
    description: 'Currently active engagements',
    filters: {
      status: ['in_progress', 'fieldwork']
    }
  }
];

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'fieldwork', label: 'Fieldwork' },
  { value: 'review', label: 'Review' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' }
];

const typeOptions = [
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'integrated', label: 'Integrated' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'operational', label: 'Operational' },
  { value: 'it_audit', label: 'IT Audit' }
];

const industryOptions = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' }
];

const riskLevelOptions = [
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' }
];

export function EngagementFilters({
  filters,
  onFiltersChange,
  userId
}: EngagementFiltersProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedFilterView[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Load saved views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('engagement-filter-views');
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved views:', e);
      }
    }
  }, []);

  // Save current filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('engagement-filters', JSON.stringify(filters));
  }, [filters]);

  // Apply filter preset
  const applyPreset = (preset: FilterPreset) => {
    const newFilters = { ...defaultFilters, ...preset.filters };
    onFiltersChange(newFilters);
    toast({
      title: 'Filter Applied',
      description: `${preset.name} filter has been applied.`
    });
  };

  // Save current filter view
  const saveFilterView = () => {
    if (!newViewName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for this filter view.',
        variant: 'destructive'
      });
      return;
    }

    const newView: SavedFilterView = {
      id: `view-${Date.now()}`,
      name: newViewName,
      filters: filters,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedViews, newView];
    setSavedViews(updated);
    localStorage.setItem('engagement-filter-views', JSON.stringify(updated));

    setIsSaveDialogOpen(false);
    setNewViewName('');

    toast({
      title: 'Filter View Saved',
      description: `"${newViewName}" has been saved.`
    });
  };

  // Load saved filter view
  const loadFilterView = (view: SavedFilterView) => {
    onFiltersChange(view.filters);
    toast({
      title: 'Filter View Loaded',
      description: `"${view.name}" has been applied.`
    });
  };

  // Delete saved filter view
  const deleteFilterView = (viewId: string) => {
    const updated = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updated);
    localStorage.setItem('engagement-filter-views', JSON.stringify(updated));

    toast({
      title: 'Filter View Deleted',
      description: 'The filter view has been removed.'
    });
  };

  // Reset all filters
  const resetFilters = () => {
    onFiltersChange(defaultFilters);
    toast({
      title: 'Filters Reset',
      description: 'All filters have been cleared.'
    });
  };

  // Toggle multi-select filter
  const toggleArrayFilter = (key: keyof EngagementFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    onFiltersChange({ ...filters, [key]: updated });
  };

  // Count active filters
  const activeFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.status.length > 0) count++;
    if (filters.type.length > 0) count++;
    if (filters.industry.length > 0) count++;
    if (filters.riskLevel.length > 0) count++;
    if (filters.teamMember.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.overdue) count++;
    if (filters.myEngagements) count++;
    return count;
  };

  const activeCount = activeFilterCount();

  return (
    <div className="space-y-4">
      {/* Filter Presets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {filterPresets.map((preset) => (
          <Card
            key={preset.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => applyPreset(preset)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <preset.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search engagements..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="w-full"
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0" align="end">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Advanced Filters</h3>
                <div className="flex items-center gap-2">
                  <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Save className="h-4 w-4 mr-1" />
                        Save View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Filter View</DialogTitle>
                        <DialogDescription>
                          Save the current filters as a reusable view
                        </DialogDescription>
                      </DialogHeader>
                      <div>
                        <Label>View Name</Label>
                        <Input
                          value={newViewName}
                          onChange={(e) => setNewViewName(e.target.value)}
                          placeholder="e.g., Q1 Engagements"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveFilterView}>
                          Save View
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.status.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter('status', option.value)}
                      />
                      <label
                        htmlFor={`status-${option.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Audit Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${option.value}`}
                        checked={filters.type.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter('type', option.value)}
                      />
                      <label
                        htmlFor={`type-${option.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Industry Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Industry</Label>
                <div className="grid grid-cols-2 gap-2">
                  {industryOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`industry-${option.value}`}
                        checked={filters.industry.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter('industry', option.value)}
                      />
                      <label
                        htmlFor={`industry-${option.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Risk Level Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Risk Level</Label>
                <div className="flex gap-2">
                  {riskLevelOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`risk-${option.value}`}
                        checked={filters.riskLevel.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter('riskLevel', option.value)}
                      />
                      <label
                        htmlFor={`risk-${option.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? format(filters.dateRange.from, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => onFiltersChange({
                            ...filters,
                            dateRange: { ...filters.dateRange, from: date }
                          })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.to ? format(filters.dateRange.to, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => onFiltersChange({
                            ...filters,
                            dateRange: { ...filters.dateRange, to: date }
                          })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Toggles */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Quick Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="my-engagements"
                      checked={filters.myEngagements || false}
                      onCheckedChange={(checked) => onFiltersChange({
                        ...filters,
                        myEngagements: checked as boolean
                      })}
                    />
                    <label htmlFor="my-engagements" className="text-sm cursor-pointer">
                      My Engagements Only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overdue"
                      checked={filters.overdue || false}
                      onCheckedChange={(checked) => onFiltersChange({
                        ...filters,
                        overdue: checked as boolean
                      })}
                    />
                    <label htmlFor="overdue" className="text-sm cursor-pointer">
                      Overdue Only
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Views */}
            {savedViews.length > 0 && (
              <>
                <Separator />
                <div className="p-4 border-t">
                  <Label className="text-sm font-semibold mb-2 block">Saved Views</Label>
                  <div className="space-y-2">
                    {savedViews.map((view) => (
                      <div key={view.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted">
                        <button
                          onClick={() => loadFilterView(view)}
                          className="flex-1 text-left text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{view.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Saved {format(parseISO(view.createdAt), 'MMM d, yyyy')}
                          </p>
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFilterView(view.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.status.length > 0 && (
            <Badge variant="secondary">
              Status: {filters.status.length}
              <button
                onClick={() => onFiltersChange({ ...filters, status: [] })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.type.length > 0 && (
            <Badge variant="secondary">
              Type: {filters.type.length}
              <button
                onClick={() => onFiltersChange({ ...filters, type: [] })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.industry.length > 0 && (
            <Badge variant="secondary">
              Industry: {filters.industry.length}
              <button
                onClick={() => onFiltersChange({ ...filters, industry: [] })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.riskLevel.length > 0 && (
            <Badge variant="secondary">
              Risk: {filters.riskLevel.length}
              <button
                onClick={() => onFiltersChange({ ...filters, riskLevel: [] })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary">
              Date Range
              <button
                onClick={() => onFiltersChange({ ...filters, dateRange: {} })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.myEngagements && (
            <Badge variant="secondary">
              My Engagements
              <button
                onClick={() => onFiltersChange({ ...filters, myEngagements: false })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.overdue && (
            <Badge variant="secondary">
              Overdue
              <button
                onClick={() => onFiltersChange({ ...filters, overdue: false })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}