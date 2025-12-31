/**
 * ==================================================================
 * AUDIT REVIEW TAB
 * ==================================================================
 * Review and closeout tools including findings, adjustments,
 * review notes, independence, and subsequent events per System
 * Design Document Section 7.3.4
 *
 * Updated to include professional standards components:
 * - Related Parties (AU-C 550)
 * - Management Representations (AU-C 580)
 * - TCWG Communications (AU-C 260/265)
 * ==================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  DollarSign,
  FileText,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Users,
  MessageSquare,
} from 'lucide-react';
import {
  useAuditAdjustments,
  useSummaryOfUncorrectedMisstatements,
  useIndependenceDeclarations,
  useSubsequentEvents,
} from '@/hooks/useAuditTools';
import { useAuth } from '@/contexts/AuthContext';

// Import professional standards components
import { RelatedPartiesManager } from '@/components/audit-tools/RelatedPartiesManager';
import { ManagementRepresentations } from '@/components/audit-tools/ManagementRepresentations';
import { TCWGCommunications } from '@/components/audit-tools/TCWGCommunications';

interface AuditReviewTabProps {
  engagementId: string;
  engagement: any;
}

export function AuditReviewTab({ engagementId, engagement }: AuditReviewTabProps) {
  return (
    <div className="p-6">
      <Tabs defaultValue="findings" className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-6">
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="notes">Review Notes</TabsTrigger>
          <TabsTrigger value="independence">Independence</TabsTrigger>
          <TabsTrigger value="events">Subsequent Events</TabsTrigger>
          <TabsTrigger value="related-parties">Related Parties</TabsTrigger>
          <TabsTrigger value="representations">Rep Letter</TabsTrigger>
          <TabsTrigger value="tcwg">TCWG</TabsTrigger>
        </TabsList>

        <TabsContent value="findings">
          <FindingsRegisterCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="adjustments">
          <AdjustmentsTrackerCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="notes">
          <ReviewNotesCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="independence">
          <IndependenceCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="events">
          <SubsequentEventsCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="related-parties">
          <RelatedPartiesManager engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="representations">
          <ManagementRepresentations
            engagementId={engagementId}
            clientName={engagement?.client?.name}
            periodEndDate={engagement?.period_end_date}
          />
        </TabsContent>

        <TabsContent value="tcwg">
          <TCWGCommunications engagementId={engagementId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Findings Register Component
 * All audit findings with status tracking
 */
