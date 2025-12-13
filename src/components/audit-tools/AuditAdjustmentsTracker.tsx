/**
 * ==================================================================
 * AUDIT ADJUSTMENTS TRACKER
 * ==================================================================
 * Track audit adjustments per AU-C 450
 * - SAJ (Summary of Adjusting Entries) - Posted
 * - PJE (Passed Journal Entries) - Not Posted
 * - SUM (Summary of Uncorrected Misstatements)
 * - Materiality comparison
 * - Financial statement impact
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
import { DollarSign, Plus, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useAuditAdjustments, useCreateAuditAdjustment, useMateriality } from '@/hooks/useAuditTools';
import { useToast } from '@/hooks/use-toast';

interface AuditAdjustmentsTrackerProps {
  engagementId: string;
}

export function AuditAdjustmentsTracker({ engagementId }: AuditAdjustmentsTrackerProps) {
  const { toast } = useToast();
  const { data: adjustments, isLoading } = useAuditAdjustments(engagementId);
  const { data: materiality } = useMateriality(engagementId);
  const createAdjustment = useCreateAuditAdjustment();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'SAJ' | 'PJE' | 'SUM'>('SAJ');
  const [account, setAccount] = useState('');
  const [description, setDescription] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  // Reset form
  const resetForm = () => {
    setAccount('');
    setDescription('');
    setDebitAmount('');
    setCreditAmount('');
  };

  // Handle create
  const handleCreate = async () => {
    const debit = parseFloat(debitAmount) || 0;
    const credit = parseFloat(creditAmount) || 0;

    if (!account || !description) {
      toast({
        title: 'Validation Error',
        description: 'Please provide account and description',
        variant: 'destructive',
      });
      return;
    }

    if (debit === 0 && credit === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter either debit or credit amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAdjustment.mutateAsync({
        engagement_id: engagementId,
        adjustment_type: adjustmentType,
        account,
        description,
        debit_amount: debit,
        credit_amount: credit,
        status: adjustmentType === 'SAJ' ? 'accepted' : adjustmentType === 'PJE' ? 'rejected' : 'proposed',
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create adjustment',
        variant: 'destructive',
      });
    }
  };

  // Filter adjustments by type
  const sajAdjustments = adjustments?.filter((a) => a.adjustment_type === 'SAJ');
  const pjeAdjustments = adjustments?.filter((a) => a.adjustment_type === 'PJE');
  const sumAdjustments = adjustments?.filter((a) => a.adjustment_type === 'SUM');

  // Calculate totals
  const calculateTotal = (list: any[] = []) => {
    return list.reduce((sum, adj) => {
      const amount = Math.abs((adj.debit_amount || 0) - (adj.credit_amount || 0));
      return sum + amount;
    }, 0);
  };

  const sajTotal = calculateTotal(sajAdjustments);
  const pjeTotal = calculateTotal(pjeAdjustments);
  const sumTotal = calculateTotal(sumAdjustments);

  // Get materiality thresholds
  const overallMateriality = materiality && materiality.length > 0 ? materiality[0].overall_materiality : 0;
  const clearlyTrivialThreshold = materiality && materiality.length > 0 ? materiality[0].clearly_trivial_threshold : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Render adjustment table
  const renderAdjustmentTable = (list: any[] = [], type: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} adjustments yet</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Impact</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((adj) => {
            const impact = Math.abs((adj.debit_amount || 0) - (adj.credit_amount || 0));
            return (
              <TableRow key={adj.id}>
                <TableCell className="font-medium">{adj.account}</TableCell>
                <TableCell className="max-w-xs truncate">{adj.description}</TableCell>
                <TableCell className="text-right font-mono">
                  {adj.debit_amount ? formatCurrency(adj.debit_amount) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {adj.credit_amount ? formatCurrency(adj.credit_amount) : '-'}
                </TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(impact)}</TableCell>
                <TableCell>
                  {adj.status === 'accepted' && (
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Posted
                    </Badge>
                  )}
                  {adj.status === 'rejected' && (
                    <Badge variant="outline">Passed</Badge>
                  )}
                  {adj.status === 'proposed' && <Badge variant="secondary">Proposed</Badge>}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell colSpan={4} className="text-right">
              Total {type}:
            </TableCell>
            <TableCell className="text-right">{formatCurrency(calculateTotal(list))}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Adjustments Tracker</CardTitle>
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
              <DollarSign className="h-5 w-5" />
              Audit Adjustments Tracker
            </CardTitle>
            <CardDescription>Track SAJ, PJE, and SUM per AU-C 450</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AU-C 450</Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Adjustment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Audit Adjustment</DialogTitle>
                  <DialogDescription>Create a new audit adjustment entry</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Adjustment Type</Label>
                    <Select
                      value={adjustmentType}
                      onValueChange={(value) => setAdjustmentType(value as 'SAJ' | 'PJE' | 'SUM')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAJ">SAJ - Summary of Adjusting Entries (Posted)</SelectItem>
                        <SelectItem value="PJE">PJE - Passed Journal Entries (Not Posted)</SelectItem>
                        <SelectItem value="SUM">
                          SUM - Summary of Uncorrected Misstatements
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account *</Label>
                    <Input
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="e.g., Accounts Receivable"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the adjustment..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Debit Amount</Label>
                      <Input
                        type="number"
                        value={debitAmount}
                        onChange={(e) => setDebitAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Amount</Label>
                      <Input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createAdjustment.isPending}>
                    Create Adjustment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-xs text-muted-foreground mb-2">SAJ - Posted</div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(sajTotal)}</div>
              <div className="text-xs text-muted-foreground mt-2">{sajAdjustments?.length || 0} entries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-xs text-muted-foreground mb-2">PJE - Passed</div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(pjeTotal)}</div>
              <div className="text-xs text-muted-foreground mt-2">{pjeAdjustments?.length || 0} entries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-xs text-muted-foreground mb-2">SUM - Uncorrected</div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(sumTotal)}</div>
              <div className="text-xs text-muted-foreground mt-2">{sumAdjustments?.length || 0} entries</div>
            </CardContent>
          </Card>
        </div>

        {/* Materiality Comparison */}
        {materiality && materiality.length > 0 && (
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Materiality Assessment
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Overall Materiality</div>
                  <div className="text-xl font-bold mt-1">{formatCurrency(overallMateriality)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Clearly Trivial Threshold</div>
                  <div className="text-xl font-bold mt-1">{formatCurrency(clearlyTrivialThreshold)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">SUM Total</div>
                  <div className={`text-xl font-bold mt-1 ${sumTotal > clearlyTrivialThreshold ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(sumTotal)}
                  </div>
                </div>
              </div>
              {sumTotal > clearlyTrivialThreshold ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    SUM Exceeds Clearly Trivial Threshold
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Total uncorrected misstatements ({formatCurrency(sumTotal)}) exceed the clearly trivial
                    threshold ({formatCurrency(clearlyTrivialThreshold)}). Consider requesting client to
                    post additional adjustments.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    SUM Below Clearly Trivial Threshold
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Total uncorrected misstatements ({formatCurrency(sumTotal)}) are below the clearly
                    trivial threshold ({formatCurrency(clearlyTrivialThreshold)}). No further action
                    required.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for different adjustment types */}
        <Tabs defaultValue="saj">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="saj">
              SAJ
              <Badge variant="secondary" className="ml-2">
                {sajAdjustments?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pje">
              PJE
              <Badge variant="secondary" className="ml-2">
                {pjeAdjustments?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sum">
              SUM
              <Badge variant="secondary" className="ml-2">
                {sumAdjustments?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saj" className="mt-4">
            <div className="border rounded-lg">{renderAdjustmentTable(sajAdjustments, 'SAJ')}</div>
          </TabsContent>

          <TabsContent value="pje" className="mt-4">
            <div className="border rounded-lg">{renderAdjustmentTable(pjeAdjustments, 'PJE')}</div>
          </TabsContent>

          <TabsContent value="sum" className="mt-4">
            <div className="border rounded-lg">{renderAdjustmentTable(sumAdjustments, 'SUM')}</div>
          </TabsContent>
        </Tabs>

        {/* Professional Guidance */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 className="font-medium text-amber-900 mb-2">Adjustment Guidelines</h5>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>
              <strong>SAJ:</strong> Adjustments posted by client (correcting errors found during audit)
            </li>
            <li>
              <strong>PJE:</strong> Proposed adjustments that client chose not to post (passed)
            </li>
            <li>
              <strong>SUM:</strong> Total of all uncorrected misstatements for materiality evaluation
            </li>
            <li>If SUM exceeds CTT, document communication with management and those charged with governance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
