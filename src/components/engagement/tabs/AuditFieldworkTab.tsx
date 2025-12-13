/**
 * ==================================================================
 * AUDIT FIELDWORK TAB
 * ==================================================================
 * Active testing tools including sampling, confirmations, analytics,
 * test of details, and PBC tracking per System Design Document
 * Section 7.3.3
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
  Mail,
  TrendingUp,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  Download,
  Send,
  FileSpreadsheet,
  BarChart3,
  Upload,
} from 'lucide-react';
import {
  useSamples,
  useConfirmations,
  useAnalyticalProcedures,
  useClientPBCItems,
  useOverduePBCItems,
} from '@/hooks/useAuditTools';

interface AuditFieldworkTabProps {
  engagementId: string;
  engagement: any;
}

export function AuditFieldworkTab({ engagementId, engagement }: AuditFieldworkTabProps) {
  return (
    <div className="p-6">
      <Tabs defaultValue="sampling" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="sampling">Sampling</TabsTrigger>
          <TabsTrigger value="confirmations">Confirmations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tod">Test of Details</TabsTrigger>
          <TabsTrigger value="pbc">PBC Items</TabsTrigger>
        </TabsList>

        <TabsContent value="sampling">
          <SamplingCalculatorCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="confirmations">
          <ConfirmationTrackerCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticalProceduresCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="tod">
          <TestOfDetailsCard engagementId={engagementId} />
        </TabsContent>

        <TabsContent value="pbc">
          <PBCTrackerCard engagementId={engagementId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Sampling Calculator Component
 * Per AU-C 530 - MUS, Classical Variables, Attribute Sampling
 */
