import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  FileText,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function QualityControlDashboard() {
  const navigate = useNavigate();
  const { procedures, isLoading } = useEngagementProcedures();
  const [timeFilter, setTimeFilter] = useState('30');

  // Calculate quality metrics
  const completedProcedures = procedures?.filter(p => p.status === 'completed') || [];
  const inReviewProcedures = procedures?.filter(p => p.status === 'in_review') || [];
  const revisionRequested = procedures?.filter(p => p.status === 'revision_requested') || [];
  
  // Procedures with time variance (took longer than estimated)
  const proceduresWithVariance = completedProcedures.filter(p => {
    if (!p.started_at || !p.completed_at || !p.estimated_hours) return false;
    const actualHours = (new Date(p.completed_at).getTime() - new Date(p.started_at).getTime()) / (1000 * 60 * 60);
    return actualHours > p.estimated_hours * 1.2; // 20% over estimate
  });

  // Outstanding sign-offs (in review for more than 48 hours)
  const outstandingSignoffs = inReviewProcedures.filter(p => {
    if (!p.completed_at) return false;
    const hoursSinceSubmission = (Date.now() - new Date(p.completed_at).getTime()) / (1000 * 60 * 60);
    return hoursSinceSubmission > 48;
  });

  // Calculate quality score (percentage of procedures completed without revision)
  const qualityScore = completedProcedures.length > 0
    ? Math.round(((completedProcedures.length - revisionRequested.length) / completedProcedures.length) * 100)
    : 0;

  // Team performance scores (grouped by assignee)
  const teamPerformance = procedures?.reduce((acc: any[], proc) => {
    if (!proc.assigned_to || proc.status !== 'completed') return acc;
    
    const existing = acc.find(t => t.userId === proc.assigned_to);
    
    // Check if this user has any revisions requested
    const userRevisions = procedures?.filter(p => 
      p.assigned_to === proc.assigned_to && p.status === 'revision_requested'
    ).length || 0;
    
    if (existing) {
      existing.completed += 1;
      existing.revisions = userRevisions;
      existing.score = Math.round(((existing.completed - existing.revisions) / existing.completed) * 100);
    } else {
      acc.push({
        userId: proc.assigned_to,
        name: 'Team Member', // Would come from profiles in real data
        completed: 1,
        revisions: userRevisions,
        score: userRevisions > 0 ? Math.round(((1 - userRevisions) / 1) * 100) : 100
      });
    }
    return acc;
  }, []).sort((a, b) => b.score - a.score) || [];

  // High-risk procedures
  const highRiskInReview = inReviewProcedures.filter(p => 
    p.procedure_name?.toLowerCase().includes('critical') ||
    p.procedure_name?.toLowerCase().includes('high risk')
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading quality metrics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quality Control Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor quality metrics and identify areas requiring attention
          </p>
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quality Score Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Quality Score
            </CardDescription>
            <CardTitle className="text-4xl">
              {qualityScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {qualityScore >= 90 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Excellent</span>
                </>
              ) : qualityScore >= 75 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-500">Good</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Needs Attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Reviews</CardDescription>
            <CardTitle className="text-4xl">{outstandingSignoffs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {outstandingSignoffs.length > 5 ? 'High volume' : 'Normal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revision Requests</CardDescription>
            <CardTitle className="text-4xl">{revisionRequested.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {revisionRequested.length > 0 ? 'Requires follow-up' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Time Variances</CardDescription>
            <CardTitle className="text-4xl">{proceduresWithVariance.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Over 20% budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High-Risk Pending</CardDescription>
            <CardTitle className="text-4xl">{highRiskInReview.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Critical procedures
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exceptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exceptions">Exceptions & Red Flags</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Sign-offs</TabsTrigger>
          <TabsTrigger value="variance">Time Variance</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        {/* Exceptions & Red Flags */}
        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                High-Risk Procedures Awaiting Review
              </CardTitle>
              <CardDescription>
                Critical procedures that require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskInReview.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No high-risk procedures pending review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highRiskInReview.map((proc) => (
                    <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{proc.procedure_name}</h4>
                          <Badge variant="destructive">High Priority</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Program: {proc.engagement_programs?.program_name || 'N/A'}
                        </p>
                        {proc.completed_at && (
                          <p className="text-sm text-muted-foreground">
                            Submitted: {format(new Date(proc.completed_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                      <Button onClick={() => navigate('/audit/review-queue')}>
                        Review Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Procedures Requiring Revision
              </CardTitle>
              <CardDescription>
                Procedures that need to be reworked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revisionRequested.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No procedures requiring revision</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {revisionRequested.map((proc) => (
                    <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{proc.procedure_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {proc.assigned_to || 'Unassigned'}
                        </p>
                        {proc.review_notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Feedback: {proc.review_notes}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Revision Needed</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding Sign-offs */}
        <TabsContent value="outstanding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Procedures Pending Review (48+ Hours)
              </CardTitle>
              <CardDescription>
                Procedures awaiting sign-off for more than 2 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {outstandingSignoffs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No outstanding sign-offs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outstandingSignoffs.map((proc) => {
                    const hoursPending = proc.completed_at 
                      ? Math.round((Date.now() - new Date(proc.completed_at).getTime()) / (1000 * 60 * 60))
                      : 0;
                    
                    return (
                      <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{proc.procedure_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Program: {proc.engagement_programs?.program_name || 'N/A'}
                          </p>
                          <p className="text-sm font-medium text-destructive">
                            Pending for {hoursPending} hours
                          </p>
                        </div>
                        <Button onClick={() => navigate('/audit/review-queue')}>
                          Review Now
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Variance Analysis */}
        <TabsContent value="variance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Procedures Exceeding Time Budget
              </CardTitle>
              <CardDescription>
                Procedures that took 20%+ longer than estimated
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proceduresWithVariance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>All procedures within time budget</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proceduresWithVariance.map((proc) => {
                    if (!proc.started_at || !proc.completed_at || !proc.estimated_hours) return null;
                    
                    const actualHours = (new Date(proc.completed_at).getTime() - new Date(proc.started_at).getTime()) / (1000 * 60 * 60);
                    const variance = ((actualHours - proc.estimated_hours) / proc.estimated_hours) * 100;
                    
                    return (
                      <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{proc.procedure_name}</h4>
                          <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Estimated: {proc.estimated_hours}h
                            </span>
                            <span className="text-muted-foreground">
                              Actual: {actualHours.toFixed(1)}h
                            </span>
                            <span className="font-medium text-destructive">
                              +{variance.toFixed(0)}% over
                            </span>
                          </div>
                        </div>
                        <Badge variant="destructive">Over Budget</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Quality Scores
              </CardTitle>
              <CardDescription>
                Individual performance based on completion rate and revision requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>No completed procedures to analyze</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamPerformance.map((member, index) => (
                    <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                          #{index + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold">{member.name}</h4>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Completed: {member.completed}</span>
                            <span>Revisions: {member.revisions}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{member.score}%</div>
                          <div className="text-xs text-muted-foreground">Quality Score</div>
                        </div>
                        {member.score >= 90 ? (
                          <Award className="h-6 w-6 text-green-500" />
                        ) : member.score >= 75 ? (
                          <CheckCircle2 className="h-6 w-6 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
