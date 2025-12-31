/**
 * ==================================================================
 * AUDIT LOG VIEWER
 * ==================================================================
 * Comprehensive UI for viewing audit history and changelog
 * Shows all changes made to audit data for regulatory compliance
 * ==================================================================
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
  History,
  Search,
  Filter,
  CalendarIcon,
  User,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  RefreshCcw,
  ArrowLeft,
  ArrowRight,
  FileText,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  changed_by: string | null;
  changed_at: string;
  engagement_id: string | null;
}

interface AuditLogViewerProps {
  engagementId?: string;
  showFullHistory?: boolean;
}

// ============================================
// Utility Functions
// ============================================

function getActionIcon(action: string) {
  switch (action) {
    case 'INSERT':
      return <Plus className="h-4 w-4 text-green-500" />;
    case 'UPDATE':
      return <Pencil className="h-4 w-4 text-blue-500" />;
    case 'DELETE':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case 'INSERT':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Created</Badge>;
    case 'UPDATE':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Updated</Badge>;
    case 'DELETE':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Deleted</Badge>;
    default:
      return <Badge variant="secondary">{action}</Badge>;
  }
}

function formatTableName(tableName: string): string {
  return tableName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

// ============================================
// Components
// ============================================

function ChangeDetail({
  field,
  oldValue,
  newValue,
}: {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
      <div className="font-medium text-sm">{formatFieldName(field)}</div>
      <div className="text-sm">
        {oldValue !== undefined && (
          <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
            {formatValue(oldValue)}
          </span>
        )}
      </div>
      <div className="text-sm">
        {newValue !== undefined && (
          <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
            {formatValue(newValue)}
          </span>
        )}
      </div>
    </div>
  );
}

function LogEntryDetail({
  entry,
  open,
  onOpenChange,
}: {
  entry: AuditLogEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const changedFields = entry.changed_fields || [];
  const allFields = new Set([
    ...Object.keys(entry.old_data || {}),
    ...Object.keys(entry.new_data || {}),
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon(entry.action)}
            {formatTableName(entry.table_name)} - {getActionBadge(entry.action)}
          </DialogTitle>
          <DialogDescription>
            Record ID: {entry.record_id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {entry.changed_by || 'System'}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {format(parseISO(entry.changed_at), 'PPpp')}
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-[400px] pr-4">
          {entry.action === 'INSERT' && (
            <div className="space-y-2">
              <h4 className="font-medium mb-2">New Record Data</h4>
              {Object.entries(entry.new_data || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 py-1 border-b">
                  <span className="font-medium text-sm">{formatFieldName(key)}</span>
                  <span className="text-sm">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}

          {entry.action === 'DELETE' && (
            <div className="space-y-2">
              <h4 className="font-medium mb-2">Deleted Record Data</h4>
              {Object.entries(entry.old_data || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 py-1 border-b">
                  <span className="font-medium text-sm">{formatFieldName(key)}</span>
                  <span className="text-sm text-red-600">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}

          {entry.action === 'UPDATE' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 font-medium text-sm border-b pb-2">
                <span>Field</span>
                <span>Old Value</span>
                <span>New Value</span>
              </div>
              {changedFields.length > 0 ? (
                changedFields.map((field) => (
                  <ChangeDetail
                    key={field}
                    field={field}
                    oldValue={(entry.old_data as Record<string, unknown>)?.[field]}
                    newValue={(entry.new_data as Record<string, unknown>)?.[field]}
                  />
                ))
              ) : (
                Array.from(allFields).map((field) => (
                  <ChangeDetail
                    key={field}
                    field={field}
                    oldValue={(entry.old_data as Record<string, unknown>)?.[field]}
                    newValue={(entry.new_data as Record<string, unknown>)?.[field]}
                  />
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Component
// ============================================

export function AuditLogViewer({
  engagementId,
  showFullHistory = false,
}: AuditLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch audit log entries
  const { data: logEntries = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-history', engagementId, page],
    queryFn: async () => {
      let query = supabase
        .from('audit_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  // Get unique table names for filter
  const tableNames = useMemo(() => {
    const names = new Set(logEntries.map((e) => e.table_name));
    return Array.from(names).sort();
  }, [logEntries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return logEntries.filter((entry) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          entry.table_name.toLowerCase().includes(searchLower) ||
          entry.record_id.toLowerCase().includes(searchLower) ||
          entry.changed_by?.toLowerCase().includes(searchLower) ||
          JSON.stringify(entry.new_data).toLowerCase().includes(searchLower) ||
          JSON.stringify(entry.old_data).toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Table filter
      if (selectedTable !== 'all' && entry.table_name !== selectedTable) {
        return false;
      }

      // Action filter
      if (selectedAction !== 'all' && entry.action !== selectedAction) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const entryDate = parseISO(entry.changed_at);
        const interval = {
          start: dateRange.from ? startOfDay(dateRange.from) : new Date(0),
          end: dateRange.to ? endOfDay(dateRange.to) : new Date(),
        };
        if (!isWithinInterval(entryDate, interval)) {
          return false;
        }
      }

      return true;
    });
  }, [logEntries, searchQuery, selectedTable, selectedAction, dateRange]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, AuditLogEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const date = format(parseISO(entry.changed_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Timestamp', 'Table', 'Action', 'Record ID', 'Changed By', 'Changed Fields'];
    const rows = filteredEntries.map((entry) => [
      entry.changed_at,
      entry.table_name,
      entry.action,
      entry.record_id,
      entry.changed_by || 'System',
      entry.changed_fields?.join(', ') || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of all changes for regulatory compliance
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table Filter */}
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {tableNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {formatTableName(name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Filter */}
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({})}
                    className="w-full"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredEntries.length} of {logEntries.length} entries
        </div>

        {/* Log Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <History className="h-12 w-12 mb-4" />
            <p>No audit history found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([date, entries]) => (
                <Collapsible key={date} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary w-full py-2">
                    <ChevronDown className="h-4 w-4" />
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    <Badge variant="secondary" className="ml-2">
                      {entries.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pl-6 mt-2">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          {getActionIcon(entry.action)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatTableName(entry.table_name)}
                              </span>
                              {getActionBadge(entry.action)}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {entry.changed_fields?.length
                                ? `Changed: ${entry.changed_fields.map(formatFieldName).join(', ')}`
                                : `Record: ${entry.record_id.slice(0, 8)}...`}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground text-right">
                            <div>{format(parseISO(entry.changed_at), 'p')}</div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.changed_by?.slice(0, 8) || 'System'}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={logEntries.length < pageSize}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Detail Dialog */}
        {selectedEntry && (
          <LogEntryDetail
            entry={selectedEntry}
            open={!!selectedEntry}
            onOpenChange={(open) => !open && setSelectedEntry(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default AuditLogViewer;
