import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { AlertCircle, CheckCircle2, Clock, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { ProcedureReviewPanel } from '@/components/audit/programs/ProcedureReviewPanel';

export default function ProcedureReviewQueue() {
  const { procedures, isLoading } = useEngagementProcedures();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEngagement, setFilterEngagement] = useState('all');
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);

  // Filter procedures in_review status
  const reviewProcedures = procedures?.filter(p => p.status === 'in_review') || [];

  // Apply filters
  const filteredProcedures = reviewProcedures.filter(procedure => {
    const matchesSearch = procedure.procedure_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.engagement_programs?.program_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEngagement = filterEngagement === 'all' || procedure.engagement_program_id === filterEngagement;
    return matchesSearch && matchesEngagement;
  });

  // Get unique engagements for filter
  const engagements = Array.from(
    new Set(reviewProcedures.map(p => p.engagement_program_id))
  ).map(id => {
    const proc = reviewProcedures.find(p => p.engagement_program_id === id);
    return {
      id,
      code: proc?.engagement_programs?.program_name || 'Unknown'
    };
  });

  const getPriorityIndicator = (procedure: any) => {
    const isOverdue = procedure.due_date && new Date(procedure.due_date) < new Date();
    
    if (isOverdue) return { level: 'high', label: 'Overdue' };
    return { level: 'normal', label: 'Normal' };
  };

  const handleReview = (procedure: any) => {
    setSelectedProcedure(procedure);
    setReviewPanelOpen(true);
  };

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        {/* Filter skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </CardContent>
        </Card>
        {/* Queue skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Procedure Review Queue</h1>
        <p className="text-muted-foreground">
          Review and approve procedures submitted by your team
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Reviews</CardDescription>
            <CardTitle className="text-3xl">{reviewProcedures.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="text-3xl">
              {reviewProcedures.filter(p => {
                const priority = getPriorityIndicator(p);
                return priority.level === 'critical' || priority.level === 'high';
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Days Pending</CardDescription>
            <CardTitle className="text-3xl">
              {reviewProcedures.length > 0 
                ? Math.round(reviewProcedures.reduce((acc, p) => {
                    if (!p.completed_at) return acc;
                    const days = (Date.now() - new Date(p.completed_at).getTime()) / (1000 * 60 * 60 * 24);
                    return acc + days;
                  }, 0) / reviewProcedures.length)
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-3xl">
              {reviewProcedures.filter(p => 
                p.due_date && new Date(p.due_date) < new Date()
              ).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search procedures or engagement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterEngagement} onValueChange={setFilterEngagement}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Engagements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engagements</SelectItem>
                {engagements.map(eng => (
                  <SelectItem key={eng.id} value={eng.id}>
                    {eng.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Review Queue */}
      <div className="space-y-4">
        {filteredProcedures.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground mb-4">
                No procedures awaiting your review
              </p>
              <Button variant="outline" onClick={() => navigate('/my-procedures')}>
                View My Procedures
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProcedures.map((procedure) => {
            const priority = getPriorityIndicator(procedure);
            const isOverdue = procedure.due_date && new Date(procedure.due_date) < new Date();

            return (
              <Card key={procedure.id} className={priority.level === 'critical' ? 'border-destructive' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{procedure.procedure_name}</h3>
                        {priority.level !== 'normal' && (
                          <Badge variant={priority.level === 'critical' ? 'destructive' : 'default'}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {priority.label}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            Assigned to: {procedure.assigned_to || 'Unassigned'}
                          </span>
                        </div>
                        {procedure.completed_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Submitted: {format(new Date(procedure.completed_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                        {procedure.due_date && (
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                            <Clock className="h-4 w-4" />
                            <span>
                              Due: {format(new Date(procedure.due_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">Program: </span>
                        <span className="font-medium">
                          {procedure.engagement_programs?.program_name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <Button onClick={() => handleReview(procedure)}>
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Review Panel */}
      {selectedProcedure && (
        <ProcedureReviewPanel
          open={reviewPanelOpen}
          onOpenChange={setReviewPanelOpen}
          procedure={selectedProcedure}
        />
      )}
    </div>
  );
}
