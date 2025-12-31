/**
 * ==================================================================
 * ENGAGEMENT LETTER GENERATOR
 * ==================================================================
 * Generate professional engagement letters with templates
 * ==================================================================
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Send,
  Eye,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { generateEngagementLetterPDF } from '@/lib/pdf-generation';

interface EngagementLetterGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagement: any;
}

type LetterType = 'engagement' | 'representation' | 'independence' | 'tcwg';

const LETTER_TYPES: { value: LetterType; label: string; description: string }[] = [
  {
    value: 'engagement',
    label: 'Engagement Letter',
    description: 'Initial engagement terms and scope',
  },
  {
    value: 'representation',
    label: 'Management Representation',
    description: 'Management assertions and confirmations',
  },
  {
    value: 'independence',
    label: 'Independence Confirmation',
    description: 'Auditor independence declaration',
  },
  {
    value: 'tcwg',
    label: 'TCWG Communication',
    description: 'Communication with Those Charged with Governance',
  },
];

export function EngagementLetterGenerator({
  open,
  onOpenChange,
  engagement,
}: EngagementLetterGeneratorProps) {
  const { toast } = useToast();
  const [letterType, setLetterType] = useState<LetterType>('engagement');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [formData, setFormData] = useState({
    addressee: '',
    addresseeTitle: '',
    customTerms: '',
    estimatedFees: '',
    billingTerms: 'Net 30 days',
    fieldworkStart: '',
    fieldworkEnd: '',
    reportDelivery: '',
  });

  // Initialize form with engagement data
  useState(() => {
    if (engagement) {
      setFormData((prev) => ({
        ...prev,
        addressee: engagement.clients?.client_name || '',
        fieldworkStart: engagement.fieldwork_start || '',
        fieldworkEnd: engagement.fieldwork_end || '',
        reportDelivery: engagement.report_due_date || '',
        estimatedFees: engagement.budget_allocated?.toString() || '',
      }));
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Generate PDF using our PDF generator
      const template = {
        date: new Date(),
        clientName: engagement?.clients?.client_name || 'Client',
        addressee: formData.addressee || 'Management',
        engagementObjective: `We are pleased to confirm our understanding of the services we are to provide for ${engagement?.clients?.client_name || 'the Company'}. This letter confirms the arrangements for our audit of the financial statements for the year ended ${engagement?.period_end ? format(new Date(engagement.period_end), 'MMMM d, yyyy') : '[Period End]'}.`,
        scope: `We will audit the financial statements of ${engagement?.clients?.client_name || 'the Company'}, which comprise the balance sheet as of ${engagement?.period_end ? format(new Date(engagement.period_end), 'MMMM d, yyyy') : '[Period End]'}, and the related statements of income, changes in equity, and cash flows for the year then ended, and the related notes to the financial statements.`,
        managementResponsibilities: [
          'Preparation and fair presentation of the financial statements in accordance with the applicable financial reporting framework',
          'Design, implementation, and maintenance of internal control relevant to the preparation and fair presentation of financial statements',
          'Providing us with access to all information relevant to the preparation of the financial statements',
          'Providing written representations at the conclusion of the engagement',
        ],
        auditorResponsibilities: [
          'Conduct the audit in accordance with auditing standards generally accepted in the United States of America',
          'Obtain reasonable assurance about whether the financial statements are free from material misstatement',
          'Express an opinion on the financial statements based on our audit',
          'Communicate significant findings to those charged with governance',
        ],
        limitations: [
          'An audit does not provide assurance about future viability or efficiency of operations',
          'Our audit is not designed to detect fraud or error that is immaterial to the financial statements',
        ],
        fees: {
          estimatedFees: parseFloat(formData.estimatedFees) || 0,
          billingTerms: formData.billingTerms,
          additionalCharges: 'Additional services requested will be billed at our standard hourly rates',
        },
        timing: {
          fieldworkStart: formData.fieldworkStart ? new Date(formData.fieldworkStart) : new Date(),
          fieldworkEnd: formData.fieldworkEnd ? new Date(formData.fieldworkEnd) : new Date(),
          reportDelivery: formData.reportDelivery ? new Date(formData.reportDelivery) : new Date(),
        },
        acceptanceBlock: {
          clientSignature: false,
          firmSignature: false,
        },
      };

      const metadata = {
        documentType: 'engagement_letter' as const,
        engagementId: engagement?.id || '',
        clientName: engagement?.clients?.client_name || 'Client',
        periodEndDate: engagement?.period_end ? new Date(engagement.period_end) : new Date(),
        preparedBy: 'System',
        preparedDate: new Date(),
        version: 1,
      };

      const pdfDoc = generateEngagementLetterPDF(template, metadata);
      return pdfDoc;
    },
    onSuccess: (pdfDoc) => {
      pdfDoc.download(`engagement-letter-${engagement?.audit_number || 'draft'}.pdf`);
      toast({
        title: 'Letter Generated',
        description: 'Engagement letter has been downloaded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate letter.',
        variant: 'destructive',
      });
    },
  });

  const getLetterPreview = () => {
    const clientName = engagement?.clients?.client_name || '[Client Name]';
    const periodEnd = engagement?.period_end
      ? format(new Date(engagement.period_end), 'MMMM d, yyyy')
      : '[Period End]';

    switch (letterType) {
      case 'engagement':
        return `
${format(new Date(), 'MMMM d, yyyy')}

${formData.addressee || '[Addressee]'}
${formData.addresseeTitle || '[Title]'}
${clientName}

Dear ${formData.addressee || '[Addressee]'}:

We are pleased to confirm our understanding of the services we are to provide for ${clientName}. This letter confirms the arrangements for our audit of the financial statements for the year ended ${periodEnd}.

OBJECTIVE AND SCOPE OF THE AUDIT

We will audit the financial statements of ${clientName}, which comprise the balance sheet as of ${periodEnd}, and the related statements of income, changes in equity, and cash flows for the year then ended.

Our audit will be conducted in accordance with auditing standards generally accepted in the United States of America (GAAS). Those standards require that we plan and perform the audit to obtain reasonable assurance about whether the financial statements are free from material misstatement.

MANAGEMENT'S RESPONSIBILITIES

Management is responsible for:
• Preparation and fair presentation of the financial statements
• Design and maintenance of internal control
• Providing access to all information relevant to the audit
• Providing written representations

FEES AND TIMING

Our estimated fees for this engagement are $${formData.estimatedFees || '[Amount]'}.
Billing terms: ${formData.billingTerms}

Fieldwork is expected to begin ${formData.fieldworkStart ? format(new Date(formData.fieldworkStart), 'MMMM d, yyyy') : '[Date]'} and conclude ${formData.fieldworkEnd ? format(new Date(formData.fieldworkEnd), 'MMMM d, yyyy') : '[Date]'}.

Please sign and return the enclosed copy of this letter to indicate your acknowledgment of, and agreement with, the arrangements for our audit.

Sincerely,

[Firm Name]


ACCEPTED AND AGREED:

_______________________________          _______________
Signature                                Date

_______________________________
Print Name and Title
        `.trim();

      case 'representation':
        return `
MANAGEMENT REPRESENTATION LETTER

${format(new Date(), 'MMMM d, yyyy')}

To: [Auditor Firm Name]

In connection with your audit of the financial statements of ${clientName} as of and for the year ended ${periodEnd}, we confirm the following representations:

GENERAL REPRESENTATIONS

1. We have fulfilled our responsibilities for the preparation and fair presentation of the financial statements.

2. We have provided you with access to all information relevant to the preparation of the financial statements.

3. All transactions have been recorded and are reflected in the financial statements.

4. We acknowledge our responsibility for the design, implementation, and maintenance of internal control.

SPECIFIC REPRESENTATIONS

5. There are no material transactions that have not been properly recorded.

6. We have no knowledge of any fraud or suspected fraud.

7. We have disclosed all known actual or possible litigation and claims.

8. The company has complied with all aspects of contractual agreements.

_______________________________          _______________
Management Signature                      Date

_______________________________
Print Name and Title
        `.trim();

      default:
        return 'Select a letter type to preview.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Generate Letter</DialogTitle>
          </div>
          <DialogDescription>
            Create professional letters for {engagement?.audit_title || 'this engagement'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Letter Type Selection */}
          <div className="flex flex-wrap gap-2">
            {LETTER_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={letterType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLetterType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
            <TabsList>
              <TabsTrigger value="edit">Edit Details</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressee">Addressee Name</Label>
                  <Input
                    id="addressee"
                    value={formData.addressee}
                    onChange={(e) => setFormData((p) => ({ ...p, addressee: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addresseeTitle">Title</Label>
                  <Input
                    id="addresseeTitle"
                    value={formData.addresseeTitle}
                    onChange={(e) => setFormData((p) => ({ ...p, addresseeTitle: e.target.value }))}
                    placeholder="Chief Financial Officer"
                  />
                </div>
              </div>

              {letterType === 'engagement' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedFees">Estimated Fees ($)</Label>
                      <Input
                        id="estimatedFees"
                        type="number"
                        value={formData.estimatedFees}
                        onChange={(e) => setFormData((p) => ({ ...p, estimatedFees: e.target.value }))}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingTerms">Billing Terms</Label>
                      <Select
                        value={formData.billingTerms}
                        onValueChange={(v) => setFormData((p) => ({ ...p, billingTerms: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Net 30 days">Net 30 days</SelectItem>
                          <SelectItem value="Net 45 days">Net 45 days</SelectItem>
                          <SelectItem value="Net 60 days">Net 60 days</SelectItem>
                          <SelectItem value="Due upon receipt">Due upon receipt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fieldworkStart">Fieldwork Start</Label>
                      <Input
                        id="fieldworkStart"
                        type="date"
                        value={formData.fieldworkStart}
                        onChange={(e) => setFormData((p) => ({ ...p, fieldworkStart: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fieldworkEnd">Fieldwork End</Label>
                      <Input
                        id="fieldworkEnd"
                        type="date"
                        value={formData.fieldworkEnd}
                        onChange={(e) => setFormData((p) => ({ ...p, fieldworkEnd: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reportDelivery">Report Delivery</Label>
                      <Input
                        id="reportDelivery"
                        type="date"
                        value={formData.reportDelivery}
                        onChange={(e) => setFormData((p) => ({ ...p, reportDelivery: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="customTerms">Additional Terms (optional)</Label>
                <Textarea
                  id="customTerms"
                  value={formData.customTerms}
                  onChange={(e) => setFormData((p) => ({ ...p, customTerms: e.target.value }))}
                  placeholder="Enter any additional terms or modifications..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <ScrollArea className="h-[400px] border rounded-lg p-4 bg-white">
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                  {getLetterPreview()}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
