/**
 * ==================================================================
 * AUDIT REPORTING TAB
 * ==================================================================
 * Report drafting, approval workflow, document archive, and final
 * checklist per System Design Document Section 7.3.5
 * ==================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  Send,
  Eye,
  Edit3,
  Archive,
  AlertCircle,
  User,
} from 'lucide-react';

interface AuditReportingTabProps {
  engagementId: string;
  engagement: any;
}

export function AuditReportingTab({ engagementId, engagement }: AuditReportingTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Report Status Overview */}
      <ReportStatusCard />

      {/* Report Editor */}
      <ReportEditorCard engagementId={engagementId} />

      {/* Approval Workflow */}
      <ApprovalWorkflowCard engagementId={engagementId} />

      {/* Final Checklist */}
      <FinalChecklistCard />

      {/* Document Archive */}
      <DocumentArchiveCard engagementId={engagementId} />
    </div>
  );
}

/**
 * Report Status Overview Component
 */
function ReportStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-sm text-blue-700 mb-1">Current Status</div>
            <Badge className="bg-blue-600">Partner Review</Badge>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Report Type</div>
            <div className="font-medium">Unqualified Opinion</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Draft Version</div>
            <div className="font-medium">v3.2</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Target Date</div>
            <div className="font-medium">Feb 15, 2024</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Report Editor Component
 */
