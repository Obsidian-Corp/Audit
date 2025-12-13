/**
 * ==================================================================
 * CONFIRMATION TRACKER
 * ==================================================================
 * Track external confirmations per AU-C 505
 * - Accounts Receivable confirmations
 * - Accounts Payable confirmations
 * - Bank confirmations
 * - Response tracking and exception management
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
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Plus, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { useConfirmations, useCreateConfirmation, useUpdateConfirmation } from '@/hooks/useAuditTools';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ConfirmationTrackerProps {
  engagementId: string;
}

export function ConfirmationTracker({ engagementId }: ConfirmationTrackerProps) {
  const { toast } = useToast();
  const { data: confirmations, isLoading } = useConfirmations(engagementId);
  const createConfirmation = useCreateConfirmation();
  const updateConfirmation = useUpdateConfirmation();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState('accounts_receivable');
  const [customerVendorName, setCustomerVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmationDate, setConfirmationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Reset form
  const resetForm = () => {
    setConfirmationType('accounts_receivable');
    setCustomerVendorName('');
    setAmount('');
    setConfirmationDate(new Date().toISOString().split('T')[0]);
  };

  // Handle create
  const handleCreate = async () => {
    if (!customerVendorName || !amount) {
      toast({
        title: 'Validation Error',
        description: 'Please provide name and amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createConfirmation.mutateAsync({
        engagement_id: engagementId,
        confirmation_type: confirmationType,
        customer_vendor_name: customerVendorName,
        amount: parseFloat(amount),
        confirmation_date: confirmationDate,
        response_received: false,
        exceptions: null,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create confirmation',
        variant: 'destructive',
      });
    }
  };

  // Handle response update
  const handleResponseUpdate = async (id: string, received: boolean, exceptions?: string) => {
    try {
      await updateConfirmation.mutateAsync({
        id,
        updates: {
          response_received: received,
          exceptions: exceptions || null,
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update confirmation',
        variant: 'destructive',
      });
    }
  };

  // Filter confirmations by type
  const arConfirmations = confirmations?.filter(
    (c) => c.confirmation_type === 'accounts_receivable'
  );
  const apConfirmations = confirmations?.filter(
    (c) => c.confirmation_type === 'accounts_payable'
  );
  const bankConfirmations = confirmations?.filter((c) => c.confirmation_type === 'bank');

  // Calculate stats
  const calculateStats = (list: any[] = []) => {
    const sent = list.length;
    const received = list.filter((c) => c.response_received).length;
    const pending = sent - received;
    const exceptions = list.filter((c) => c.exceptions).length;
    const responseRate = sent > 0 ? Math.round((received / sent) * 100) : 0;

    return { sent, received, pending, exceptions, responseRate };
  };

  const totalStats = calculateStats(confirmations);
  const arStats = calculateStats(arConfirmations);
  const apStats = calculateStats(apConfirmations);
  const bankStats = calculateStats(bankConfirmations);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Render confirmation table
  const renderConfirmationTable = (list: any[] = [], type: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} confirmations yet</p>
          <p className="text-sm mt-2">Click "Add Confirmation" to create one</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Sent Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Exceptions</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((confirmation) => (
            <TableRow key={confirmation.id}>
              <TableCell className="font-medium">{confirmation.customer_vendor_name}</TableCell>
              <TableCell>{formatCurrency(confirmation.amount)}</TableCell>
              <TableCell>{format(new Date(confirmation.confirmation_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                {confirmation.response_received ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Received
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {confirmation.exceptions ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {!confirmation.response_received && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResponseUpdate(confirmation.id, true)}
                  >
                    Mark Received
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Tracker</CardTitle>
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
              <Mail className="h-5 w-5" />
              Confirmation Tracker
            </CardTitle>
            <CardDescription>Track external confirmations per AU-C 505</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AU-C 505</Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Confirmation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Confirmation Request</DialogTitle>
                  <DialogDescription>Create a new confirmation to send</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Confirmation Type</Label>
                    <Select value={confirmationType} onValueChange={setConfirmationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accounts_receivable">Accounts Receivable</SelectItem>
                        <SelectItem value="accounts_payable">Accounts Payable</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Customer/Vendor/Bank Name *</Label>
                    <Input
                      value={customerVendorName}
                      onChange={(e) => setCustomerVendorName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmation Date</Label>
                      <Input
                        type="date"
                        value={confirmationDate}
                        onChange={(e) => setConfirmationDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createConfirmation.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    Create Confirmation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats Dashboard */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalStats.sent}</div>
              <div className="text-xs text-muted-foreground mt-1">Sent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totalStats.received}</div>
              <div className="text-xs text-muted-foreground mt-1">Received</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalStats.pending}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{totalStats.exceptions}</div>
              <div className="text-xs text-muted-foreground mt-1">Exceptions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{totalStats.responseRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Response Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">
              {totalStats.received} / {totalStats.sent} ({totalStats.responseRate}%)
            </span>
          </div>
          <Progress value={totalStats.responseRate} className="h-3" />
        </div>

        {/* Tabs for different confirmation types */}
        <Tabs defaultValue="ar" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ar">
              Accounts Receivable
              <Badge variant="secondary" className="ml-2">
                {arConfirmations?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="ap">
              Accounts Payable
              <Badge variant="secondary" className="ml-2">
                {apConfirmations?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="bank">
              Bank
              <Badge variant="secondary" className="ml-2">
                {bankConfirmations?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ar" className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Sent</div>
                  <div className="text-xl font-bold mt-1">{arStats.sent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Received</div>
                  <div className="text-xl font-bold mt-1 text-green-600">{arStats.received}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-xl font-bold mt-1 text-yellow-600">{arStats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                  <div className="text-xl font-bold mt-1 text-blue-600">{arStats.responseRate}%</div>
                </CardContent>
              </Card>
            </div>
            <div className="border rounded-lg">
              {renderConfirmationTable(arConfirmations, 'AR')}
            </div>
          </TabsContent>

          <TabsContent value="ap" className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Sent</div>
                  <div className="text-xl font-bold mt-1">{apStats.sent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Received</div>
                  <div className="text-xl font-bold mt-1 text-green-600">{apStats.received}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-xl font-bold mt-1 text-yellow-600">{apStats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                  <div className="text-xl font-bold mt-1 text-blue-600">{apStats.responseRate}%</div>
                </CardContent>
              </Card>
            </div>
            <div className="border rounded-lg">
              {renderConfirmationTable(apConfirmations, 'AP')}
            </div>
          </TabsContent>

          <TabsContent value="bank" className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Sent</div>
                  <div className="text-xl font-bold mt-1">{bankStats.sent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Received</div>
                  <div className="text-xl font-bold mt-1 text-green-600">{bankStats.received}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-xl font-bold mt-1 text-yellow-600">{bankStats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                  <div className="text-xl font-bold mt-1 text-blue-600">{bankStats.responseRate}%</div>
                </CardContent>
              </Card>
            </div>
            <div className="border rounded-lg">
              {renderConfirmationTable(bankConfirmations, 'Bank')}
            </div>
          </TabsContent>
        </Tabs>

        {/* Professional Guidance */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Confirmation Best Practices</h5>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Send confirmations directly to third parties (not through client)</li>
            <li>Follow up on non-responses after 2-3 weeks</li>
            <li>Document all exceptions and investigate discrepancies</li>
            <li>Consider alternative procedures if response rate is below 70%</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
