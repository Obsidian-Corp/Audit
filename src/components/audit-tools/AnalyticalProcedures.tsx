/**
 * ==================================================================
 * ANALYTICAL PROCEDURES
 * ==================================================================
 * Perform analytical procedures per AU-C 520
 * - Ratio Analysis
 * - Trend Analysis
 * - Variance Analysis (>10% flagged)
 * - Explanation documentation
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Plus, AlertTriangle, BarChart3 } from 'lucide-react';
import { useAnalyticalProcedures, useCreateAnalyticalProcedure } from '@/hooks/useAuditTools';
import { useToast } from '@/hooks/use-toast';

interface AnalyticalProceduresProps {
  engagementId: string;
}

export function AnalyticalProcedures({ engagementId }: AnalyticalProceduresProps) {
  const { toast } = useToast();
  const { data: procedures, isLoading } = useAnalyticalProcedures(engagementId);
  const createProcedure = useCreateAnalyticalProcedure();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [procedureType, setProcedureType] = useState('ratio_analysis');
  const [account, setAccount] = useState('');
  const [currentYearAmount, setCurrentYearAmount] = useState('');
  const [priorYearAmount, setPriorYearAmount] = useState('');
  const [explanation, setExplanation] = useState('');

  // Reset form
  const resetForm = () => {
    setAccount('');
    setCurrentYearAmount('');
    setPriorYearAmount('');
    setExplanation('');
  };

  // Calculate variance
  const calculateVariance = (current: number, prior: number) => {
    if (!prior) return 0;
    return ((current - prior) / prior) * 100;
  };

  // Handle create
  const handleCreate = async () => {
    const current = parseFloat(currentYearAmount) || 0;
    const prior = parseFloat(priorYearAmount) || 0;
    const variance = calculateVariance(current, prior);

    if (!account || !current) {
      toast({
        title: 'Validation Error',
        description: 'Please provide account and current year amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createProcedure.mutateAsync({
        engagement_id: engagementId,
        procedure_type: procedureType,
        account,
        current_year_amount: current,
        prior_year_amount: prior,
        variance_percentage: variance,
        explanation: explanation || null,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create analytical procedure',
        variant: 'destructive',
      });
    }
  };

  // Filter procedures by type
  const ratioAnalysis = procedures?.filter((p) => p.procedure_type === 'ratio_analysis');
  const trendAnalysis = procedures?.filter((p) => p.procedure_type === 'trend_analysis');
  const varianceAnalysis = procedures?.filter((p) => p.procedure_type === 'variance_analysis');

  // Count significant variances (>10%)
  const significantVariances = procedures?.filter(
    (p) => Math.abs(p.variance_percentage || 0) > 10
  ).length || 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Render procedure table
  const renderProcedureTable = (list: any[] = [], type: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} procedures yet</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Current Year</TableHead>
            <TableHead className="text-right">Prior Year</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
            <TableHead>Explanation</TableHead>
            <TableHead>Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((proc) => {
            const variance = proc.variance_percentage || 0;
            const isSignificant = Math.abs(variance) > 10;

            return (
              <TableRow key={proc.id} className={isSignificant ? 'bg-amber-50' : ''}>
                <TableCell className="font-medium">{proc.account}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(proc.current_year_amount)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(proc.prior_year_amount || 0)}
                </TableCell>
                <TableCell className={`text-right font-bold ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''}`}>
                  {formatPercentage(variance)}
                </TableCell>
                <TableCell className="max-w-xs truncate">{proc.explanation || '-'}</TableCell>
                <TableCell>
                  {isSignificant && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {'>'} 10%
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytical Procedures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytical Procedures
            </CardTitle>
            <CardDescription>Perform ratio, trend, and variance analysis per AU-C 520</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AU-C 520</Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Procedure
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Analytical Procedure</DialogTitle>
                  <DialogDescription>Create a new analytical procedure</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Procedure Type</Label>
                    <Select value={procedureType} onValueChange={setProcedureType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ratio_analysis">Ratio Analysis</SelectItem>
                        <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                        <SelectItem value="variance_analysis">Variance Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account *</Label>
                    <Input
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="e.g., Revenue, Gross Profit"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current Year Amount *</Label>
                      <Input
                        type="number"
                        value={currentYearAmount}
                        onChange={(e) => setCurrentYearAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prior Year Amount</Label>
                      <Input
                        type="number"
                        value={priorYearAmount}
                        onChange={(e) => setPriorYearAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {priorYearAmount && currentYearAmount && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Calculated Variance</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {formatPercentage(
                          calculateVariance(
                            parseFloat(currentYearAmount),
                            parseFloat(priorYearAmount)
                          )
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Explanation (Required if variance {'>'}10%)</Label>
                    <Textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Explain the variance..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createProcedure.isPending}>
                    Create Procedure
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{procedures?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Procedures</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{ratioAnalysis?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Ratio Analysis</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{trendAnalysis?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Trend Analysis</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{significantVariances}</div>
              <div className="text-xs text-muted-foreground mt-1">Significant Variances</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for significant variances */}
        {significantVariances > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
              <AlertTriangle className="h-5 w-5" />
              {significantVariances} Significant Variance{significantVariances > 1 ? 's' : ''} Detected
            </div>
            <p className="text-sm text-amber-700">
              Variances exceeding 10% require documentation and explanation. Please investigate and
              document the reasons for significant fluctuations.
            </p>
          </div>
        )}

        {/* Tabs for different procedure types */}
        <Tabs defaultValue="ratio">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ratio">
              Ratio Analysis
              <Badge variant="secondary" className="ml-2">
                {ratioAnalysis?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="trend">
              Trend Analysis
              <Badge variant="secondary" className="ml-2">
                {trendAnalysis?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="variance">
              Variance Analysis
              <Badge variant="secondary" className="ml-2">
                {varianceAnalysis?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ratio" className="mt-4">
            <div className="border rounded-lg">{renderProcedureTable(ratioAnalysis, 'Ratio')}</div>
          </TabsContent>

          <TabsContent value="trend" className="mt-4">
            <div className="border rounded-lg">{renderProcedureTable(trendAnalysis, 'Trend')}</div>
          </TabsContent>

          <TabsContent value="variance" className="mt-4">
            <div className="border rounded-lg">
              {renderProcedureTable(varianceAnalysis, 'Variance')}
            </div>
          </TabsContent>
        </Tabs>

        {/* Common Ratios Reference */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-3">Common Financial Ratios</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium text-blue-800">Liquidity Ratios</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>Current Ratio = Current Assets / Current Liabilities</li>
                <li>Quick Ratio = (Current Assets - Inventory) / Current Liabilities</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800">Profitability Ratios</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>Gross Profit Margin = Gross Profit / Revenue</li>
                <li>Net Profit Margin = Net Income / Revenue</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800">Efficiency Ratios</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>AR Turnover = Revenue / Average AR</li>
                <li>Inventory Turnover = COGS / Average Inventory</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800">Leverage Ratios</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>Debt-to-Equity = Total Debt / Total Equity</li>
                <li>Interest Coverage = EBIT / Interest Expense</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Professional Guidance */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h5 className="font-medium text-purple-900 mb-2">Analytical Procedures Guidelines</h5>
          <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
            <li>Use analytical procedures in planning, testing, and final review stages</li>
            <li>Investigate variances exceeding 10% threshold or predetermined tolerance</li>
            <li>Document expectations and compare to actual results</li>
            <li>Consider industry benchmarks and economic conditions</li>
            <li>Follow up on unusual trends or relationships</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