function ReportEditorCard({ engagementId }: { engagementId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Report Editor
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Draft and edit the audit report with tracked changes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Template Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select defaultValue="unqualified">
              <SelectTrigger id="reportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unqualified">Unqualified Opinion (Clean)</SelectItem>
                <SelectItem value="qualified">Qualified Opinion</SelectItem>
                <SelectItem value="adverse">Adverse Opinion</SelectItem>
                <SelectItem value="disclaimer">Disclaimer of Opinion</SelectItem>
                <SelectItem value="review">Review Report</SelectItem>
                <SelectItem value="compilation">Compilation Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opinionDate">Opinion Date</Label>
            <Input id="opinionDate" type="date" defaultValue="2024-02-15" />
          </div>
        </div>

        {/* Report Sections */}
        <div>
          <h4 className="font-medium mb-3">Report Sections</h4>
          <div className="space-y-2">
            {[
              { section: 'Opinion Paragraph', status: 'Complete', changes: 0 },
              { section: 'Basis for Opinion', status: 'Complete', changes: 0 },
              { section: 'Responsibilities of Management', status: 'Complete', changes: 0 },
              { section: 'Auditors Responsibilities', status: 'Complete', changes: 0 },
              { section: 'Key Audit Matters (KAM)', status: 'Draft', changes: 3 },
              { section: 'Emphasis of Matter', status: 'Not Required', changes: 0 },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.section}</div>
                  {item.changes > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.changes} tracked change{item.changes > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <Badge
                  variant={
                    item.status === 'Complete'
                      ? 'default'
                      : item.status === 'Draft'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Draft
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Approval Workflow Component
 */
function ApprovalWorkflowCard({ engagementId }: { engagementId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Approval Workflow
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track partner review and approval status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Approval Progress</span>
            <span className="font-medium">3 of 4 Complete (75%)</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        {/* Approval Steps */}
        <div className="space-y-3">
          {[
            {
              step: 1,
              title: 'Senior Review',
              reviewer: 'Bob Johnson',
              status: 'Approved',
              date: '2024-02-08',
              comments: 'Workpapers complete and adequate',
            },
            {
              step: 2,
              title: 'Manager Review',
              reviewer: 'Jane Doe',
              status: 'Approved',
              date: '2024-02-10',
              comments: 'All review notes cleared',
            },
            {
              step: 3,
              title: 'Partner Review',
              reviewer: 'John Smith',
              status: 'In Progress',
              date: null,
              comments: 'Currently reviewing Key Audit Matters section',
            },
            {
              step: 4,
              title: 'Quality Control Review',
              reviewer: 'Sarah Martinez',
              status: 'Pending',
              date: null,
              comments: null,
            },
          ].map((approval) => (
            <div key={approval.step} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {approval.step}
                    </div>
                    <span className="font-medium">{approval.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground ml-8">
                    <User className="h-3 w-3 inline mr-1" />
                    {approval.reviewer}
                  </div>
                </div>
                <Badge
                  variant={
                    approval.status === 'Approved'
                      ? 'default'
                      : approval.status === 'In Progress'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {approval.status}
                </Badge>
              </div>
              {approval.date && (
                <div className="text-sm text-muted-foreground ml-8">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(approval.date).toLocaleDateString()}
                </div>
              )}
              {approval.comments && (
                <div className="mt-2 ml-8 p-2 bg-muted/50 rounded text-sm">
                  {approval.comments}
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
 * Final Checklist Component
 * Pre-issuance review requirements
 */
function FinalChecklistCard() {
  const checklistItems = [
    {
      category: 'Financial Statements',
      items: [
        { item: 'Balance Sheet reviewed and agrees to trial balance', checked: true },
        { item: 'Income Statement reviewed and agrees to trial balance', checked: true },
        { item: 'Cash Flow Statement reviewed', checked: true },
        { item: 'Notes to financial statements complete', checked: true },
      ],
    },
    {
      category: 'Workpapers',
      items: [
        { item: 'All workpaper sections complete', checked: true },
        { item: 'All review notes cleared', checked: false },
        { item: 'Tickmarks and references documented', checked: true },
        { item: 'Lead schedules agree to financial statements', checked: true },
      ],
    },
    {
      category: 'Audit Report',
      items: [
        { item: 'Report opinion is appropriate', checked: true },
        { item: 'Client name and dates are correct', checked: true },
        { item: 'Report references correct financial statement framework', checked: true },
        { item: 'Partner signature obtained', checked: false },
      ],
    },
    {
      category: 'Independence & Quality Control',
      items: [
        { item: 'All team members independence declarations current', checked: true },
        { item: 'Quality control review completed', checked: false },
        { item: 'Engagement quality control review (if required)', checked: false },
      ],
    },
    {
      category: 'Client Communications',
      items: [
        { item: 'Management representation letter obtained', checked: true },
        { item: 'Engagement letter signed', checked: true },
        { item: 'All PBC items received', checked: true },
      ],
    },
  ];

  const totalItems = checklistItems.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checklistItems.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.checked).length,
    0
  );
  const completionPercent = Math.round((completedItems / totalItems) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Final Checklist
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pre-issuance review requirements
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Completion</span>
            <span className="font-medium">
              {completedItems} of {totalItems} items ({completionPercent}%)
            </span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Incomplete Items Alert */}
        {completionPercent < 100 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 font-medium mb-2">
              <AlertCircle className="h-5 w-5" />
              {totalItems - completedItems} Items Remaining Before Report Issuance
            </div>
            <div className="text-sm text-orange-700">
              Complete all checklist items before issuing the final report
            </div>
          </div>
        )}

        {/* Checklist Categories */}
        <div className="space-y-4">
          {checklistItems.map((category, catIdx) => (
            <div key={catIdx}>
              <h4 className="font-medium mb-2">{category.category}</h4>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <label
                    key={itemIdx}
                    className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="h-4 w-4 rounded"
                    />
                    <span className={item.checked ? 'text-muted-foreground' : ''}>
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Document Archive Component
 */
function DocumentArchiveCard({ engagementId }: { engagementId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Document Archive
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Signed reports, management letters, and supporting documentation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <div className="text-sm text-muted-foreground mb-3">
            Drag and drop files here or click to browse
          </div>
          <Button variant="outline" size="sm">
            Select Files
          </Button>
        </div>

        {/* Archived Documents */}
        <div>
          <h4 className="font-medium mb-3">Archived Documents</h4>
          <div className="space-y-2">
            {[
              {
                name: 'Signed Audit Report - 2023.pdf',
                type: 'Audit Report',
                date: '2024-02-15',
                size: '2.4 MB',
              },
              {
                name: 'Management Letter - 2023.pdf',
                type: 'Management Letter',
                date: '2024-02-15',
                size: '845 KB',
              },
              {
                name: 'Representation Letter - Signed.pdf',
                type: 'Representation Letter',
                date: '2024-02-12',
                size: '156 KB',
              },
              {
                name: 'Engagement Letter - Signed.pdf',
                type: 'Engagement Letter',
                date: '2023-11-01',
                size: '234 KB',
              },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 ml-6">
                    {doc.type} • {new Date(doc.date).toLocaleDateString()} • {doc.size}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
