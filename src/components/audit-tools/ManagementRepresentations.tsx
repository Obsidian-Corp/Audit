/**
 * ==================================================================
 * MANAGEMENT REPRESENTATIONS
 * ==================================================================
 * Generate and track management representation letters per AU-C 580
 *
 * Features:
 * - Standard representation items checklist
 * - Custom representations based on engagement
 * - Letter generation with proper formatting
 * - Tracking of receipt and acknowledgment
 * - Integration with subsequent events and adjustments
 * ==================================================================
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, CheckCircle, AlertTriangle, Download, Send, Calendar, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Standard management representations per AU-C 580
const STANDARD_REPRESENTATIONS = {
  financial_statements: [
    {
      id: 'fs_1',
      category: 'Financial Statements',
      text: 'We have fulfilled our responsibilities, as set out in the terms of the audit engagement, for the preparation and fair presentation of the financial statements in accordance with accounting principles generally accepted in the United States of America.',
      required: true,
    },
    {
      id: 'fs_2',
      category: 'Financial Statements',
      text: 'We acknowledge our responsibility for the design, implementation, and maintenance of internal control relevant to the preparation and fair presentation of financial statements that are free from material misstatement, whether due to fraud or error.',
      required: true,
    },
    {
      id: 'fs_3',
      category: 'Financial Statements',
      text: 'We acknowledge our responsibility for the design, implementation, and maintenance of internal control to prevent and detect fraud.',
      required: true,
    },
    {
      id: 'fs_4',
      category: 'Financial Statements',
      text: 'Significant assumptions used by us in making accounting estimates, including those measured at fair value, are reasonable.',
      required: true,
    },
  ],
  completeness: [
    {
      id: 'comp_1',
      category: 'Completeness',
      text: 'We have provided you with all relevant information and access as agreed in the terms of the audit engagement.',
      required: true,
    },
    {
      id: 'comp_2',
      category: 'Completeness',
      text: 'All transactions have been recorded and are reflected in the financial statements.',
      required: true,
    },
    {
      id: 'comp_3',
      category: 'Completeness',
      text: 'We have disclosed to you the results of our assessment of the risk that the financial statements may be materially misstated as a result of fraud.',
      required: true,
    },
    {
      id: 'comp_4',
      category: 'Completeness',
      text: 'We have disclosed to you all information in relation to fraud or suspected fraud that we are aware of and that affects the entity and involves management, employees who have significant roles in internal control, or others where the fraud could have a material effect on the financial statements.',
      required: true,
    },
    {
      id: 'comp_5',
      category: 'Completeness',
      text: 'We have disclosed to you all information in relation to allegations of fraud, or suspected fraud, affecting the entity\'s financial statements communicated by employees, former employees, analysts, regulators, or others.',
      required: true,
    },
    {
      id: 'comp_6',
      category: 'Completeness',
      text: 'We have disclosed to you all known instances of noncompliance or suspected noncompliance with laws and regulations whose effects should be considered when preparing financial statements.',
      required: true,
    },
    {
      id: 'comp_7',
      category: 'Completeness',
      text: 'We have disclosed to you the identity of the entity\'s related parties and all the related party relationships and transactions of which we are aware.',
      required: true,
    },
  ],
  subsequent_events: [
    {
      id: 'se_1',
      category: 'Subsequent Events',
      text: 'All events occurring subsequent to the date of the financial statements and for which the applicable financial reporting framework requires adjustment or disclosure have been adjusted or disclosed.',
      required: true,
    },
  ],
  litigation: [
    {
      id: 'lit_1',
      category: 'Litigation & Claims',
      text: 'We have disclosed to you all known actual or possible litigation and claims whose effects should be considered when preparing the financial statements.',
      required: true,
    },
  ],
  going_concern: [
    {
      id: 'gc_1',
      category: 'Going Concern',
      text: 'We have disclosed to you all information relevant to the use of the going concern assumption, including significant conditions and events, our plans, and whether the financial statements include all required disclosures.',
      required: false,
    },
  ],
};

interface ManagementRepresentationsProps {
  engagementId: string;
  clientName?: string;
  periodEndDate?: string;
}

interface RepresentationLetter {
  id: string;
  engagement_id: string;
  letter_date: string;
  period_end_date: string;
  addressee: string;
  client_name: string;
  client_signatory_name: string;
  client_signatory_title: string;
  representations: RepresentationItem[];
  custom_representations: string[];
  status: 'draft' | 'sent' | 'received' | 'acknowledged';
  sent_date?: string;
  received_date?: string;
  signed_copy_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface RepresentationItem {
  id: string;
  category: string;
  text: string;
  included: boolean;
  required: boolean;
}

export function ManagementRepresentations({
  engagementId,
  clientName = '[Client Name]',
  periodEndDate,
}: ManagementRepresentationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing letters
  const { data: letters, isLoading } = useQuery({
    queryKey: ['management-representations', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_representation_letters')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RepresentationLetter[];
    },
    enabled: !!engagementId,
  });

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<RepresentationLetter | null>(null);

  // Form state
  const [letterDate, setLetterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [addressee, setAddressee] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [customRepresentations, setCustomRepresentations] = useState<string[]>([]);
  const [newCustomRep, setNewCustomRep] = useState('');

  // Initialize representations with standard items
  const [representations, setRepresentations] = useState<RepresentationItem[]>(() => {
    const allReps: RepresentationItem[] = [];
    Object.values(STANDARD_REPRESENTATIONS).forEach((category) => {
      category.forEach((rep) => {
        allReps.push({ ...rep, included: rep.required });
      });
    });
    return allReps;
  });

  // Create letter mutation
  const createLetterMutation = useMutation({
    mutationFn: async (letter: Partial<RepresentationLetter>) => {
      const { data, error } = await supabase
        .from('management_representation_letters')
        .insert([letter])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-representations', engagementId] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Representation letter created',
        description: 'The management representation letter has been generated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create representation letter',
        variant: 'destructive',
      });
    },
  });

  // Update letter status mutation
  const updateLetterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RepresentationLetter> }) => {
      const { data, error } = await supabase
        .from('management_representation_letters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-representations', engagementId] });
      toast({
        title: 'Letter updated',
        description: 'The representation letter status has been updated.',
      });
    },
  });

  const resetForm = () => {
    setLetterDate(format(new Date(), 'yyyy-MM-dd'));
    setAddressee('');
    setSignatoryName('');
    setSignatoryTitle('');
    setCustomRepresentations([]);
    setNewCustomRep('');
    // Reset representations to defaults
    const allReps: RepresentationItem[] = [];
    Object.values(STANDARD_REPRESENTATIONS).forEach((category) => {
      category.forEach((rep) => {
        allReps.push({ ...rep, included: rep.required });
      });
    });
    setRepresentations(allReps);
  };

  const toggleRepresentation = (id: string) => {
    setRepresentations((prev) =>
      prev.map((rep) =>
        rep.id === id && !rep.required ? { ...rep, included: !rep.included } : rep
      )
    );
  };

  const addCustomRepresentation = () => {
    if (newCustomRep.trim()) {
      setCustomRepresentations((prev) => [...prev, newCustomRep.trim()]);
      setNewCustomRep('');
    }
  };

  const removeCustomRepresentation = (index: number) => {
    setCustomRepresentations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateLetter = () => {
    if (!addressee || !signatoryName || !signatoryTitle) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createLetterMutation.mutate({
      engagement_id: engagementId,
      letter_date: letterDate,
      period_end_date: periodEndDate || format(new Date(), 'yyyy-MM-dd'),
      addressee,
      client_name: clientName,
      client_signatory_name: signatoryName,
      client_signatory_title: signatoryTitle,
      representations: representations.filter((r) => r.included),
      custom_representations: customRepresentations,
      status: 'draft',
    });
  };

  // Group representations by category for display
  const groupedRepresentations = useMemo(() => {
    const grouped: Record<string, RepresentationItem[]> = {};
    representations.forEach((rep) => {
      if (!grouped[rep.category]) {
        grouped[rep.category] = [];
      }
      grouped[rep.category].push(rep);
    });
    return grouped;
  }, [representations]);

  // Generate letter preview HTML
  const generateLetterHTML = (letter: RepresentationLetter) => {
    const includedReps = letter.representations || [];
    const customReps = letter.custom_representations || [];

    return `
      <div style="font-family: 'Times New Roman', serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.6;">
        <p style="text-align: right;">${format(new Date(letter.letter_date), 'MMMM d, yyyy')}</p>

        <p style="margin-top: 2em;">
          ${letter.addressee}<br/>
          [Firm Address]
        </p>

        <p style="margin-top: 2em;">
          This representation letter is provided in connection with your audit of the financial statements of
          ${letter.client_name}, which comprise the balance sheet as of ${format(new Date(letter.period_end_date), 'MMMM d, yyyy')},
          and the related statements of income, changes in stockholders' equity, and cash flows for the year then ended,
          and the related notes to the financial statements, for the purpose of expressing an opinion on whether the
          financial statements are presented fairly, in all material respects, in accordance with accounting principles
          generally accepted in the United States of America.
        </p>

        <p>
          Certain representations in this letter are described as being limited to matters that are material.
          Items are considered material, regardless of size, if they involve an omission or misstatement of
          accounting information that, in the light of surrounding circumstances, makes it probable that the
          judgment of a reasonable person relying on the information would be changed or influenced by the
          omission or misstatement.
        </p>

        <p>We confirm that, to the best of our knowledge and belief, having made such inquiries as we considered necessary for the purpose of appropriately informing ourselves:</p>

        ${Object.entries(
          includedReps.reduce((acc, rep) => {
            if (!acc[rep.category]) acc[rep.category] = [];
            acc[rep.category].push(rep);
            return acc;
          }, {} as Record<string, RepresentationItem[]>)
        )
          .map(
            ([category, reps]) => `
          <p style="margin-top: 1.5em;"><strong>${category}</strong></p>
          <ul style="margin-left: 2em;">
            ${reps.map((rep) => `<li style="margin-bottom: 0.5em;">${rep.text}</li>`).join('')}
          </ul>
        `
          )
          .join('')}

        ${
          customReps.length > 0
            ? `
          <p style="margin-top: 1.5em;"><strong>Additional Representations</strong></p>
          <ul style="margin-left: 2em;">
            ${customReps.map((rep) => `<li style="margin-bottom: 0.5em;">${rep}</li>`).join('')}
          </ul>
        `
            : ''
        }

        <div style="margin-top: 3em;">
          <p>______________________________</p>
          <p>${letter.client_signatory_name}<br/>
          ${letter.client_signatory_title}</p>
        </div>

        <div style="margin-top: 2em;">
          <p>______________________________</p>
          <p>[Additional Signatory if required]</p>
        </div>
      </div>
    `;
  };

  const getStatusBadge = (status: RepresentationLetter['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'received':
        return <Badge className="bg-blue-600">Received</Badge>;
      case 'acknowledged':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Acknowledged
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Management Representations</CardTitle>
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
              <FileText className="h-5 w-5" />
              Management Representations
            </CardTitle>
            <CardDescription>
              Generate and track management representation letters per AU-C 580
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AU-C 580</Badge>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Letter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create Management Representation Letter</DialogTitle>
                  <DialogDescription>
                    Generate a management representation letter per AU-C 580
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6 py-4">
                    {/* Letter Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Letter Date *</Label>
                        <Input
                          type="date"
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Addressee (Firm Name) *</Label>
                        <Input
                          value={addressee}
                          onChange={(e) => setAddressee(e.target.value)}
                          placeholder="e.g., Smith & Associates, CPAs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client Signatory Name *</Label>
                        <Input
                          value={signatoryName}
                          onChange={(e) => setSignatoryName(e.target.value)}
                          placeholder="e.g., John Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Signatory Title *</Label>
                        <Input
                          value={signatoryTitle}
                          onChange={(e) => setSignatoryTitle(e.target.value)}
                          placeholder="e.g., Chief Financial Officer"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Standard Representations */}
                    <div>
                      <h4 className="font-medium mb-4">Standard Representations</h4>
                      <div className="space-y-6">
                        {Object.entries(groupedRepresentations).map(([category, reps]) => (
                          <div key={category} className="space-y-3">
                            <h5 className="text-sm font-medium text-muted-foreground">{category}</h5>
                            {reps.map((rep) => (
                              <div
                                key={rep.id}
                                className={`p-3 border rounded-lg ${
                                  rep.included ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={rep.included}
                                    onCheckedChange={() => toggleRepresentation(rep.id)}
                                    disabled={rep.required}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm">{rep.text}</p>
                                    {rep.required && (
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Custom Representations */}
                    <div>
                      <h4 className="font-medium mb-4">Custom Representations</h4>
                      <div className="space-y-3">
                        {customRepresentations.map((rep, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg bg-blue-50 border-blue-200 flex items-start justify-between gap-3"
                          >
                            <p className="text-sm flex-1">{rep}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomRepresentation(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Textarea
                            value={newCustomRep}
                            onChange={(e) => setNewCustomRep(e.target.value)}
                            placeholder="Add a custom representation..."
                            rows={2}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={addCustomRepresentation}
                            disabled={!newCustomRep.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLetter} disabled={createLetterMutation.isPending}>
                    Create Letter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{letters?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Letters</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {letters?.filter((l) => l.status === 'draft').length || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Draft</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {letters?.filter((l) => l.status === 'sent').length || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Awaiting Response</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {letters?.filter((l) => l.status === 'acknowledged').length || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Acknowledged</div>
            </CardContent>
          </Card>
        </div>

        {/* Letters List */}
        <div className="space-y-3">
          {!letters || letters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No representation letters created</p>
              <p className="text-sm mt-2">Click "Create Letter" to generate a management representation letter</p>
            </div>
          ) : (
            letters.map((letter) => (
              <div key={letter.id} className="p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {letter.client_name} - {format(new Date(letter.period_end_date), 'MMM d, yyyy')}
                      </span>
                      {getStatusBadge(letter.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Letter Date: {format(new Date(letter.letter_date), 'MMM d, yyyy')}
                      </p>
                      <p>
                        Signatory: {letter.client_signatory_name}, {letter.client_signatory_title}
                      </p>
                      <p>
                        {letter.representations?.length || 0} standard representations
                        {letter.custom_representations?.length > 0 &&
                          ` + ${letter.custom_representations.length} custom`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLetter(letter);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    {letter.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateLetterMutation.mutate({
                            id: letter.id,
                            updates: { status: 'sent', sent_date: new Date().toISOString() },
                          })
                        }
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Mark Sent
                      </Button>
                    )}
                    {letter.status === 'sent' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateLetterMutation.mutate({
                            id: letter.id,
                            updates: { status: 'received', received_date: new Date().toISOString() },
                          })
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Received
                      </Button>
                    )}
                    {letter.status === 'received' && (
                      <Button
                        size="sm"
                        className="bg-green-600"
                        onClick={() =>
                          updateLetterMutation.mutate({
                            id: letter.id,
                            updates: { status: 'acknowledged' },
                          })
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Letter Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Management Representation Letter Preview</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              {selectedLetter && (
                <div
                  className="bg-white p-4 border rounded"
                  dangerouslySetInnerHTML={{ __html: generateLetterHTML(selectedLetter) }}
                />
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Professional Guidance */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h5 className="font-medium text-purple-900 mb-2">AU-C 580 Requirements</h5>
          <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
            <li>Request written representations from management with appropriate responsibilities</li>
            <li>Date the representation letter as of the date of the auditor's report</li>
            <li>
              If management does not provide requested representations, determine effect on audit opinion
            </li>
            <li>Written representations cannot substitute for other audit evidence</li>
            <li>Address the letter to the auditor and have it signed by appropriate management</li>
            <li>
              For group audits, request representations from component management as appropriate
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
