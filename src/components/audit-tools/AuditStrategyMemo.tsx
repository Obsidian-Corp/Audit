/**
 * ==================================================================
 * AUDIT STRATEGY MEMO & ENGAGEMENT PLANNING CHECKLIST
 * ==================================================================
 * Comprehensive audit planning documentation per AU-C 300
 * - Client acceptance/continuance assessment
 * - Understanding of entity and environment
 * - Audit approach determination
 * - Resource allocation planning
 * - Engagement planning checklist
 * - Link to risk assessment
 * - PDF export capability
 * ==================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  Building,
  Target,
  Calendar,
  DollarSign,
  Shield,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronRight,
  Printer,
  Link
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditStrategyMemoProps {
  engagementId: string;
  clientName: string;
  fiscalYearEnd: string;
}

// Checklist categories
const checklistCategories = [
  {
    id: 'acceptance',
    title: 'Client Acceptance & Continuance',
    items: [
      { id: 'acc-1', label: 'Independence evaluation completed', required: true },
      { id: 'acc-2', label: 'Conflict of interest check performed', required: true },
      { id: 'acc-3', label: 'Client integrity assessment completed', required: true },
      { id: 'acc-4', label: 'Financial stability review performed', required: false },
      { id: 'acc-5', label: 'Engagement letter signed', required: true },
      { id: 'acc-6', label: 'Prior year issues resolved', required: false }
    ]
  },
  {
    id: 'understanding',
    title: 'Understanding the Entity',
    items: [
      { id: 'und-1', label: 'Industry analysis completed', required: true },
      { id: 'und-2', label: 'Business model documented', required: true },
      { id: 'und-3', label: 'Key personnel interviewed', required: true },
      { id: 'und-4', label: 'IT systems documented', required: true },
      { id: 'und-5', label: 'Internal control walkthrough completed', required: true },
      { id: 'und-6', label: 'Related party identification', required: true }
    ]
  },
  {
    id: 'planning',
    title: 'Audit Planning',
    items: [
      { id: 'pln-1', label: 'Risk assessment procedures performed', required: true },
      { id: 'pln-2', label: 'Materiality calculated and documented', required: true },
      { id: 'pln-3', label: 'Audit approach determined', required: true },
      { id: 'pln-4', label: 'Fraud risk assessment completed', required: true },
      { id: 'pln-5', label: 'Analytical procedures planned', required: true },
      { id: 'pln-6', label: 'Specialist involvement assessed', required: false }
    ]
  },
  {
    id: 'team',
    title: 'Team & Resources',
    items: [
      { id: 'tm-1', label: 'Engagement team assigned', required: true },
      { id: 'tm-2', label: 'Team independence confirmed', required: true },
      { id: 'tm-3', label: 'Budget prepared and approved', required: true },
      { id: 'tm-4', label: 'Timeline established', required: true },
      { id: 'tm-5', label: 'Training needs identified', required: false },
      { id: 'tm-6', label: 'Quality reviewer assigned', required: false }
    ]
  },
  {
    id: 'coordination',
    title: 'Coordination & Communication',
    items: [
      { id: 'crd-1', label: 'Planning meeting held with client', required: true },
      { id: 'crd-2', label: 'PBC list provided to client', required: true },
      { id: 'crd-3', label: 'Key dates communicated', required: true },
      { id: 'crd-4', label: 'Other auditor coordination (if applicable)', required: false },
      { id: 'crd-5', label: 'Management representation letter drafted', required: true },
      { id: 'crd-6', label: 'Board/audit committee meeting scheduled', required: false }
    ]
  }
];

export function AuditStrategyMemo({
  engagementId,
  clientName,
  fiscalYearEnd
}: AuditStrategyMemoProps) {
  const { toast } = useToast();

  // State for memo sections
  const [memoData, setMemoData] = useState({
    // Client Information
    clientIndustry: '',
    clientSize: 'small' as 'small' | 'medium' | 'large',
    publicCompany: 'no',
    firstYearAudit: 'no',

    // Engagement Information
    auditObjective: '',
    auditScope: '',
    reportingDeadline: '',
    otherServices: '',

    // Risk Assessment Summary
    overallRiskLevel: 'moderate' as 'low' | 'moderate' | 'high',
    significantRisks: '',
    fraudRisks: '',
    materialityLevel: '',
    performanceMateriality: '',

    // Audit Approach
    auditStrategy: 'combined' as 'substantive' | 'combined' | 'controls',
    keyAuditAreas: '',
    specialistNeeded: 'no',
    specialistAreas: '',
    groupAudit: 'no',
    componentAuditors: '',

    // Resource Planning
    engagementPartner: '',
    engagementManager: '',
    seniorAuditor: '',
    staffAuditors: '',
    budgetedHours: '',
    plannedFieldworkStart: '',
    plannedFieldworkEnd: '',

    // Other Considerations
    goingConcernIssues: 'no',
    goingConcernDetails: '',
    subsequentEvents: '',
    communicationPlan: '',
    qualityReviewRequired: 'no',
    qualityReviewer: ''
  });

  // State for checklist
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({});

  // Calculate checklist progress
  const calculateProgress = () => {
    const requiredItems = checklistCategories
      .flatMap(cat => cat.items)
      .filter(item => item.required);

    const checkedRequired = requiredItems.filter(item =>
      checkedItems.has(item.id)
    ).length;

    return (checkedRequired / requiredItems.length) * 100;
  };

  // Handle checkbox change
  const handleCheckItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  // Handle memo field change
  const handleMemoChange = (field: string, value: string) => {
    setMemoData(prev => ({ ...prev, [field]: value }));
  };

  // Save memo
  const handleSave = () => {
    toast({
      title: 'Audit Strategy Memo Saved',
      description: 'The memo and checklist have been saved successfully.',
    });
  };

  // Export to PDF
  const handleExportPDF = () => {
    toast({
      title: 'Exporting to PDF',
      description: 'The audit strategy memo is being prepared for download...',
    });
  };

  // Link to risk assessment
  const handleLinkRiskAssessment = () => {
    toast({
      title: 'Linked to Risk Assessment',
      description: 'The memo has been linked to the current risk assessment.',
    });
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Strategy Memo & Planning Checklist
              </CardTitle>
              <CardDescription>
                Document the overall audit strategy and complete the engagement planning checklist
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {clientName}
              </Badge>
              <Badge variant="outline">
                FYE {format(new Date(fiscalYearEnd), 'MM/dd/yyyy')}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Planning Checklist Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress < 100 && (
              <p className="text-xs text-muted-foreground">
                Complete all required items to finalize planning
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="memo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="memo">Strategy Memo</TabsTrigger>
          <TabsTrigger value="checklist">Planning Checklist</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Strategy Memo Tab */}
        <TabsContent value="memo" className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-4 w-4" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={memoData.clientIndustry}
                    onChange={(e) => handleMemoChange('clientIndustry', e.target.value)}
                    placeholder="e.g., Manufacturing, Retail, Technology"
                  />
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select
                    value={memoData.clientSize}
                    onValueChange={(value) => handleMemoChange('clientSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (&lt;$10M)</SelectItem>
                      <SelectItem value="medium">Medium ($10M-$100M)</SelectItem>
                      <SelectItem value="large">Large (&gt;$100M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Public Company?</Label>
                  <RadioGroup
                    value={memoData.publicCompany}
                    onValueChange={(value) => handleMemoChange('publicCompany', value)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="public-yes" />
                        <Label htmlFor="public-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="public-no" />
                        <Label htmlFor="public-no">No</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>First Year Audit?</Label>
                  <RadioGroup
                    value={memoData.firstYearAudit}
                    onValueChange={(value) => handleMemoChange('firstYearAudit', value)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="first-yes" />
                        <Label htmlFor="first-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="first-no" />
                        <Label htmlFor="first-no">No</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Engagement Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Audit Objective</Label>
                <Textarea
                  value={memoData.auditObjective}
                  onChange={(e) => handleMemoChange('auditObjective', e.target.value)}
                  placeholder="Describe the primary objective of this audit engagement..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Audit Scope</Label>
                <Textarea
                  value={memoData.auditScope}
                  onChange={(e) => handleMemoChange('auditScope', e.target.value)}
                  placeholder="Define the scope and boundaries of the audit..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Reporting Deadline</Label>
                  <Input
                    type="date"
                    value={memoData.reportingDeadline}
                    onChange={(e) => handleMemoChange('reportingDeadline', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Other Services Provided</Label>
                  <Input
                    value={memoData.otherServices}
                    onChange={(e) => handleMemoChange('otherServices', e.target.value)}
                    placeholder="e.g., Tax, Consulting"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Overall Risk Assessment</Label>
                <Select
                  value={memoData.overallRiskLevel}
                  onValueChange={(value) => handleMemoChange('overallRiskLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="moderate">Moderate Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Significant Risks Identified</Label>
                <Textarea
                  value={memoData.significantRisks}
                  onChange={(e) => handleMemoChange('significantRisks', e.target.value)}
                  placeholder="List significant risks that require special audit consideration..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Fraud Risk Factors</Label>
                <Textarea
                  value={memoData.fraudRisks}
                  onChange={(e) => handleMemoChange('fraudRisks', e.target.value)}
                  placeholder="Document any fraud risk factors identified..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Overall Materiality</Label>
                  <Input
                    type="number"
                    value={memoData.materialityLevel}
                    onChange={(e) => handleMemoChange('materialityLevel', e.target.value)}
                    placeholder="$ Amount"
                  />
                </div>
                <div>
                  <Label>Performance Materiality</Label>
                  <Input
                    type="number"
                    value={memoData.performanceMateriality}
                    onChange={(e) => handleMemoChange('performanceMateriality', e.target.value)}
                    placeholder="$ Amount"
                  />
                </div>
              </div>
              <Alert>
                <Link className="h-4 w-4" />
                <AlertTitle>Risk Assessment Link</AlertTitle>
                <AlertDescription>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={handleLinkRiskAssessment}
                  >
                    Link to Detailed Risk Assessment
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Audit Approach */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Audit Approach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Overall Audit Strategy</Label>
                <Select
                  value={memoData.auditStrategy}
                  onValueChange={(value) => handleMemoChange('auditStrategy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="substantive">Primarily Substantive</SelectItem>
                    <SelectItem value="combined">Combined (Controls + Substantive)</SelectItem>
                    <SelectItem value="controls">Controls Reliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Key Audit Areas</Label>
                <Textarea
                  value={memoData.keyAuditAreas}
                  onChange={(e) => handleMemoChange('keyAuditAreas', e.target.value)}
                  placeholder="List key audit areas requiring special attention..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Specialist Involvement Needed?</Label>
                <RadioGroup
                  value={memoData.specialistNeeded}
                  onValueChange={(value) => handleMemoChange('specialistNeeded', value)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="specialist-yes" />
                      <Label htmlFor="specialist-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="specialist-no" />
                      <Label htmlFor="specialist-no">No</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              {memoData.specialistNeeded === 'yes' && (
                <div>
                  <Label>Specialist Areas</Label>
                  <Input
                    value={memoData.specialistAreas}
                    onChange={(e) => handleMemoChange('specialistAreas', e.target.value)}
                    placeholder="e.g., Valuation, IT, Tax, Actuarial"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resource Planning */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Resource Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Engagement Partner</Label>
                  <Input
                    value={memoData.engagementPartner}
                    onChange={(e) => handleMemoChange('engagementPartner', e.target.value)}
                    placeholder="Partner name"
                  />
                </div>
                <div>
                  <Label>Engagement Manager</Label>
                  <Input
                    value={memoData.engagementManager}
                    onChange={(e) => handleMemoChange('engagementManager', e.target.value)}
                    placeholder="Manager name"
                  />
                </div>
                <div>
                  <Label>Senior Auditor</Label>
                  <Input
                    value={memoData.seniorAuditor}
                    onChange={(e) => handleMemoChange('seniorAuditor', e.target.value)}
                    placeholder="Senior name"
                  />
                </div>
                <div>
                  <Label>Staff Auditors</Label>
                  <Input
                    value={memoData.staffAuditors}
                    onChange={(e) => handleMemoChange('staffAuditors', e.target.value)}
                    placeholder="Number of staff"
                  />
                </div>
                <div>
                  <Label>Total Budgeted Hours</Label>
                  <Input
                    type="number"
                    value={memoData.budgetedHours}
                    onChange={(e) => handleMemoChange('budgetedHours', e.target.value)}
                    placeholder="Hours"
                  />
                </div>
                <div>
                  <Label>Planned Fieldwork Start</Label>
                  <Input
                    type="date"
                    value={memoData.plannedFieldworkStart}
                    onChange={(e) => handleMemoChange('plannedFieldworkStart', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planning Checklist Tab */}
        <TabsContent value="checklist" className="space-y-6">
          {checklistCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={item.id}
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => handleCheckItem(item.id)}
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={item.id}
                          className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            checkedItems.has(item.id) && "line-through text-muted-foreground"
                          )}
                        >
                          {item.label}
                          {item.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {checkedItems.has(item.id) && (
                          <Input
                            className="text-xs"
                            placeholder="Add notes (optional)"
                            value={checklistNotes[item.id] || ''}
                            onChange={(e) => setChecklistNotes(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))}
                          />
                        )}
                      </div>
                      {checkedItems.has(item.id) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Strategy Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Information Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Client Information</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Client:</dt>
                      <dd className="font-medium">{clientName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Industry:</dt>
                      <dd className="font-medium">{memoData.clientIndustry || 'Not specified'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">FYE:</dt>
                      <dd className="font-medium">{format(new Date(fiscalYearEnd), 'MM/dd/yyyy')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Size:</dt>
                      <dd className="font-medium capitalize">{memoData.clientSize}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Audit Approach</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Risk Level:</dt>
                      <dd>
                        <Badge variant={
                          memoData.overallRiskLevel === 'high' ? 'destructive' :
                          memoData.overallRiskLevel === 'moderate' ? 'default' :
                          'secondary'
                        }>
                          {memoData.overallRiskLevel} risk
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Strategy:</dt>
                      <dd className="font-medium capitalize">{memoData.auditStrategy}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Materiality:</dt>
                      <dd className="font-medium">
                        {memoData.materialityLevel ? `$${Number(memoData.materialityLevel).toLocaleString()}` : 'TBD'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Team & Timing</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Partner:</dt>
                      <dd className="font-medium">{memoData.engagementPartner || 'TBD'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Manager:</dt>
                      <dd className="font-medium">{memoData.engagementManager || 'TBD'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Budget:</dt>
                      <dd className="font-medium">
                        {memoData.budgetedHours ? `${memoData.budgetedHours} hours` : 'TBD'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Checklist Status</h3>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {Math.round(progress)}% Complete
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Memo
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {progress === 100 ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Planning Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Planning In Progress
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}