/**
 * ReviewQueuePage Component
 * Ticket: UI-008
 *
 * Dashboard for reviewers and managers to see items awaiting their review.
 * Filters by review status and shows workpapers/procedures pending sign-off.
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEngagement } from '@/contexts/EngagementContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ClipboardList,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pen,
  ArrowUpRight,
  RefreshCw,
  Users,
  Shield,
  Crown,
  User,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

// Review item types
type ReviewItemType = 'workpaper' | 'procedure';
type ReviewStatus = 'pending_review' | 'in_review' | 'changes_requested' | 'approved';

interface ReviewItem {
  id: string;
  type: ReviewItemType;
  title: string;
  reference: string | null;
  status: ReviewStatus;
  preparer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  reviewer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  section: string | null;
  priority: 'high' | 'medium' | 'low';
  submittedAt: string;
  dueDate: string | null;
  noteCount: number;
  unresolvedNotes: number;
}

// Status configuration
const statusConfig: Record<ReviewStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending_review: { label: 'Pending Review', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  in_review: { label: 'In Review', color: 'text-blue-600 bg-blue-100', icon: Eye },
  changes_requested: { label: 'Changes Requested', color: 'text-orange-600 bg-orange-100', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-green-600 bg-green-100', icon: CheckCircle2 },
};

// Type configuration
const typeConfig: Record<ReviewItemType, { label: string; icon: React.ElementType }> = {
  workpaper: { label: 'Workpaper', icon: FileText },
  procedure: { label: 'Procedure', icon: ClipboardList },
};

interface ReviewQueuePageProps {
  /** Engagement ID (from route or prop) */
  engagementId?: string;
}

