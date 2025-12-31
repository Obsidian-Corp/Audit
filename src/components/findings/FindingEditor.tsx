/**
 * FindingEditor Component
 * Ticket: UI-007
 *
 * Comprehensive form for creating and editing audit findings.
 * Includes all 5 C's of findings (Condition, Criteria, Cause, Consequence/Effect, Correction)
 * with source linking and management response tracking.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Finding,
  FindingSeverity,
  FindingStatus,
  RemediationStatus,
  useFindingManagement,
} from '@/hooks/useFindingManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  Eye,
  FileText,
  ClipboardList,
  Link2,
  MessageSquare,
  Calendar,
  User,
  Save,
  X,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Severity configuration
const severityConfig: Record<
  FindingSeverity,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  critical: {
    icon: AlertOctagon,
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  medium: {
    icon: AlertCircle,
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  low: {
    icon: Info,
    label: 'Low',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  observation: {
    icon: Eye,
    label: 'Observation',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

// Status configuration
const statusConfig: Record<FindingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  identified: { label: 'Identified', variant: 'destructive' },
  open: { label: 'Open', variant: 'destructive' },
  discussed: { label: 'Discussed', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'default' },
  closed: { label: 'Closed', variant: 'outline' },
};

// Remediation status configuration
const remediationStatusConfig: Record<RemediationStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  implemented: { label: 'Implemented', color: 'text-purple-600' },
  verified: { label: 'Verified', color: 'text-green-600' },
  not_remediated: { label: 'Not Remediated', color: 'text-red-600' },
};

// Form schema
const findingFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'observation']),
  status: z.enum(['identified', 'open', 'discussed', 'resolved', 'closed']).optional(),
  description: z.string().optional(),
  category: z.string().optional(),

  // 5 C's
  criteria: z.string().optional(),
  condition: z.string().optional(),
  cause: z.string().optional(),
  effect: z.string().optional(),
  recommendation: z.string().optional(),

  // Source linking
  sourceProcedureId: z.string().optional(),
  sourceWorkpaperId: z.string().optional(),

  // Repeat finding
  isRepeatFinding: z.boolean().default(false),
  priorYearFindingId: z.string().optional(),

  // Remediation
  remediationDeadline: z.string().optional(),
  remediationStatus: z.enum(['pending', 'in_progress', 'implemented', 'verified', 'not_remediated']).optional(),

  // Assignment
  ownerId: z.string().optional(),
});

type FindingFormData = z.infer<typeof findingFormSchema>;

interface FindingEditorProps {
  /** Engagement ID for creating new findings */
  engagementId: string;
  /** Existing finding to edit (undefined for new finding) */
  finding?: Finding;
  /** Open state for dialog mode */
  open?: boolean;
  /** Close callback for dialog mode */
  onClose?: () => void;
  /** Success callback after save */
  onSuccess?: (finding: Finding) => void;
  /** Available procedures for linking */
  procedures?: Array<{ id: string; name: string; procedure_reference?: string }>;
  /** Available workpapers for linking */
  workpapers?: Array<{ id: string; title: string; workpaper_reference?: string }>;
  /** Available team members for assignment */
  teamMembers?: Array<{ id: string; full_name: string; email: string; avatar_url?: string }>;
  /** Prior year findings for repeat finding linking */
  priorYearFindings?: Array<{ id: string; title: string; finding_reference?: string }>;
  /** Compact mode for embedded use */
  compact?: boolean;
}