function FindingsRegisterCard({ engagementId }: { engagementId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Findings Register
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          All audit findings with severity and resolution status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">2</div>
            <div className="text-xs text-red-700">Critical</div>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
            <div className="text-xl font-bold text-orange-600">5</div>
            <div className="text-xs text-orange-700">High</div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-xl font-bold text-yellow-600">8</div>
            <div className="text-xs text-yellow-700">Medium</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">3</div>
            <div className="text-xs text-blue-700">Low</div>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-3">
          {[
            {
              id: 'F-001',
              title: 'Material Weakness in Revenue Recognition Controls',
              severity: 'Critical',
              status: 'Open',
              account: 'Revenue',
              impact: 'High',
            },
            {
              id: 'F-002',
              title: 'Inadequate Segregation of Duties in Cash Receipts',
              severity: 'High',
              status: 'In Progress',
              account: 'Cash',
              impact: 'Medium',
            },
            {
              id: 'F-003',
              title: 'Inventory Count Discrepancies',
              severity: 'Medium',
              status: 'Resolved',
              account: 'Inventory',
              impact: 'Low',
            },
          ].map((finding) => (
            <div key={finding.id} className="p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{finding.id}</code>
                    <Badge
                      variant={
                        finding.severity === 'Critical'
                          ? 'destructive'
                          : finding.severity === 'High'
                          ? 'destructive'
                          : finding.severity === 'Medium'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {finding.severity}
                    </Badge>
                    <Badge variant="outline">{finding.account}</Badge>
                  </div>
                  <div className="font-medium">{finding.title}</div>
                </div>
                <Badge
                  variant={
                    finding.status === 'Resolved'
                      ? 'default'
                      : finding.status === 'In Progress'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {finding.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Impact: {finding.impact} • Identified during fieldwork
              </div>
            </div>
          ))}
        </div>

        <Button>Add Finding</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Adjustments Tracker Component
 * Per AU-C 450 - SAJ, PJE, SUM tracking
 */
function AdjustmentsTrackerCard({ engagementId }: { engagementId: string }) {
  const { data: adjustments, isLoading } = useAuditAdjustments(engagementId);
  const { data: sum } = useSummaryOfUncorrectedMisstatements(engagementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Audit Adjustments Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Summary of Adjusting Journal Entries (SAJ), Passed Journal Entries (PJE), and Summary of
          Uncorrected Misstatements (SUM)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SAJ Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Summary of Adjusting Journal Entries (SAJ)
            </h4>
            <Button size="sm" variant="outline">
              Add Adjustment
            </Button>
          </div>

          <div className="space-y-3">
            {[
              {
                number: 'AJE-001',
                description: 'Accrued Expenses Understatement',
                debit: 'Expense',
                debitAmt: 15000,
                credit: 'Accrued Liabilities',
                creditAmt: 15000,
                impact: -15000,
                status: 'Posted',
              },
              {
                number: 'AJE-002',
                description: 'Prepaid Insurance Overstatement',
                debit: 'Expense',
                debitAmt: 8000,
                credit: 'Prepaid Assets',
                creditAmt: 8000,
                impact: -8000,
                status: 'Posted',
              },
            ].map((aje) => (
              <div key={aje.number} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {aje.number}
                    </code>
                    <span className="font-medium">{aje.description}</span>
                  </div>
                  <Badge className="bg-green-600">{aje.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <span className="text-muted-foreground">Dr.</span> {aje.debit}{' '}
                    <span className="font-medium">${aje.debitAmt.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cr.</span> {aje.credit}{' '}
                    <span className="font-medium">${aje.creditAmt.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Impact on Net Income:</span>{' '}
                  <span className="font-medium text-red-600 flex items-center gap-1 inline-flex">
                    <TrendingDown className="h-3 w-3" />$
                    {Math.abs(aje.impact).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="font-medium">Total SAJ Impact: ↓ Net Income $23,000</div>
          </div>
        </div>

        {/* PJE/SUM Section */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <XCircle className="h-4 w-4 text-orange-600" />
            Summary of Uncorrected Misstatements (SUM)
          </h4>

          <div className="space-y-3">
            {[
              {
                number: 'PJE-001',
                description: 'Inventory Valuation Difference',
                debit: 'COGS',
                debitAmt: 3500,
                credit: 'Inventory',
                creditAmt: 3500,
                impact: -3500,
                status: 'Passed',
              },
            ].map((pje) => (
              <div key={pje.number} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {pje.number}
                    </code>
                    <span className="font-medium">{pje.description}</span>
                  </div>
                  <Badge variant="secondary">{pje.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <span className="text-muted-foreground">Dr.</span> {pje.debit}{' '}
                    <span className="font-medium">${pje.debitAmt.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cr.</span> {pje.credit}{' '}
                    <span className="font-medium">${pje.creditAmt.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Impact on Net Income:</span>{' '}
                  <span className="font-medium text-red-600 flex items-center gap-1 inline-flex">
                    <TrendingDown className="h-3 w-3" />$
                    {Math.abs(pje.impact).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Materiality Assessment */}
          <div className="mt-3 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <div className="text-sm text-muted-foreground">Total Uncorrected</div>
                <div className="text-2xl font-bold text-orange-600">$3,500</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">% of Materiality</div>
                <div className="text-2xl font-bold text-orange-600">0.7%</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">
                Below Clearly Trivial Threshold ($25,000)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Review Notes Component
 * Workpaper review dashboard
 */
function ReviewNotesCard({ engagementId }: { engagementId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Workpaper Review Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Review notes and sign-off status by workpaper section
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Progress */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">18</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">7</div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">3</div>
            <div className="text-sm text-muted-foreground">Not Reviewed</div>
          </div>
        </div>

        {/* Workpapers */}
        <div className="space-y-3">
          {[
            {
              section: 'A - Cash',
              preparer: 'Alice Williams',
              reviewer: 'Jane Doe',
              status: 'Approved',
              notes: 0,
            },
            {
              section: 'B - Accounts Receivable',
              preparer: 'Bob Johnson',
              reviewer: 'Jane Doe',
              status: 'Review Notes',
              notes: 3,
            },
            {
              section: 'C - Inventory',
              preparer: 'Bob Johnson',
              reviewer: 'Jane Doe',
              status: 'In Review',
              notes: 1,
            },
            {
              section: 'R - Revenue',
              preparer: 'Jane Doe',
              reviewer: 'John Smith',
              status: 'Approved',
              notes: 0,
            },
          ].map((wp, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{wp.section}</div>
                <Badge
                  variant={
                    wp.status === 'Approved'
                      ? 'default'
                      : wp.status === 'Review Notes'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {wp.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>Preparer: {wp.preparer}</div>
                <div>Reviewer: {wp.reviewer}</div>
              </div>
              {wp.notes > 0 && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2 text-orange-600" />
                  {wp.notes} review note{wp.notes > 1 ? 's' : ''} pending resolution
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Independence Declarations Component
 * Per AICPA Code of Professional Conduct
 */
function IndependenceCard({ engagementId }: { engagementId: string }) {
  const { user } = useAuth();
  const { data: declarations, isLoading } = useIndependenceDeclarations(
    user?.id || '',
    engagementId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Independence Declarations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Team independence attestations per AICPA Code of Professional Conduct
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Declaration Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-green-700">Compliant</div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">2</div>
            <div className="text-sm text-yellow-700">Pending Review</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-sm text-red-700">Conflicts</div>
          </div>
        </div>

        {/* Team Members Independence Status */}
        <div>
          <h4 className="font-medium mb-3">Team Independence Status</h4>
          <div className="space-y-3">
            {[
              {
                name: 'John Smith',
                role: 'Partner',
                status: 'Compliant',
                date: '2024-01-15',
                conflicts: false,
              },
              {
                name: 'Jane Doe',
                role: 'Manager',
                status: 'Compliant',
                date: '2024-01-15',
                conflicts: false,
              },
              {
                name: 'Bob Johnson',
                role: 'Senior',
                status: 'Pending Review',
                date: '2024-01-20',
                conflicts: false,
              },
              {
                name: 'Alice Williams',
                role: 'Staff',
                status: 'Compliant',
                date: '2024-01-18',
                conflicts: false,
              },
            ].map((member, idx) => (
              <div key={idx} className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {member.role} • Declared: {new Date(member.date).toLocaleDateString()}
                  </div>
                </div>
                <Badge
                  variant={
                    member.status === 'Compliant'
                      ? 'default'
                      : member.status === 'Pending Review'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {member.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Categories */}
        <div>
          <h4 className="font-medium mb-3">Independence Threats Assessed</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { threat: 'Self-Interest', checked: true },
              { threat: 'Self-Review', checked: true },
              { threat: 'Advocacy', checked: true },
              { threat: 'Familiarity', checked: true },
              { threat: 'Intimidation', checked: true },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{item.threat}</span>
              </div>
            ))}
          </div>
        </div>

        <Button>Submit Independence Declaration</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Subsequent Events Component
 * Per AU-C 560 - Type I and Type II events
 */
function SubsequentEventsCard({ engagementId }: { engagementId: string }) {
  const { data: events, isLoading } = useSubsequentEvents(engagementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Subsequent Events Log
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Events occurring between year-end and report date per AU-C 560
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Type Legend */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium mb-1">Type I - Adjusting Events</div>
            <div className="text-sm text-muted-foreground">
              Provide evidence of conditions that existed at year-end (require adjustment)
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Type II - Disclosure Events</div>
            <div className="text-sm text-muted-foreground">
              Provide evidence of conditions that arose after year-end (require disclosure)
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {[
            {
              date: '2024-01-25',
              type: 'Type I',
              description: 'Customer bankruptcy filing - receivable written off',
              impact: 'Adjusted AR by $12,000',
              status: 'Adjustment Posted',
            },
            {
              date: '2024-02-05',
              type: 'Type II',
              description: 'New credit facility obtained for $500,000',
              impact: 'Disclosure in Note 15',
              status: 'Disclosed',
            },
            {
              date: '2024-02-10',
              type: 'Type II',
              description: 'Major customer contract awarded',
              impact: 'Disclosure in Note 16',
              status: 'Under Review',
            },
          ].map((event, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={event.type === 'Type I' ? 'destructive' : 'secondary'}>
                      {event.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-medium">{event.description}</div>
                  <div className="text-sm text-muted-foreground mt-1">{event.impact}</div>
                </div>
                <Badge variant={event.status === 'Under Review' ? 'outline' : 'default'}>
                  {event.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Review Date */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Subsequent Event Review Period</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Year End: December 31, 2023 → Report Date: February 15, 2024
          </div>
        </div>

        <Button>Log New Event</Button>
      </CardContent>
    </Card>
  );
}
