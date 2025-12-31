/**
 * ==================================================================
 * RELATED PARTIES MANAGER
 * ==================================================================
 * Track and manage related party relationships and transactions
 * per AU-C 550 - Related Parties
 *
 * Features:
 * - Related party identification and documentation
 * - Transaction tracking with amounts
 * - Disclosure requirements tracking
 * - Risk assessment for related party transactions
 * - Management inquiry documentation
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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, AlertTriangle, CheckCircle, Building2, User, DollarSign, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
interface RelatedParty {
  id: string;
  engagement_id: string;
  party_name: string;
  relationship_type: 'owner_shareholder' | 'key_management' | 'family_member' | 'affiliate' | 'subsidiary' | 'joint_venture' | 'pension_plan' | 'other';
  relationship_description: string;
  ownership_percentage?: number;
  contact_name?: string;
  contact_info?: string;
  identified_date: string;
  identified_by: string;
  is_disclosed: boolean;
  disclosure_note_reference?: string;
  risk_assessment: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface RelatedPartyTransaction {
  id: string;
  engagement_id: string;
  related_party_id: string;
  transaction_type: 'sale' | 'purchase' | 'loan' | 'guarantee' | 'lease' | 'service' | 'compensation' | 'dividend' | 'other';
  transaction_description: string;
  transaction_date: string;
  amount: number;
  is_recurring: boolean;
  terms_description?: string;
  arms_length_analysis?: string;
  is_arms_length?: boolean;
  requires_disclosure: boolean;
  is_disclosed: boolean;
  tested: boolean;
  test_result?: string;
  workpaper_reference?: string;
  created_at: string;
  updated_at: string;
}

interface RelatedPartiesManagerProps {
  engagementId: string;
}

export function RelatedPartiesManager({ engagementId }: RelatedPartiesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch related parties
  const { data: parties, isLoading: partiesLoading } = useQuery({
    queryKey: ['related-parties', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('related_parties')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('party_name');

      if (error) throw error;
      return data as RelatedParty[];
    },
    enabled: !!engagementId,
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['related-party-transactions', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('related_party_transactions')
        .select('*, related_party:related_parties(party_name)')
        .eq('engagement_id', engagementId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as (RelatedPartyTransaction & { related_party: { party_name: string } })[];
    },
    enabled: !!engagementId,
  });

  // Dialog state for adding party
  const [isPartyDialogOpen, setIsPartyDialogOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelatedParty['relationship_type']>('owner_shareholder');
  const [relationshipDescription, setRelationshipDescription] = useState('');
  const [ownershipPercentage, setOwnershipPercentage] = useState('');
  const [riskAssessment, setRiskAssessment] = useState<'low' | 'medium' | 'high'>('medium');

  // Dialog state for adding transaction
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [transactionType, setTransactionType] = useState<RelatedPartyTransaction['transaction_type']>('sale');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isArmsLength, setIsArmsLength] = useState(true);
  const [requiresDisclosure, setRequiresDisclosure] = useState(true);

  // Create party mutation
  const createPartyMutation = useMutation({
    mutationFn: async (party: Partial<RelatedParty>) => {
      const { data, error } = await supabase
        .from('related_parties')
        .insert([party])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-parties', engagementId] });
      setIsPartyDialogOpen(false);
      resetPartyForm();
      toast({
        title: 'Related party added',
        description: 'The related party has been documented.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add related party',
        variant: 'destructive',
      });
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: Partial<RelatedPartyTransaction>) => {
      const { data, error } = await supabase
        .from('related_party_transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-party-transactions', engagementId] });
      setIsTransactionDialogOpen(false);
      resetTransactionForm();
      toast({
        title: 'Transaction added',
        description: 'The related party transaction has been documented.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add transaction',
        variant: 'destructive',
      });
    },
  });

  const resetPartyForm = () => {
    setPartyName('');
    setRelationshipType('owner_shareholder');
    setRelationshipDescription('');
    setOwnershipPercentage('');
    setRiskAssessment('medium');
  };

  const resetTransactionForm = () => {
    setSelectedPartyId('');
    setTransactionType('sale');
    setTransactionDescription('');
    setTransactionDate('');
    setTransactionAmount('');
    setIsRecurring(false);
    setIsArmsLength(true);
    setRequiresDisclosure(true);
  };

  const handleCreateParty = () => {
    if (!partyName || !relationshipDescription) {
      toast({
        title: 'Validation Error',
        description: 'Please provide party name and relationship description',
        variant: 'destructive',
      });
      return;
    }

    createPartyMutation.mutate({
      engagement_id: engagementId,
      party_name: partyName,
      relationship_type: relationshipType,
      relationship_description: relationshipDescription,
      ownership_percentage: ownershipPercentage ? parseFloat(ownershipPercentage) : undefined,
      risk_assessment: riskAssessment,
      identified_date: new Date().toISOString(),
      identified_by: 'current_user', // Would come from auth context
      is_disclosed: false,
    });
  };

  const handleCreateTransaction = () => {
    if (!selectedPartyId || !transactionDescription || !transactionDate || !transactionAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createTransactionMutation.mutate({
      engagement_id: engagementId,
      related_party_id: selectedPartyId,
      transaction_type: transactionType,
      transaction_description: transactionDescription,
      transaction_date: transactionDate,
      amount: parseFloat(transactionAmount),
      is_recurring: isRecurring,
      is_arms_length: isArmsLength,
      requires_disclosure: requiresDisclosure,
      is_disclosed: false,
      tested: false,
    });
  };

  // Stats
  const highRiskParties = parties?.filter(p => p.risk_assessment === 'high').length || 0;
  const undisclosedParties = parties?.filter(p => !p.is_disclosed).length || 0;
  const totalTransactionValue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const untestedTransactions = transactions?.filter(t => !t.tested).length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRelationshipLabel = (type: RelatedParty['relationship_type']) => {
    const labels: Record<RelatedParty['relationship_type'], string> = {
      owner_shareholder: 'Owner/Shareholder',
      key_management: 'Key Management',
      family_member: 'Family Member',
      affiliate: 'Affiliate',
      subsidiary: 'Subsidiary',
      joint_venture: 'Joint Venture',
      pension_plan: 'Pension Plan',
      other: 'Other',
    };
    return labels[type];
  };

  const getTransactionTypeLabel = (type: RelatedPartyTransaction['transaction_type']) => {
    const labels: Record<RelatedPartyTransaction['transaction_type'], string> = {
      sale: 'Sale',
      purchase: 'Purchase',
      loan: 'Loan',
      guarantee: 'Guarantee',
      lease: 'Lease',
      service: 'Service',
      compensation: 'Compensation',
      dividend: 'Dividend',
      other: 'Other',
    };
    return labels[type];
  };

  if (partiesLoading || transactionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Parties Manager</CardTitle>
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
              <Users className="h-5 w-5" />
              Related Parties Manager
            </CardTitle>
            <CardDescription>
              Identify, document, and test related party relationships and transactions per AU-C 550
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AU-C 550</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{parties?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Related Parties</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{highRiskParties}</div>
              <div className="text-xs text-muted-foreground mt-1">High Risk</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{transactions?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Transactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalTransactionValue)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Value</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(undisclosedParties > 0 || untestedTransactions > 0) && (
          <div className="space-y-2">
            {undisclosedParties > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <AlertTriangle className="h-5 w-5" />
                  {undisclosedParties} Related Part{undisclosedParties > 1 ? 'ies' : 'y'} Pending Disclosure Review
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Verify that all material related party relationships are properly disclosed in the financial statements.
                </p>
              </div>
            )}
            {untestedTransactions > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <FileText className="h-5 w-5" />
                  {untestedTransactions} Transaction{untestedTransactions > 1 ? 's' : ''} Require Testing
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Document audit procedures performed to verify related party transactions.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="parties">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parties">
              Related Parties
              <Badge variant="secondary" className="ml-2">
                {parties?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions
              <Badge variant="secondary" className="ml-2">
                {transactions?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parties" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isPartyDialogOpen} onOpenChange={setIsPartyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Related Party
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Related Party</DialogTitle>
                      <DialogDescription>
                        Document a related party relationship per AU-C 550
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Party Name *</Label>
                        <Input
                          value={partyName}
                          onChange={(e) => setPartyName(e.target.value)}
                          placeholder="e.g., ABC Holdings LLC"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Relationship Type *</Label>
                          <Select value={relationshipType} onValueChange={(v) => setRelationshipType(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner_shareholder">Owner/Shareholder</SelectItem>
                              <SelectItem value="key_management">Key Management Personnel</SelectItem>
                              <SelectItem value="family_member">Family Member of Key Personnel</SelectItem>
                              <SelectItem value="affiliate">Affiliate Company</SelectItem>
                              <SelectItem value="subsidiary">Subsidiary</SelectItem>
                              <SelectItem value="joint_venture">Joint Venture</SelectItem>
                              <SelectItem value="pension_plan">Pension/Benefit Plan</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ownership % (if applicable)</Label>
                          <Input
                            type="number"
                            value={ownershipPercentage}
                            onChange={(e) => setOwnershipPercentage(e.target.value)}
                            placeholder="e.g., 25"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship Description *</Label>
                        <Textarea
                          value={relationshipDescription}
                          onChange={(e) => setRelationshipDescription(e.target.value)}
                          placeholder="Describe the nature of the relationship..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Risk Assessment *</Label>
                        <Select value={riskAssessment} onValueChange={(v) => setRiskAssessment(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - Routine, well-documented relationship</SelectItem>
                            <SelectItem value="medium">Medium - Requires additional scrutiny</SelectItem>
                            <SelectItem value="high">High - Complex or unusual arrangement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPartyDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateParty} disabled={createPartyMutation.isPending}>
                        Add Related Party
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Parties Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Party Name</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Ownership</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Disclosed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!parties || parties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No related parties documented</p>
                          <p className="text-sm mt-2">Click "Add Related Party" to begin</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      parties.map((party) => (
                        <TableRow key={party.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {party.relationship_type === 'key_management' || party.relationship_type === 'family_member' ? (
                                <User className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              )}
                              {party.party_name}
                            </div>
                          </TableCell>
                          <TableCell>{getRelationshipLabel(party.relationship_type)}</TableCell>
                          <TableCell>
                            {party.ownership_percentage ? `${party.ownership_percentage}%` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                party.risk_assessment === 'high'
                                  ? 'destructive'
                                  : party.risk_assessment === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {party.risk_assessment.charAt(0).toUpperCase() + party.risk_assessment.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {party.is_disclosed ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!parties || parties.length === 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Related Party Transaction</DialogTitle>
                      <DialogDescription>
                        Document a transaction with a related party
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Related Party *</Label>
                        <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select related party" />
                          </SelectTrigger>
                          <SelectContent>
                            {parties?.map((party) => (
                              <SelectItem key={party.id} value={party.id}>
                                {party.party_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Transaction Type *</Label>
                          <Select value={transactionType} onValueChange={(v) => setTransactionType(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sale">Sale of Goods/Services</SelectItem>
                              <SelectItem value="purchase">Purchase of Goods/Services</SelectItem>
                              <SelectItem value="loan">Loan/Advance</SelectItem>
                              <SelectItem value="guarantee">Guarantee</SelectItem>
                              <SelectItem value="lease">Lease Arrangement</SelectItem>
                              <SelectItem value="service">Management/Service Fee</SelectItem>
                              <SelectItem value="compensation">Compensation</SelectItem>
                              <SelectItem value="dividend">Dividend/Distribution</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Transaction Date *</Label>
                          <Input
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={transactionDescription}
                          onChange={(e) => setTransactionDescription(e.target.value)}
                          placeholder="Describe the transaction..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          value={transactionAmount}
                          onChange={(e) => setTransactionAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isRecurring}
                            onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                          />
                          <Label className="text-sm font-normal">Recurring transaction</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isArmsLength}
                            onCheckedChange={(checked) => setIsArmsLength(checked as boolean)}
                          />
                          <Label className="text-sm font-normal">Transaction appears to be at arm's length</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={requiresDisclosure}
                            onCheckedChange={(checked) => setRequiresDisclosure(checked as boolean)}
                          />
                          <Label className="text-sm font-normal">Requires disclosure in financial statements</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTransaction} disabled={createTransactionMutation.isPending}>
                        Add Transaction
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Transactions Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Related Party</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Tested</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!transactions || transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No related party transactions documented</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{transaction.related_party?.party_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.transaction_description}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {transaction.tested ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Professional Guidance */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h5 className="font-medium text-purple-900 mb-2">AU-C 550 Requirements</h5>
          <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
            <li>Inquire of management regarding related party relationships and transactions</li>
            <li>Obtain understanding of controls over related party transactions</li>
            <li>Evaluate whether identified related party transactions were properly authorized</li>
            <li>Inspect underlying documentation for significant related party transactions</li>
            <li>Evaluate whether transactions are at arm's length or require special disclosure</li>
            <li>Communicate significant matters to those charged with governance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