export function FindingEditor({
  engagementId,
  finding,
  open = true,
  onClose,
  onSuccess,
  procedures = [],
  workpapers = [],
  teamMembers = [],
  priorYearFindings = [],
  compact = false,
}: FindingEditorProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fivecs: true,
    source: false,
    remediation: false,
  });

  const isEditing = !!finding;

  const {
    createFindingAsync,
    updateFindingAsync,
    deleteFinding,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFindingManagement(engagementId);

  const form = useForm<FindingFormData>({
    resolver: zodResolver(findingFormSchema),
    defaultValues: {
      title: finding?.title || '',
      severity: finding?.severity || 'medium',
      status: finding?.status || 'identified',
      description: finding?.description || '',
      category: finding?.category || '',
      criteria: finding?.criteria || '',
      condition: finding?.condition || '',
      cause: finding?.cause || '',
      effect: finding?.effect || '',
      recommendation: finding?.recommendation || '',
      sourceProcedureId: finding?.source_procedure_id || '',
      sourceWorkpaperId: finding?.source_workpaper_id || '',
      isRepeatFinding: finding?.is_repeat_finding || false,
      priorYearFindingId: finding?.prior_year_finding_id || '',
      remediationDeadline: finding?.remediation_deadline?.split('T')[0] || '',
      remediationStatus: finding?.remediation_status || 'pending',
      ownerId: finding?.owner_id || '',
    },
  });

  // Reset form when finding changes
  useEffect(() => {
    if (finding) {
      form.reset({
        title: finding.title || '',
        severity: finding.severity || 'medium',
        status: finding.status || 'identified',
        description: finding.description || '',
        category: finding.category || '',
        criteria: finding.criteria || '',
        condition: finding.condition || '',
        cause: finding.cause || '',
        effect: finding.effect || '',
        recommendation: finding.recommendation || '',
        sourceProcedureId: finding.source_procedure_id || '',
        sourceWorkpaperId: finding.source_workpaper_id || '',
        isRepeatFinding: finding.is_repeat_finding || false,
        priorYearFindingId: finding.prior_year_finding_id || '',
        remediationDeadline: finding.remediation_deadline?.split('T')[0] || '',
        remediationStatus: finding.remediation_status || 'pending',
        ownerId: finding.owner_id || '',
      });
    }
  }, [finding, form]);

  const watchIsRepeatFinding = form.watch('isRepeatFinding');
  const watchSeverity = form.watch('severity');

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const onSubmit = async (data: FindingFormData) => {
    try {
      let result: Finding;

      if (isEditing && finding) {
        result = await updateFindingAsync({
          findingId: finding.id,
          updates: {
            title: data.title,
            severity: data.severity,
            status: data.status,
            description: data.description,
            category: data.category,
            criteria: data.criteria,
            condition: data.condition,
            cause: data.cause,
            effect: data.effect,
            recommendation: data.recommendation,
            owner_id: data.ownerId || undefined,
            remediation_deadline: data.remediationDeadline || undefined,
            remediation_status: data.remediationStatus,
          },
        });
      } else {
        result = await createFindingAsync({
          engagementId,
          title: data.title,
          severity: data.severity,
          description: data.description,
          criteria: data.criteria,
          condition: data.condition,
          cause: data.cause,
          effect: data.effect,
          recommendation: data.recommendation,
          sourceProcedureId: data.sourceProcedureId,
          sourceWorkpaperId: data.sourceWorkpaperId,
          category: data.category,
          ownerId: data.ownerId,
        });
      }

      onSuccess?.(result);
      onClose?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = () => {
    if (finding) {
      deleteFinding(finding.id);
      setShowDeleteConfirm(false);
      onClose?.();
    }
  };

  const SeverityIcon = severityConfig[watchSeverity].icon;

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header with severity indicator */}
        <div className={cn('p-4 rounded-lg', severityConfig[watchSeverity].bgColor)}>
          <div className="flex items-center gap-3">
            <SeverityIcon className={cn('h-6 w-6', severityConfig[watchSeverity].color)} />
            <div className="flex-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Finding title..."
                        className="text-lg font-medium bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {finding?.finding_reference && (
              <Badge variant="outline" className="font-mono">
                {finding.finding_reference}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn('grid w-full', compact ? 'grid-cols-2' : 'grid-cols-4')}>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="fivecs">5 C's</TabsTrigger>
            {!compact && <TabsTrigger value="source">Source</TabsTrigger>}
            {!compact && <TabsTrigger value="remediation">Remediation</TabsTrigger>}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(severityConfig).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn('h-4 w-4', config.color)} />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Internal Controls, Revenue Recognition" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief description of the finding..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {member.full_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            {member.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Repeat Finding Checkbox */}
            <FormField
              control={form.control}
              name="isRepeatFinding"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Repeat Finding</FormLabel>
                    <FormDescription>
                      This finding was identified in a prior audit period
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchIsRepeatFinding && priorYearFindings.length > 0 && (
              <FormField
                control={form.control}
                name="priorYearFindingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prior Year Finding</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Link to prior year finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorYearFindings.map((pf) => (
                          <SelectItem key={pf.id} value={pf.id}>
                            {pf.finding_reference && (
                              <span className="font-mono text-xs mr-2">
                                {pf.finding_reference}
                              </span>
                            )}
                            {pf.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </TabsContent>

          {/* 5 C's Tab */}
          <TabsContent value="fivecs" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Document the 5 C's of audit findings: Criteria, Condition, Cause, Consequence (Effect), and Correction (Recommendation).
            </div>

            <FormField
              control={form.control}
              name="criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    Criteria
                  </FormLabel>
                  <FormDescription>
                    What should be (the standard, policy, or regulation)
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Per ASC 606, revenue should be recognized when performance obligations are satisfied..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    Condition
                  </FormLabel>
                  <FormDescription>
                    What is (the current situation found during the audit)
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., During our testing, we identified 3 instances where revenue was recognized..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    Cause
                  </FormLabel>
                  <FormDescription>
                    Why the condition occurred
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., The accounting staff was not adequately trained on the new revenue recognition standard..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    Effect / Consequence
                  </FormLabel>
                  <FormDescription>
                    The impact or risk resulting from the condition
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Revenue may be materially misstated, potentially affecting financial statement users..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge variant="outline">5</Badge>
                    Recommendation / Correction
                  </FormLabel>
                  <FormDescription>
                    The suggested action to address the finding
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., We recommend implementing additional training for accounting staff and establishing a secondary review process..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Source Tab */}
          {!compact && (
            <TabsContent value="source" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Link this finding to the procedure or workpaper where it was identified.
              </div>

              <FormField
                control={form.control}
                name="sourceProcedureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Source Procedure
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select procedure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No procedure linked</SelectItem>
                        {procedures.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.procedure_reference && (
                              <span className="font-mono text-xs mr-2">
                                {proc.procedure_reference}
                              </span>
                            )}
                            {proc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The audit procedure during which this finding was identified
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceWorkpaperId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Source Workpaper
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select workpaper" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No workpaper linked</SelectItem>
                        {workpapers.map((wp) => (
                          <SelectItem key={wp.id} value={wp.id}>
                            {wp.workpaper_reference && (
                              <span className="font-mono text-xs mr-2">
                                {wp.workpaper_reference}
                              </span>
                            )}
                            {wp.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The workpaper documenting this finding
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display linked sources if editing */}
              {isEditing && (finding?.source_procedure || finding?.source_workpaper) && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Linked Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {finding.source_procedure && (
                      <div className="flex items-center gap-2 text-sm">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {finding.source_procedure.procedure_reference}
                        </span>
                        <span>{finding.source_procedure.name}</span>
                      </div>
                    )}
                    {finding.source_workpaper && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {finding.source_workpaper.workpaper_reference}
                        </span>
                        <span>{finding.source_workpaper.title}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Remediation Tab */}
          {!compact && (
            <TabsContent value="remediation" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Track remediation progress and management response.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="remediationDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Remediation Deadline
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remediationStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remediation Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(remediationStatusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className={config.color}>{config.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Management Response Display */}
              {isEditing && finding?.management_response && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Management Response
                    </CardTitle>
                    {finding.management_response_date && (
                      <CardDescription>
                        Submitted {format(new Date(finding.management_response_date), 'PPP')}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{finding.management_response}</p>
                  </CardContent>
                </Card>
              )}

              {/* Metadata display for existing findings */}
              {isEditing && finding && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Finding History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {finding.identifier_profile && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Identified by:</span>
                        <span>{finding.identifier_profile.full_name}</span>
                        {finding.identified_date && (
                          <span className="text-muted-foreground">
                            on {format(new Date(finding.identified_date), 'PP')}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(finding.created_at), 'PPpp')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last updated:</span>
                      <span>{format(new Date(finding.updated_at), 'PPpp')}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Finding' : 'Create Finding'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );

  // If onClose is provided, wrap in dialog
  if (onClose) {
    return (
      <>
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Finding' : 'New Finding'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update the finding details below.'
                  : 'Document a new audit finding with all relevant details.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {formContent}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Finding?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the finding
                {finding?.finding_reference && ` (${finding.finding_reference})`} and all
                associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Return standalone form
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Finding' : 'New Finding'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update the finding details below.'
            : 'Document a new audit finding with all relevant details.'}
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

export default FindingEditor;