function SamplingCalculatorCard({ engagementId }: { engagementId: string }) {
  const { data: samples, isLoading } = useSamples(engagementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Sampling Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Calculate sample sizes using MUS, Classical Variables, or Attribute sampling per AU-C 530
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Selection */}
        <div className="space-y-2">
          <Label>Sampling Method</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="method" value="MUS" defaultChecked className="h-4 w-4" />
              <span>MUS (Monetary Unit Sampling)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="method" value="classical" className="h-4 w-4" />
              <span>Classical Variables</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="method" value="attribute" className="h-4 w-4" />
              <span>Attribute Sampling</span>
            </label>
          </div>
        </div>

        {/* Population Parameters */}
        <div>
          <h4 className="font-medium mb-3">Population</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value</Label>
              <Input
                id="totalValue"
                type="number"
                defaultValue={5000000}
                placeholder="5,000,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCount">Number of Items</Label>
              <Input id="itemCount" type="number" defaultValue={1250} placeholder="1,250" />
            </div>
          </div>
        </div>

        {/* Risk Parameters */}
        <div>
          <h4 className="font-medium mb-3">Risk Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence Level</Label>
              <Select defaultValue="95">
                <SelectTrigger id="confidence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedMis">Expected Misstatement</Label>
              <Input
                id="expectedMis"
                type="number"
                defaultValue={50000}
                placeholder="50,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tolerableMis">Tolerable Misstatement</Label>
              <Input
                id="tolerableMis"
                type="number"
                defaultValue={200000}
                placeholder="200,000"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 bg-primary/10 border-2 border-primary rounded-lg">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">CALCULATED SAMPLE SIZE</div>
            <div className="text-4xl font-bold text-primary">87 items</div>
            <div className="text-sm text-muted-foreground">
              Sampling Interval: $57,471
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Generate Sample
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Previous Samples */}
        {samples && samples.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Previous Samples</h4>
            <div className="space-y-2">
              {samples.slice(0, 3).map((sample: any) => (
                <div key={sample.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{sample.population_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {sample.sample_size} items selected from {sample.population_size}
                    </div>
                  </div>
                  <Badge>{sample.sampling_method}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Confirmation Tracker Component
 * Per AU-C 505 - AR, AP, Bank confirmations
 */
function ConfirmationTrackerCard({ engagementId }: { engagementId: string }) {
  const { data: confirmations, isLoading } = useConfirmations(engagementId);

  const stats = {
    sent: 45,
    received: 32,
    pending: 13,
    exceptions: 3,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Confirmation Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track AR, AP, and bank confirmations per AU-C 505
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-blue-700">Sent</div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.received}</div>
            <div className="text-sm text-green-700">Received</div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.exceptions}</div>
            <div className="text-sm text-red-700">Exceptions</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Response Rate</span>
            <span className="font-medium">{Math.round((stats.received / stats.sent) * 100)}%</span>
          </div>
          <Progress value={(stats.received / stats.sent) * 100} className="h-2" />
        </div>

        {/* Confirmation List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Confirmations</h4>
            <Button size="sm" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Batch
            </Button>
          </div>

          <div className="space-y-2">
            {[
              {
                type: 'AR',
                recipient: 'ABC Corporation',
                amount: 125000,
                status: 'Received',
                exception: false,
              },
              {
                type: 'AR',
                recipient: 'XYZ Industries',
                amount: 87500,
                status: 'Pending',
                exception: false,
              },
              {
                type: 'AR',
                recipient: 'Smith & Co',
                amount: 45000,
                status: 'Exception',
                exception: true,
              },
              { type: 'Bank', recipient: 'First National Bank', amount: 2500000, status: 'Received', exception: false },
            ].map((conf, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{conf.type}</Badge>
                    <span className="font-medium">{conf.recipient}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Amount: ${conf.amount.toLocaleString()}
                  </div>
                </div>
                <Badge
                  variant={
                    conf.status === 'Received'
                      ? 'default'
                      : conf.status === 'Exception'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {conf.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Recipients
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Analytical Procedures Component
 * Per AU-C 520 - Ratio, Trend, Variance Analysis
 */
function AnalyticalProceduresCard({ engagementId }: { engagementId: string }) {
  const { data: procedures, isLoading } = useAnalyticalProcedures(engagementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytical Procedures
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ratio, trend, and variance analysis per AU-C 520
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Type Selector */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Ratio Analysis
          </Button>
          <Button variant="outline" size="sm">
            Trend Analysis
          </Button>
          <Button variant="outline" size="sm">
            Variance Analysis
          </Button>
        </div>

        {/* Key Ratios */}
        <div>
          <h4 className="font-medium mb-3">Key Financial Ratios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { ratio: 'Current Ratio', current: 2.45, prior: 2.31, change: 6.1, threshold: 10 },
              { ratio: 'Quick Ratio', current: 1.82, prior: 1.76, change: 3.4, threshold: 10 },
              { ratio: 'Gross Margin %', current: 42.3, prior: 44.1, change: -4.1, threshold: 10 },
              { ratio: 'AR Days', current: 48, prior: 42, change: 14.3, threshold: 10 },
            ].map((item, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.ratio}</span>
                  {Math.abs(item.change) > item.threshold && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Current</div>
                    <div className="font-medium">{item.current}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Prior</div>
                    <div className="font-medium">{item.prior}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Change</div>
                    <div
                      className={`font-medium ${
                        Math.abs(item.change) > item.threshold
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {item.change > 0 ? '+' : ''}
                      {item.change}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variance Analysis */}
        <div>
          <h4 className="font-medium mb-3">Variance Analysis ({'>'}10% flagged)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Account</th>
                  <th className="text-right p-2">Current Year</th>
                  <th className="text-right p-2">Prior Year</th>
                  <th className="text-right p-2">Variance $</th>
                  <th className="text-right p-2">Variance %</th>
                  <th className="text-center p-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { account: 'Revenue', cy: 5200000, py: 4850000, variance: 350000, pct: 7.2 },
                  { account: 'Cost of Sales', cy: 3100000, py: 2750000, variance: 350000, pct: 12.7 },
                  { account: 'Operating Exp', cy: 1450000, py: 1380000, variance: 70000, pct: 5.1 },
                ].map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{item.account}</td>
                    <td className="p-2 text-right">${(item.cy / 1000).toFixed(0)}K</td>
                    <td className="p-2 text-right">${(item.py / 1000).toFixed(0)}K</td>
                    <td className="p-2 text-right">${(item.variance / 1000).toFixed(0)}K</td>
                    <td className="p-2 text-right">{item.pct}%</td>
                    <td className="p-2 text-center">
                      {Math.abs(item.pct) > 10 && (
                        <AlertCircle className="h-4 w-4 text-orange-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Analysis
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Test of Details Component
 * Substantive testing tracker
 */
function TestOfDetailsCard({ engagementId }: { engagementId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Test of Details Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track substantive testing procedures and results
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">8</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">5</div>
            <div className="text-sm text-muted-foreground">Not Started</div>
          </div>
        </div>

        {/* Test List */}
        <div className="space-y-3">
          {[
            {
              test: 'Inventory Observation',
              account: 'Inventory',
              sampleSize: 15,
              tested: 15,
              exceptions: 0,
              status: 'Complete',
            },
            {
              test: 'Revenue Cutoff Testing',
              account: 'Revenue',
              sampleSize: 25,
              tested: 18,
              exceptions: 2,
              status: 'In Progress',
            },
            {
              test: 'Fixed Asset Existence',
              account: 'PPE',
              sampleSize: 20,
              tested: 0,
              exceptions: 0,
              status: 'Not Started',
            },
          ].map((test, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">{test.test}</div>
                  <div className="text-sm text-muted-foreground">{test.account}</div>
                </div>
                <Badge
                  variant={
                    test.status === 'Complete'
                      ? 'default'
                      : test.status === 'In Progress'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {test.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Sample:</span> {test.sampleSize}
                </div>
                <div>
                  <span className="text-muted-foreground">Tested:</span> {test.tested}
                </div>
                <div>
                  <span className="text-muted-foreground">Exceptions:</span>{' '}
                  <span className={test.exceptions > 0 ? 'text-red-600 font-medium' : ''}>
                    {test.exceptions}
                  </span>
                </div>
              </div>
              {test.tested > 0 && (
                <Progress value={(test.tested / test.sampleSize) * 100} className="h-2 mt-2" />
              )}
            </div>
          ))}
        </div>

        <Button>Add Test</Button>
      </CardContent>
    </Card>
  );
}

/**
 * PBC (Provided By Client) Tracker Component
 * Track items requested from client
 */
function PBCTrackerCard({ engagementId }: { engagementId: string }) {
  const { data: pbcItems, isLoading } = useClientPBCItems(engagementId);
  const { data: overdueItems } = useOverduePBCItems(engagementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Client PBC Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track items requested from client (Provided By Client)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 border rounded-lg text-center">
            <div className="text-xl font-bold">42</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">28</div>
            <div className="text-xs text-green-700">Received</div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-xl font-bold text-yellow-600">9</div>
            <div className="text-xs text-yellow-700">Pending</div>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">5</div>
            <div className="text-xs text-red-700">Overdue</div>
          </div>
        </div>

        {/* Overdue Items Alert */}
        {overdueItems && overdueItems.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <AlertCircle className="h-5 w-5" />
              {overdueItems.length} Overdue Items Require Follow-up
            </div>
            <div className="text-sm text-red-700">
              Contact client to obtain outstanding items
            </div>
          </div>
        )}

        {/* PBC Items List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">PBC Items</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import List
              </Button>
              <Button size="sm">Add Item</Button>
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                item: 'Bank Reconciliations - December 2023',
                category: 'Cash',
                requested: '2024-01-05',
                due: '2024-01-15',
                status: 'Received',
              },
              {
                item: 'AR Aging Report - Year End',
                category: 'Receivables',
                requested: '2024-01-05',
                due: '2024-01-12',
                status: 'Pending',
              },
              {
                item: 'Inventory Count Sheets',
                category: 'Inventory',
                requested: '2024-01-05',
                due: '2024-01-10',
                status: 'Overdue',
              },
              {
                item: 'Payroll Tax Returns (Q4)',
                category: 'Payroll',
                requested: '2024-01-08',
                due: '2024-01-18',
                status: 'Received',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.item}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <Badge variant="outline" className="mr-2">
                      {item.category}
                    </Badge>
                    Due: {new Date(item.due).toLocaleDateString()}
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === 'Received'
                      ? 'default'
                      : item.status === 'Overdue'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Reminder
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
