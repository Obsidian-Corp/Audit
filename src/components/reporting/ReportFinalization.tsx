/**
 * ==================================================================
 * REPORT FINALIZATION
 * ==================================================================
 * Report issuance workflow with partner sign-off
 * ==================================================================
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Download,
  Send,
  Lock,
  Shield,
  User,
  Calendar,
  FileText,
  Pen,
} from 'lucide-react';
import { format } from 'date-fns';
import { generateAuditReportPDF } from '@/lib/pdf-generation';

interface ReportFinalizationProps {
  engagementId: string;
  engagement: any;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  category: 'pre-issuance' | 'quality' | 'documentation' | 'approval';
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'completed'>[] = [
  // Pre-issuance
  { id: 'workpapers_complete', label: 'All workpapers completed and reviewed', description: 'Ensure all audit workpapers have been completed and reviewed', required: true, category: 'pre-issuance' },
  { id: 'adjustments_posted', label: 'All adjustments posted or waived', description: 'Confirm all proposed adjustments have been posted or formally waived', required: true, category: 'pre-issuance' },
  { id: 'review_notes_cleared', label: 'All review notes cleared', description: 'All review notes have been addressed and cleared', required: true, category: 'pre-issuance' },
  { id: 'subsequent_events', label: 'Subsequent events evaluated', description: 'Subsequent events through report date have been evaluated', required: true, category: 'pre-issuance' },

  // Quality
  { id: 'eqcr_complete', label: 'EQCR review completed', description: 'Engagement Quality Control Review has been completed if required', required: false, category: 'quality' },
  { id: 'independence_confirmed', label: 'Independence confirmed', description: 'Team independence has been confirmed through report date', required: true, category: 'quality' },
  { id: 'consultation_documented', label: 'Consultations documented', description: 'All technical consultations have been documented', required: false, category: 'quality' },

  // Documentation
  { id: 'rep_letter_obtained', label: 'Management representation letter obtained', description: 'Signed representation letter has been obtained', required: true, category: 'documentation' },
  { id: 'attorney_letters', label: 'Attorney letters received', description: 'Attorney confirmation letters have been received', required: false, category: 'documentation' },
  { id: 'going_concern', label: 'Going concern conclusion documented', description: 'Going concern evaluation and conclusion has been documented', required: true, category: 'documentation' },

  // Approval
  { id: 'manager_signoff', label: 'Manager sign-off obtained', description: 'Engagement manager has signed off on the engagement', required: true, category: 'approval' },
  { id: 'partner_signoff', label: 'Engagement partner sign-off', description: 'Engagement partner approval to issue the report', required: true, category: 'approval' },
];

export function ReportFinalization({ engagementId, engagement }: ReportFinalizationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((item) => ({ ...item, completed: false }))
  );
  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false);
  const [signoffComments, setSignoffComments] = useState('');
  const [signoffType, setSignoffType] = useState<'manager' | 'partner'>('manager');

  // Calculate completion stats
  const stats = useMemo(() => {
    const total = checklist.length;
    const completed = checklist.filter((i) => i.completed).length;
    const requiredTotal = checklist.filter((i) => i.required).length;
    const requiredCompleted = checklist.filter((i) => i.required && i.completed).length;
    const allRequiredComplete = requiredCompleted === requiredTotal;

    return {
      total,
      completed,
      requiredTotal,
      requiredCompleted,
      allRequiredComplete,
      percentComplete: Math.round((completed / total) * 100),
    };
  }, [checklist]);

  // Group checklist by category
  const groupedChecklist = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {
      'pre-issuance': [],
      quality: [],
      documentation: [],
      approval: [],
    };
    checklist.forEach((item) => {
      groups[item.category].push(item);
    });
    return groups;
  }, [checklist]);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // Sign-off mutation
  const signoffMutation = useMutation({
    mutationFn: async (type: 'manager' | 'partner') => {
      // Update the checklist item
      const itemId = type === 'manager' ? 'manager_signoff' : 'partner_signoff';
      setChecklist((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, completed: true } : item))
      );

      // In a real app, this would save to database
      // For demo, we just simulate the sign-off
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return { type, timestamp: new Date() };
    },
    onSuccess: (data) => {
      toast({
        title: `${data.type === 'partner' ? 'Partner' : 'Manager'} Sign-off Complete`,
        description: 'Sign-off has been recorded.',
      });
      setSignoffDialogOpen(false);
      setSignoffComments('');
    },
  });

  // Issue report mutation
  const issueReportMutation = useMutation({
    mutationFn: async () => {
      if (!stats.allRequiredComplete) {
        throw new Error('All required items must be completed before issuing the report');
      }

      // Generate the final report PDF
      const template = {
        title: "Independent Auditor's Report",
        addressee: `To the Board of Directors and Shareholders of ${engagement?.clients?.client_name || 'Client'}`,
        opinionParagraph: `We have audited the accompanying financial statements of ${engagement?.clients?.client_name || 'the Company'}, which comprise the balance sheet as of ${engagement?.period_end ? format(new Date(engagement.period_end), 'MMMM d, yyyy') : '[Period End]'}, and the related statements of income, comprehensive income, stockholders' equity, and cash flows for the year then ended, and the related notes to the financial statements.

In our opinion, the financial statements referred to above present fairly, in all material respects, the financial position of ${engagement?.clients?.client_name || 'the Company'} as of ${engagement?.period_end ? format(new Date(engagement.period_end), 'MMMM d, yyyy') : '[Period End]'}, and the results of its operations and its cash flows for the year then ended in accordance with accounting principles generally accepted in the United States of America.`,
        basisParagraph: `We conducted our audit in accordance with auditing standards generally accepted in the United States of America (GAAS). Our responsibilities under those standards are further described in the Auditor's Responsibilities for the Audit of the Financial Statements section of our report. We are required to be independent of ${engagement?.clients?.client_name || 'the Company'} and to meet our other ethical responsibilities in accordance with the relevant ethical requirements relating to our audit. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our audit opinion.`,
        responsibilitiesParagraphs: {
          management: `Management is responsible for the preparation and fair presentation of the financial statements in accordance with accounting principles generally accepted in the United States of America, and for the design, implementation, and maintenance of internal control relevant to the preparation and fair presentation of financial statements that are free from material misstatement, whether due to fraud or error.`,
          auditor: `Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance but is not absolute assurance and therefore is not a guarantee that an audit conducted in accordance with GAAS will always detect a material misstatement when it exists.`,
        },
        signature: {
          firmName: '[Firm Name]',
          partnerName: 'Engagement Partner',
          date: new Date(),
          city: 'City',
          state: 'State',
        },
      };

      const metadata = {
        documentType: 'audit_report' as const,
        engagementId: engagement?.id || '',
        clientName: engagement?.clients?.client_name || 'Client',
        periodEndDate: engagement?.period_end ? new Date(engagement.period_end) : new Date(),
        preparedBy: 'System',
        preparedDate: new Date(),
        version: 1,
      };

      const pdfDoc = generateAuditReportPDF(template, metadata);
      pdfDoc.download(`audit-report-${engagement?.audit_number || 'final'}.pdf`);

      // Update engagement status
      const { error } = await supabase
        .from('audits')
        .update({
          workflow_status: 'complete',
          report_issued_date: new Date().toISOString(),
        })
        .eq('id', engagementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      toast({
        title: 'Report Issued',
        description: 'The audit report has been finalized and issued.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'pre-issuance': 'Pre-Issuance Procedures',
      quality: 'Quality Control',
      documentation: 'Documentation',
      approval: 'Approvals',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pre-issuance':
        return <FileCheck className="h-5 w-5" />;
      case 'quality':
        return <Shield className="h-5 w-5" />;
      case 'documentation':
        return <FileText className="h-5 w-5" />;
      case 'approval':
        return <Pen className="h-5 w-5" />;
      default:
        return <FileCheck className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Report Finalization
          </CardTitle>
          <CardDescription>
            Complete all required steps before issuing the audit report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.percentComplete}%</p>
              <p className="text-sm text-muted-foreground">
                {stats.completed} of {stats.total} items complete
              </p>
            </div>
            <Badge variant={stats.allRequiredComplete ? 'default' : 'secondary'}>
              {stats.allRequiredComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready to Issue
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  {stats.requiredTotal - stats.requiredCompleted} required items remaining
                </>
              )}
            </Badge>
          </div>
          <Progress value={stats.percentComplete} className="h-2" />

          {!stats.allRequiredComplete && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Complete all required checklist items before the report can be issued.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      {Object.entries(groupedChecklist).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-3 rounded-lg border ${
                    item.completed ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={() => {
                      if (item.id === 'manager_signoff' || item.id === 'partner_signoff') {
                        setSignoffType(item.id === 'manager_signoff' ? 'manager' : 'partner');
                        setSignoffDialogOpen(true);
                      } else {
                        toggleItem(item.id);
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={item.id} className="font-medium cursor-pointer">
                        {item.label}
                      </Label>
                      {item.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : item.required ? (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Issue Report Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Issue Final Report</h3>
              <p className="text-sm text-muted-foreground">
                Generate and issue the final audit report
              </p>
            </div>
            <Button
              size="lg"
              disabled={!stats.allRequiredComplete || issueReportMutation.isPending}
              onClick={() => issueReportMutation.mutate()}
            >
              {issueReportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Issue Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign-off Dialog */}
      <Dialog open={signoffDialogOpen} onOpenChange={setSignoffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {signoffType === 'partner' ? 'Partner Sign-off' : 'Manager Sign-off'}
            </DialogTitle>
            <DialogDescription>
              By signing off, you confirm that you have reviewed the engagement and approve the issuance of the report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Confirmation Required</AlertTitle>
              <AlertDescription>
                This action will be logged in the engagement's audit trail and cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (optional)</Label>
              <Textarea
                id="comments"
                value={signoffComments}
                onChange={(e) => setSignoffComments(e.target.value)}
                placeholder="Add any comments for the sign-off..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Signing as: Current User</span>
              <Calendar className="h-4 w-4 ml-4" />
              <span>{format(new Date(), 'PPP')}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignoffDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => signoffMutation.mutate(signoffType)}
              disabled={signoffMutation.isPending}
            >
              {signoffMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirm Sign-off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportFinalization;
