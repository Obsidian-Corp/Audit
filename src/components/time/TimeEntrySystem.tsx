/**
 * ==================================================================
 * TIME ENTRY SYSTEM
 * ==================================================================
 * Full time entry and billing system for audit engagements
 * ==================================================================
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  Plus,
  Calendar as CalendarIcon,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

interface TimeEntry {
  id: string;
  engagement_id: string;
  user_id: string;
  date: string;
  hours: number;
  description: string;
  task_category: string;
  billing_status: 'unbilled' | 'billed' | 'non-billable';
  hourly_rate: number;
  created_at: string;
}

interface TimeEntrySystemProps {
  engagementId: string;
  engagementName?: string;
}

const TASK_CATEGORIES = [
  { value: 'planning', label: 'Planning' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'controls_testing', label: 'Controls Testing' },
  { value: 'substantive_testing', label: 'Substantive Testing' },
  { value: 'review', label: 'Review & Supervision' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'admin', label: 'Administrative' },
];

export function TimeEntrySystem({ engagementId, engagementName }: TimeEntrySystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
    task_category: 'substantive_testing',
    billing_status: 'unbilled' as const,
    hourly_rate: '150',
  });

  // Fetch time entries
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['time-entries', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('date', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') return [];
        throw error;
      }
      return data as TimeEntry[];
    },
  });

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const billableHours = timeEntries
      .filter((e) => e.billing_status !== 'non-billable')
      .reduce((sum, entry) => sum + entry.hours, 0);
    const billedAmount = timeEntries
      .filter((e) => e.billing_status === 'billed')
      .reduce((sum, entry) => sum + entry.hours * entry.hourly_rate, 0);
    const unbilledAmount = timeEntries
      .filter((e) => e.billing_status === 'unbilled')
      .reduce((sum, entry) => sum + entry.hours * entry.hourly_rate, 0);

    return { totalHours, billableHours, billedAmount, unbilledAmount };
  }, [timeEntries]);

  // Get entries for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const getEntriesForDate = (date: Date) => {
    return timeEntries.filter((entry) => isSameDay(new Date(entry.date), date));
  };

  const getHoursForDate = (date: Date) => {
    return getEntriesForDate(date).reduce((sum, entry) => sum + entry.hours, 0);
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const entry = {
        engagement_id: engagementId,
        date: data.date,
        hours: parseFloat(data.hours),
        description: data.description,
        task_category: data.task_category,
        billing_status: data.billing_status,
        hourly_rate: parseFloat(data.hourly_rate),
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('time_entries')
          .update(entry)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('time_entries')
          .insert(entry);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', engagementId] });
      setIsDialogOpen(false);
      setEditingEntry(null);
      resetForm();
      toast({
        title: editingEntry ? 'Entry Updated' : 'Entry Created',
        description: 'Time entry has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save time entry.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', engagementId] });
      toast({
        title: 'Entry Deleted',
        description: 'Time entry has been removed.',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      hours: '',
      description: '',
      task_category: 'substantive_testing',
      billing_status: 'unbilled',
      hourly_rate: '150',
    });
  };

  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      hours: entry.hours.toString(),
      description: entry.description,
      task_category: entry.task_category,
      billing_status: entry.billing_status,
      hourly_rate: entry.hourly_rate.toString(),
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = (date?: Date) => {
    resetForm();
    if (date) {
      setFormData((prev) => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
    setEditingEntry(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
                <p className="text-2xl font-bold">{summary.billableHours.toFixed(1)}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unbilled Amount</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.unbilledAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Billed Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.billedAmount)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Weekly Timesheet
              </CardTitle>
              <CardDescription>
                Week of {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Select Week
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={() => openNewDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const hours = getHoursForDate(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => openNewDialog(day)}
                >
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className="font-medium">{format(day, 'd')}</div>
                  <div className={`text-lg font-bold ${hours > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {hours > 0 ? `${hours}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-right text-sm text-muted-foreground">
            Week Total: <span className="font-semibold">{weekDays.reduce((sum, day) => sum + getHoursForDate(day), 0).toFixed(1)} hours</span>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>All time entries for this engagement</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time entries yet</p>
              <Button variant="outline" className="mt-4" onClick={() => openNewDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TASK_CATEGORIES.find((c) => c.value === entry.task_category)?.label || entry.task_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell className="text-right font-medium">{entry.hours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.hours * entry.hourly_rate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.billing_status === 'billed'
                              ? 'default'
                              : entry.billing_status === 'unbilled'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {entry.billing_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}</DialogTitle>
            <DialogDescription>
              {engagementName || 'Log time for this engagement'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData((p) => ({ ...p, hours: e.target.value }))}
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Task Category</Label>
              <Select
                value={formData.task_category}
                onValueChange={(v) => setFormData((p) => ({ ...p, task_category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="What did you work on?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData((p) => ({ ...p, hourly_rate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Billing Status</Label>
                <Select
                  value={formData.billing_status}
                  onValueChange={(v: 'unbilled' | 'billed' | 'non-billable') =>
                    setFormData((p) => ({ ...p, billing_status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unbilled">Unbilled</SelectItem>
                    <SelectItem value="billed">Billed</SelectItem>
                    <SelectItem value="non-billable">Non-billable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.hours && formData.hourly_rate && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(formData.hours || '0') * parseFloat(formData.hourly_rate || '0'))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.hours || !formData.description || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {editingEntry ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TimeEntrySystem;
