/**
 * ==================================================================
 * AUDIT PLANNING TAB
 * ==================================================================
 * Planning phase tools including materiality, risk assessment,
 * audit plan builder, and team assignment per System Design Document
 * Section 7.3.2
 * ==================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Save,
  Download,
} from 'lucide-react';
import { useMateriality } from '@/hooks/useAuditTools';
import { useState } from 'react';

interface AuditPlanningTabProps {
  engagementId: string;
  engagement: any;
}

export function AuditPlanningTab({ engagementId, engagement }: AuditPlanningTabProps) {
  return (
    <div className="p-6">
      <Tabs defaultValue="materiality" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="materiality">Materiality</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="plan">Audit Plan</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="materiality" className="space-y-4">
          <MaterialityCalculatorCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <RiskAssessmentCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <AuditPlanCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamAssignmentCard engagementId={engagementId} engagement={engagement} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Materiality Calculator Component
 * Per AU-C 320, calculates Overall Materiality, Performance Materiality,
 * and Clearly Trivial Threshold
 */
function MaterialityCalculatorCard({ engagementId }: { engagementId: string }) {
  const { data: materiality, isLoading } = useMateriality(engagementId);
  const [benchmark, setBenchmark] = useState<string>('total_assets');
  const [benchmarkAmount, setBenchmarkAmount] = useState<number>(10000000);
  const [percentage, setPercentage] = useState<number>(5);

  // Calculate materiality levels
  const overallMateriality = Math.round(benchmarkAmount * (percentage / 100));
  const performanceMateriality = Math.round(overallMateriality * 0.75); // 75% default
  const clearlyTrivial = Math.round(overallMateriality * 0.05); // 5% default

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Materiality Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Calculate overall materiality, performance materiality, and clearly trivial threshold per AU-C 320
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="benchmark">Benchmark</Label>
            <Select value={benchmark} onValueChange={setBenchmark}>
              <SelectTrigger id="benchmark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_assets">Total Assets</SelectItem>
                <SelectItem value="total_revenue">Total Revenue</SelectItem>
                <SelectItem value="gross_profit">Gross Profit</SelectItem>
                <SelectItem value="net_income">Net Income (Loss)</SelectItem>
                <SelectItem value="total_equity">Total Equity</SelectItem>
                <SelectItem value="total_expenses">Total Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benchmarkAmount">Benchmark Amount</Label>
            <Input
              id="benchmarkAmount"
              type="number"
              value={benchmarkAmount}
              onChange={(e) => setBenchmarkAmount(Number(e.target.value))}
              placeholder="10,000,000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentage">Percentage (%)</Label>
            <Input
              id="percentage"
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              min="0"
              max="100"
              step="0.1"
              placeholder="5.0"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Overall Materiality</div>
            <div className="text-2xl font-bold text-primary">
              ${overallMateriality.toLocaleString()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Performance Materiality</div>
            <div className="text-2xl font-bold text-blue-600">
              ${performanceMateriality.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">(75% of OM)</div>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Clearly Trivial</div>
            <div className="text-2xl font-bold text-green-600">
              ${clearlyTrivial.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">(5% of OM)</div>
          </div>
        </div>

        {/* Component Allocations */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Component Allocations (Optional)
          </h4>
          <div className="space-y-3">
            {[
              { component: 'Revenue', amount: 300000, color: 'bg-blue-500' },
              { component: 'Receivables', amount: 200000, color: 'bg-green-500' },
              { component: 'Inventory', amount: 150000, color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.component} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <span className="text-sm font-medium w-32">{item.component}</span>
                <Input
                  type="number"
                  defaultValue={item.amount}
                  className="w-40"
                  placeholder="Amount"
                />
                <span className="text-sm text-muted-foreground">
                  ({((item.amount / overallMateriality) * 100).toFixed(0)}% of OM)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Calculation
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Risk Assessment Matrix Component
 * Account-level risk assessment grid
 */
function RiskAssessmentCard({ engagementId }: { engagementId: string }) {
  const accounts = [
    { name: 'Cash', inherent: 'Medium', control: 'Low', detection: 'Medium', overall: 'Low' },
    { name: 'Accounts Receivable', inherent: 'High', control: 'Medium', detection: 'High', overall: 'High' },
    { name: 'Inventory', inherent: 'High', control: 'Medium', detection: 'Medium', overall: 'Medium' },
    { name: 'Revenue', inherent: 'High', control: 'Medium', detection: 'High', overall: 'High' },
    { name: 'Cost of Goods Sold', inherent: 'Medium', control: 'Low', detection: 'Medium', overall: 'Medium' },
    { name: 'Payroll', inherent: 'Low', control: 'Low', detection: 'Low', overall: 'Low' },
    { name: 'Accounts Payable', inherent: 'Medium', control: 'Medium', detection: 'Medium', overall: 'Medium' },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Assessment Matrix
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Account-level risk assessment using Audit Risk Model (AR = IR × CR × DR)
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Account / Assertion</th>
                <th className="text-center p-3 font-medium">Inherent Risk</th>
                <th className="text-center p-3 font-medium">Control Risk</th>
                <th className="text-center p-3 font-medium">Detection Risk</th>
                <th className="text-center p-3 font-medium">Overall Risk</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{account.name}</td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <Badge className={getRiskColor(account.inherent)} variant="outline">
                        {account.inherent}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <Badge className={getRiskColor(account.control)} variant="outline">
                        {account.control}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <Badge className={getRiskColor(account.detection)} variant="outline">
                        {account.detection}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <Badge className={getRiskColor(account.overall)} variant="outline">
                        {account.overall}
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Risk Legend</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">High Risk:</span> Increased substantive testing required
            </div>
            <div>
              <span className="font-medium">Medium Risk:</span> Normal audit procedures
            </div>
            <div>
              <span className="font-medium">Low Risk:</span> Reduced substantive testing
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Audit Plan Builder Component
 * Procedures mapped to assertions by account
 */
function AuditPlanCard({ engagementId }: { engagementId: string }) {
  const procedures = [
    {
      account: 'Cash',
      assertion: 'Existence',
      procedure: 'Bank confirmation as of year-end',
      reference: 'A-1',
      status: 'Complete',
    },
    {
      account: 'Cash',
      assertion: 'Completeness',
      procedure: 'Bank reconciliation review',
      reference: 'A-2',
      status: 'In Progress',
    },
    {
      account: 'Accounts Receivable',
      assertion: 'Existence',
      procedure: 'AR confirmation - positive confirmations',
      reference: 'B-1',
      status: 'Not Started',
    },
    {
      account: 'Accounts Receivable',
      assertion: 'Valuation',
      procedure: 'Allowance for doubtful accounts analysis',
      reference: 'B-2',
      status: 'Not Started',
    },
    {
      account: 'Revenue',
      assertion: 'Occurrence',
      procedure: 'Sales cutoff testing',
      reference: 'R-1',
      status: 'In Progress',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Plan Builder
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Planned audit procedures by account and assertion
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">7</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">15</div>
              <div className="text-sm text-muted-foreground">Not Started</div>
            </div>
          </div>

          {/* Procedures Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Account</th>
                  <th className="text-left p-3 font-medium">Assertion</th>
                  <th className="text-left p-3 font-medium">Procedure</th>
                  <th className="text-center p-3 font-medium">Ref</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{proc.account}</td>
                    <td className="p-3">{proc.assertion}</td>
                    <td className="p-3">{proc.procedure}</td>
                    <td className="p-3 text-center">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{proc.reference}</code>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Badge className={getStatusColor(proc.status)} variant="outline">
                          {proc.status}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button>Add Procedure</Button>
            <Button variant="outline">Import Template</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Team Assignment Component
 * Role assignments and workpaper allocations
 */
function TeamAssignmentCard({
  engagementId,
  engagement,
}: {
  engagementId: string;
  engagement: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Assignment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Role assignments and workpaper allocations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Team Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Partner</div>
            <div className="font-medium">John Smith</div>
            <div className="text-xs text-muted-foreground mt-1">10 hrs budgeted</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Manager</div>
            <div className="font-medium">Jane Doe</div>
            <div className="text-xs text-muted-foreground mt-1">35 hrs budgeted</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Senior</div>
            <div className="font-medium">Bob Johnson</div>
            <div className="text-xs text-muted-foreground mt-1">50 hrs budgeted</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Staff</div>
            <div className="font-medium">Alice Williams</div>
            <div className="text-xs text-muted-foreground mt-1">40 hrs budgeted</div>
          </div>
        </div>

        {/* Workpaper Assignments */}
        <div>
          <h4 className="font-medium mb-3">Workpaper Assignments</h4>
          <div className="space-y-3">
            {[
              { section: 'Cash (A)', assignee: 'Alice Williams', status: 'In Progress', progress: 60 },
              { section: 'AR (B)', assignee: 'Bob Johnson', status: 'In Progress', progress: 40 },
              { section: 'Inventory (C)', assignee: 'Bob Johnson', status: 'Not Started', progress: 0 },
              { section: 'Revenue (R)', assignee: 'Jane Doe', status: 'Complete', progress: 100 },
            ].map((wp, idx) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{wp.section}</div>
                    <div className="text-sm text-muted-foreground">Assigned to: {wp.assignee}</div>
                  </div>
                  <Badge variant={wp.progress === 100 ? 'default' : 'secondary'}>{wp.status}</Badge>
                </div>
                <Progress value={wp.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button>Add Team Member</Button>
          <Button variant="outline">Reassign Workpapers</Button>
        </div>
      </CardContent>
    </Card>
  );
}
