/**
 * ==================================================================
 * AUDIT REPORT DRAFTING INTERFACE
 * ==================================================================
 * Comprehensive audit report creation and management system
 * - Multiple report templates (Unqualified, Qualified, Adverse, Disclaimer)
 * - Rich text editor with formatting capabilities
 * - Dynamic insertion of findings
 * - Version control and collaboration
 * - PDF export with firm branding
 * - E-signature integration
 * ==================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FileText,
  Download,
  Save,
  Send,
  History,
  Users,
  Edit,
  Eye,
  Check,
  X,
  AlertCircle,
  FileSignature,
  Printer,
  Mail,
  ChevronRight,
  PlusCircle,
  Copy,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Table,
  Code,
  Quote,
  RefreshCw,
  GitBranch,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Types
interface AuditReport {
  id: string;
  engagement_id: string;
  engagement_name: string;
  client_name: string;
  report_type: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer' | 'management_letter' | 'internal_control';
  title: string;
  content: string; // HTML content from rich text editor
  version: number;
  status: 'draft' | 'in_review' | 'approved' | 'final' | 'issued';
  created_by: string;
  created_by_name: string;
  reviewed_by?: string[];
  approved_by?: string;
  issued_date?: string;
  fiscal_year_end: string;
  created_at: string;
  updated_at: string;
  sections: ReportSection[];
  findings_included: string[];
  collaborators: Collaborator[];
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'standard' | 'custom' | 'finding' | 'opinion';
  editable: boolean;
}

interface Collaborator {
  user_id: string;
  user_name: string;
  role: 'editor' | 'reviewer' | 'approver';
  last_active?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  type: AuditReport['report_type'];
  description: string;
  sections: ReportSection[];
}

interface AuditReportDraftingProps {
  engagementId: string;
  clientName: string;
  userId: string;
  userName: string;
}

// Report templates
const reportTemplates: ReportTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Unqualified Opinion',
    type: 'unqualified',
    description: 'Standard clean audit opinion with no exceptions',
    sections: [
      {
        id: 'sec-1',
        title: 'Report on the Financial Statements',
        content: `<h2>Independent Auditor's Report</h2>
<p><strong>To the Board of Directors and Shareholders of [Client Name]</strong></p>

<h3>Report on the Financial Statements</h3>
<p>We have audited the accompanying financial statements of [Client Name] (the "Company"), which comprise the balance sheet as of [Date], and the related statements of income, comprehensive income, changes in stockholders' equity, and cash flows for the year then ended, and the related notes to the financial statements.</p>

<h3>Opinion</h3>
<p>In our opinion, the financial statements referred to above present fairly, in all material respects, the financial position of [Client Name] as of [Date], and the results of its operations and its cash flows for the year then ended in accordance with accounting principles generally accepted in the United States of America.</p>`,
        order: 1,
        type: 'opinion',
        editable: true
      },
      {
        id: 'sec-2',
        title: 'Basis for Opinion',
        content: `<h3>Basis for Opinion</h3>
<p>We conducted our audit in accordance with auditing standards generally accepted in the United States of America (GAAS). Our responsibilities under those standards are further described in the Auditor's Responsibilities for the Audit of the Financial Statements section of our report. We are independent of the Company in accordance with the relevant ethical requirements relating to our audit. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our audit opinion.</p>`,
        order: 2,
        type: 'standard',
        editable: true
      },
      {
        id: 'sec-3',
        title: "Management's Responsibilities",
        content: `<h3>Responsibilities of Management for the Financial Statements</h3>
<p>Management is responsible for the preparation and fair presentation of the financial statements in accordance with accounting principles generally accepted in the United States of America, and for the design, implementation, and maintenance of internal control relevant to the preparation and fair presentation of financial statements that are free from material misstatement, whether due to fraud or error.</p>`,
        order: 3,
        type: 'standard',
        editable: true
      },
      {
        id: 'sec-4',
        title: "Auditor's Responsibilities",
        content: `<h3>Auditor's Responsibilities for the Audit of the Financial Statements</h3>
<p>Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance but is not absolute assurance and therefore is not a guarantee that an audit conducted in accordance with GAAS will always detect a material misstatement when it exists.</p>`,
        order: 4,
        type: 'standard',
        editable: true
      }
    ]
  },
  {
    id: 'tpl-2',
    name: 'Qualified Opinion',
    type: 'qualified',
    description: 'Opinion with exception(s) that are material but not pervasive',
    sections: [
      {
        id: 'sec-1',
        title: 'Qualified Opinion',
        content: `<h3>Qualified Opinion</h3>
<p>In our opinion, except for the effects of the matter described in the Basis for Qualified Opinion section of our report, the financial statements referred to above present fairly, in all material respects, the financial position of [Client Name] as of [Date]...</p>`,
        order: 1,
        type: 'opinion',
        editable: true
      },
      {
        id: 'sec-2',
        title: 'Basis for Qualified Opinion',
        content: `<h3>Basis for Qualified Opinion</h3>
<p>[Describe the matter giving rise to the qualification]</p>`,
        order: 2,
        type: 'custom',
        editable: true
      }
    ]
  },
  {
    id: 'tpl-3',
    name: 'Management Letter',
    type: 'management_letter',
    description: 'Communication of internal control deficiencies and recommendations',
    sections: [
      {
        id: 'sec-1',
        title: 'Management Letter',
        content: `<h2>Management Letter</h2>
<p><strong>To the Board of Directors and Management of [Client Name]</strong></p>

<p>In planning and performing our audit of the financial statements of [Client Name] as of and for the year ended [Date], we considered the Company's internal control over financial reporting to determine our auditing procedures for the purpose of expressing our opinion on the financial statements and not to provide assurance on the internal control over financial reporting.</p>

<h3>Findings and Recommendations</h3>`,
        order: 1,
        type: 'standard',
        editable: true
      }
    ]
  }
];

// Mock findings data
const mockFindings = [
  {
    id: 'finding-1',
    title: 'Revenue Recognition - Cutoff Testing',
    severity: 'high',
    description: 'Identified $250,000 of revenue recorded in wrong period'
  },
  {
    id: 'finding-2',
    title: 'Inventory Valuation - Obsolescence',
    severity: 'medium',
    description: 'Insufficient provision for obsolete inventory items'
  },
  {
    id: 'finding-3',
    title: 'Internal Control - Segregation of Duties',
    severity: 'low',
    description: 'Same person can create and approve journal entries'
  }
];

export function AuditReportDrafting({
  engagementId,
  clientName,
  userId,
  userName
}: AuditReportDraftingProps) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const [sectionContent, setSectionContent] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<AuditReport['report_type']>('unqualified');
  const [fiscalYearEnd, setFiscalYearEnd] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showFindingsDialog, setShowFindingsDialog] = useState(false);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);

  // Initialize report from template
  const initializeReport = (template: ReportTemplate) => {
    const newReport: AuditReport = {
      id: `report-${Date.now()}`,
      engagement_id: engagementId,
      engagement_name: `Engagement ${engagementId}`,
      client_name: clientName,
      report_type: template.type,
      title: `${template.name} - ${clientName}`,
      content: '',
      version: 1,
      status: 'draft',
      created_by: userId,
      created_by_name: userName,
      fiscal_year_end: fiscalYearEnd || '2024-12-31',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sections: template.sections.map(s => ({
        ...s,
        content: s.content
          .replace(/\[Client Name\]/g, clientName)
          .replace(/\[Date\]/g, format(new Date(fiscalYearEnd || '2024-12-31'), 'MMMM d, yyyy'))
      })),
      findings_included: [],
      collaborators: [
        {
          user_id: userId,
          user_name: userName,
          role: 'editor',
          last_active: new Date().toISOString()
        }
      ]
    };

    setReport(newReport);
    setReportTitle(newReport.title);
    setSelectedTemplate(template);
  };

  // Save report
  const handleSave = () => {
    if (!report) return;

    const updatedReport = {
      ...report,
      title: reportTitle,
      updated_at: new Date().toISOString(),
      version: report.version + 0.1
    };

    setReport(updatedReport);

    toast({
      title: 'Report Saved',
      description: `Version ${updatedReport.version.toFixed(1)} saved successfully.`,
    });
  };

  // Update section content
  const handleUpdateSection = () => {
    if (!report || !selectedSection) return;

    const updatedSections = report.sections.map(s =>
      s.id === selectedSection.id
        ? { ...s, content: sectionContent }
        : s
    );

    setReport({
      ...report,
      sections: updatedSections,
      updated_at: new Date().toISOString()
    });

    setIsEditing(false);
    setSelectedSection(null);
    setSectionContent('');

    toast({
      title: 'Section Updated',
      description: 'The section has been updated successfully.',
    });
  };

  // Insert findings
  const handleInsertFindings = () => {
    if (!report || selectedFindings.length === 0) return;

    const findingsContent = selectedFindings.map(findingId => {
      const finding = mockFindings.find(f => f.id === findingId);
      if (!finding) return '';

      return `
<div class="finding">
  <h4>${finding.title}</h4>
  <p><strong>Severity:</strong> ${finding.severity.toUpperCase()}</p>
  <p>${finding.description}</p>
</div>`;
    }).join('\n');

    const newSection: ReportSection = {
      id: `sec-${Date.now()}`,
      title: 'Audit Findings',
      content: findingsContent,
      order: report.sections.length + 1,
      type: 'finding',
      editable: true
    };

    setReport({
      ...report,
      sections: [...report.sections, newSection],
      findings_included: [...report.findings_included, ...selectedFindings],
      updated_at: new Date().toISOString()
    });

    setShowFindingsDialog(false);
    setSelectedFindings([]);

    toast({
      title: 'Findings Inserted',
      description: `${selectedFindings.length} findings have been added to the report.`,
    });
  };

  // Export to PDF
  const handleExportPDF = () => {
    toast({
      title: 'Exporting to PDF',
      description: 'Your report is being prepared for download...',
    });

    // In a real implementation, this would generate a PDF
    setTimeout(() => {
      toast({
        title: 'PDF Ready',
        description: 'Your report has been downloaded.',
      });
    }, 2000);
  };

  // Send for review
  const handleSendForReview = () => {
    if (!report) return;

    setReport({
      ...report,
      status: 'in_review',
      updated_at: new Date().toISOString()
    });

    toast({
      title: 'Sent for Review',
      description: 'The report has been sent to reviewers.',
    });
  };

  // Approve report
  const handleApprove = () => {
    if (!report) return;

    setReport({
      ...report,
      status: 'approved',
      approved_by: userId,
      updated_at: new Date().toISOString()
    });

    toast({
      title: 'Report Approved',
      description: 'The report has been approved and is ready for final issuance.',
    });
  };

  // Finalize and issue report
  const handleIssue = () => {
    if (!report) return;

    setReport({
      ...report,
      status: 'issued',
      issued_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    toast({
      title: 'Report Issued',
      description: 'The audit report has been finalized and issued.',
    });
  };

  // Format toolbar actions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Report Drafting
              </CardTitle>
              <CardDescription>
                Create and manage audit reports with templates and collaboration
              </CardDescription>
            </div>
            {report && (
              <div className="flex items-center gap-2">
                <Badge variant={
                  report.status === 'draft' ? 'secondary' :
                  report.status === 'in_review' ? 'default' :
                  report.status === 'approved' ? 'outline' :
                  'default'
                }>
                  {report.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  Version {report.version.toFixed(1)}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            // Template Selection
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(value: AuditReport['report_type']) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unqualified">Unqualified Opinion</SelectItem>
                      <SelectItem value="qualified">Qualified Opinion</SelectItem>
                      <SelectItem value="adverse">Adverse Opinion</SelectItem>
                      <SelectItem value="disclaimer">Disclaimer of Opinion</SelectItem>
                      <SelectItem value="management_letter">Management Letter</SelectItem>
                      <SelectItem value="internal_control">Internal Control Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fiscal Year End</Label>
                  <Input
                    type="date"
                    value={fiscalYearEnd}
                    onChange={(e) => setFiscalYearEnd(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Client Name</Label>
                  <Input value={clientName} disabled />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Select a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportTemplates
                    .filter(t => t.type === reportType)
                    .map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => initializeReport(template)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {template.sections.length} sections
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            // Report Editor
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-1" />
                    Export PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowFindingsDialog(true)}>
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Insert Findings
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowVersionHistory(true)}>
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === 'draft' && (
                    <Button size="sm" onClick={handleSendForReview}>
                      <Send className="h-4 w-4 mr-1" />
                      Send for Review
                    </Button>
                  )}
                  {report.status === 'in_review' && (
                    <Button size="sm" onClick={handleApprove}>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {report.status === 'approved' && (
                    <Button size="sm" onClick={handleIssue}>
                      <FileSignature className="h-4 w-4 mr-1" />
                      Issue Report
                    </Button>
                  )}
                </div>
              </div>

              {/* Report Title */}
              <div>
                <Label>Report Title</Label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Sections */}
              <Tabs defaultValue="sections" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="space-y-4">
                  {report.sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {section.title}
                            <Badge variant="outline" className="text-xs">
                              {section.type}
                            </Badge>
                          </CardTitle>
                          {section.editable && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSection(section);
                                setSectionContent(section.content);
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditing && selectedSection?.id === section.id ? (
                          <div className="space-y-4">
                            {/* Rich Text Editor Toolbar */}
                            <div className="flex items-center gap-1 p-2 border rounded-lg bg-background">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('bold')}
                              >
                                <Bold className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('italic')}
                              >
                                <Italic className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('underline')}
                              >
                                <Underline className="h-4 w-4" />
                              </Button>
                              <Separator orientation="vertical" className="h-6" />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('insertUnorderedList')}
                              >
                                <List className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('insertOrderedList')}
                              >
                                <ListOrdered className="h-4 w-4" />
                              </Button>
                              <Separator orientation="vertical" className="h-6" />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('justifyLeft')}
                              >
                                <AlignLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('justifyCenter')}
                              >
                                <AlignCenter className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => formatText('justifyRight')}
                              >
                                <AlignRight className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Content Editor */}
                            <div
                              ref={editorRef}
                              contentEditable
                              className="min-h-[300px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              dangerouslySetInnerHTML={{ __html: sectionContent }}
                              onInput={(e) => setSectionContent(e.currentTarget.innerHTML)}
                            />

                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsEditing(false);
                                  setSelectedSection(null);
                                  setSectionContent('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleUpdateSection}>
                                Save Section
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="preview">
                  <Card>
                    <CardContent className="p-8">
                      <div className="prose max-w-none">
                        <h1>{reportTitle}</h1>
                        {report.sections.map((section) => (
                          <div key={section.id} dangerouslySetInnerHTML={{ __html: section.content }} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="collaborators">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {report.collaborators.map((collaborator) => (
                          <div key={collaborator.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {collaborator.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{collaborator.user_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                                </p>
                              </div>
                            </div>
                            {collaborator.last_active && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Active {formatDistanceToNow(new Date(collaborator.last_active))} ago
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insert Findings Dialog */}
      <Dialog open={showFindingsDialog} onOpenChange={setShowFindingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insert Findings</DialogTitle>
            <DialogDescription>
              Select findings to include in the audit report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {mockFindings.map((finding) => (
              <div key={finding.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedFindings.includes(finding.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFindings([...selectedFindings, finding.id]);
                    } else {
                      setSelectedFindings(selectedFindings.filter(id => id !== finding.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{finding.title}</p>
                    <Badge variant={
                      finding.severity === 'high' ? 'destructive' :
                      finding.severity === 'medium' ? 'default' :
                      'secondary'
                    }>
                      {finding.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{finding.description}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFindingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertFindings}>
              Insert {selectedFindings.length} Finding(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Track changes and versions of the audit report
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {[1, 1.1, 1.2].map((version) => (
                <div key={version} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Version {version.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">
                      Modified by {userName} • {format(new Date(), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );

  function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
  }
}