export function ReviewQueuePage({ engagementId: propEngagementId }: ReviewQueuePageProps) {
  const { engagementId: routeEngagementId } = useParams<{ engagementId: string }>();
  const engagementId = propEngagementId || routeEngagementId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'my-queue' | 'all' | 'completed'>('my-queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReviewItemType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');

  // Fetch workpapers pending review
  const { data: workpapers, isLoading: workpapersLoading } = useQuery({
    queryKey: ['review-queue-workpapers', engagementId],
    queryFn: async () => {
      if (!engagementId) return [];

      const { data, error } = await supabase
        .from('audit_workpapers')
        .select(`
          id,
          title,
          workpaper_reference,
          review_status,
          section_id,
          prepared_by,
          reviewed_by,
          review_deadline,
          created_at,
          updated_at,
          preparer:prepared_by (
            id,
            full_name,
            avatar_url
          ),
          reviewer:reviewed_by (
            id,
            full_name,
            avatar_url
          ),
          sections:section_id (
            name
          )
        `)
        .eq('engagement_id', engagementId)
        .in('review_status', ['pending_review', 'in_review', 'changes_requested', 'approved']);

      if (error) throw error;

      // Get note counts for each workpaper
      const workpaperIds = data.map((wp: any) => wp.id);
      const { data: noteCounts } = await supabase
        .from('review_notes')
        .select('workpaper_id, status')
        .in('workpaper_id', workpaperIds);

      const noteCountMap = new Map<string, { total: number; unresolved: number }>();
      noteCounts?.forEach((note: any) => {
        const current = noteCountMap.get(note.workpaper_id) || { total: 0, unresolved: 0 };
        current.total += 1;
        if (note.status !== 'resolved') current.unresolved += 1;
        noteCountMap.set(note.workpaper_id, current);
      });

      return data.map((wp: any) => ({
        id: wp.id,
        type: 'workpaper' as ReviewItemType,
        title: wp.title,
        reference: wp.workpaper_reference,
        status: wp.review_status as ReviewStatus,
        preparer: wp.preparer,
        reviewer: wp.reviewer,
        section: wp.sections?.name || null,
        priority: getDuePriority(wp.review_deadline),
        submittedAt: wp.updated_at,
        dueDate: wp.review_deadline,
        noteCount: noteCountMap.get(wp.id)?.total || 0,
        unresolvedNotes: noteCountMap.get(wp.id)?.unresolved || 0,
      }));
    },
    enabled: !!engagementId,
    staleTime: 30 * 1000,
  });

  // Fetch procedures pending review
  const { data: procedures, isLoading: proceduresLoading } = useQuery({
    queryKey: ['review-queue-procedures', engagementId],
    queryFn: async () => {
      if (!engagementId) return [];

      const { data, error } = await supabase
        .from('audit_procedures')
        .select(`
          id,
          name,
          procedure_reference,
          workflow_status,
          section_id,
          assigned_to,
          assigned_reviewer,
          created_at,
          updated_at,
          assignee:assigned_to (
            id,
            full_name,
            avatar_url
          ),
          reviewer:assigned_reviewer (
            id,
            full_name,
            avatar_url
          ),
          sections:section_id (
            name
          )
        `)
        .eq('engagement_id', engagementId)
        .in('workflow_status', ['pending_review', 'in_review', 'changes_requested', 'approved']);

      if (error) throw error;

      return data.map((proc: any) => ({
        id: proc.id,
        type: 'procedure' as ReviewItemType,
        title: proc.name,
        reference: proc.procedure_reference,
        status: proc.workflow_status as ReviewStatus,
        preparer: proc.assignee,
        reviewer: proc.reviewer,
        section: proc.sections?.name || null,
        priority: 'medium' as const,
        submittedAt: proc.updated_at,
        dueDate: null,
        noteCount: 0,
        unresolvedNotes: 0,
      }));
    },
    enabled: !!engagementId,
    staleTime: 30 * 1000,
  });

  // Combine all items
  const allItems = useMemo(() => {
    return [...(workpapers || []), ...(procedures || [])];
  }, [workpapers, procedures]);

  // Filter items based on current tab and filters
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Tab filter
    if (activeTab === 'my-queue') {
      items = items.filter(
        (item) => item.reviewer?.id === user?.id && item.status !== 'approved'
      );
    } else if (activeTab === 'completed') {
      items = items.filter((item) => item.status === 'approved');
    }

    // Type filter
    if (typeFilter !== 'all') {
      items = items.filter((item) => item.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.reference?.toLowerCase().includes(query) ||
          item.section?.toLowerCase().includes(query)
      );
    }

    // Sort by priority and date
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [allItems, activeTab, typeFilter, statusFilter, searchQuery, user?.id]);

  // Stats
  const stats = useMemo(() => {
    const myQueue = allItems.filter(
      (item) => item.reviewer?.id === user?.id && item.status !== 'approved'
    );

    return {
      myQueue: myQueue.length,
      pending: allItems.filter((item) => item.status === 'pending_review').length,
      inReview: allItems.filter((item) => item.status === 'in_review').length,
      changesRequested: allItems.filter((item) => item.status === 'changes_requested').length,
      approved: allItems.filter((item) => item.status === 'approved').length,
      urgent: allItems.filter((item) => item.priority === 'high').length,
    };
  }, [allItems, user?.id]);

  const isLoading = workpapersLoading || proceduresLoading;

  const handleItemClick = (item: ReviewItem) => {
    if (item.type === 'workpaper') {
      navigate(`/engagements/${engagementId}/workpapers/${item.id}`);
    } else {
      navigate(`/engagements/${engagementId}/procedures/${item.id}`);
    }
  };

  if (!engagementId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No engagement selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground">
            Workpapers and procedures awaiting review
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.myQueue}</p>
                <p className="text-xs text-muted-foreground">My Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inReview}</p>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.changesRequested}</p>
                <p className="text-xs text-muted-foreground">Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="my-queue" className="gap-2">
                  <User className="h-4 w-4" />
                  My Queue
                  {stats.myQueue > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {stats.myQueue}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workpaper">Workpapers</SelectItem>
                  <SelectItem value="procedure">Procedures</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No items to review</h3>
              <p className="text-muted-foreground">
                {activeTab === 'my-queue'
                  ? "You're all caught up! No items are waiting for your review."
                  : 'No items match the current filters.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Preparer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const TypeIcon = typeConfig[item.type].icon;
                    const StatusIcon = statusConfig[item.status].icon;

                    return (
                      <TableRow
                        key={`${item.type}-${item.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleItemClick(item)}
                      >
                        <TableCell>
                          <div
                            className={cn(
                              'p-2 rounded',
                              item.type === 'workpaper'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-purple-100 text-purple-600'
                            )}
                          >
                            <TypeIcon className="h-4 w-4" />
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.priority === 'high' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <div className="font-medium">{item.title}</div>
                              {item.reference && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {item.reference}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-muted-foreground">
                            {item.section || '-'}
                          </span>
                        </TableCell>

                        <TableCell>
                          {item.preparer ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={item.preparer.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {item.preparer.full_name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {item.preparer.full_name || 'Unknown'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'gap-1',
                              statusConfig[item.status].color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[item.status].label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {item.noteCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={item.unresolvedNotes > 0 ? 'destructive' : 'secondary'}
                              >
                                {item.unresolvedNotes > 0
                                  ? `${item.unresolvedNotes} unresolved`
                                  : `${item.noteCount} notes`}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(item.submittedAt), {
                              addSuffix: true,
                            })}
                          </div>
                          {item.dueDate && (
                            <div
                              className={cn(
                                'text-xs',
                                new Date(item.dueDate) < new Date()
                                  ? 'text-red-500'
                                  : 'text-muted-foreground'
                              )}
                            >
                              Due {format(new Date(item.dueDate), 'MMM d')}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleItemClick(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleItemClick(item)}>
                                <Pen className="h-4 w-4 mr-2" />
                                Start Review
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to determine priority based on due date
function getDuePriority(dueDate: string | null): 'high' | 'medium' | 'low' {
  if (!dueDate) return 'low';

  const due = new Date(dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'high'; // Overdue
  if (daysUntilDue <= 2) return 'high'; // Due within 2 days
  if (daysUntilDue <= 7) return 'medium'; // Due within a week
  return 'low';
}

export default ReviewQueuePage;
