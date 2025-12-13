/**
 * ==================================================================
 * SUBSEQUENT EVENTS LOG
 * ==================================================================
 * Track subsequent events per AU-C 560
 * - Type I: Events providing additional evidence about conditions at balance sheet date
 * - Type II: Events providing evidence about conditions arising after balance sheet date
 * - Financial statement impact assessment
 * - Disclosure determination
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, AlertTriangle, Info } from 'lucide-react';
import { useSubsequentEvents, useCreateSubsequentEvent } from '@/hooks/useAuditTools';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SubsequentEventsLogProps {
  engagementId: string;
}

export function SubsequentEventsLog({ engagementId }: SubsequentEventsLogProps) {
  const { toast } = useToast();
  const { data: events, isLoading } = useSubsequentEvents(engagementId);
  const createEvent = useCreateSubsequentEvent();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventType, setEventType] = useState<'type_1' | 'type_2'>('type_1');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [impactOnFinancials, setImpactOnFinancials] = useState('');
  const [disclosureRequired, setDisclosureRequired] = useState(false);

  // Reset form
  const resetForm = () => {
    setEventDate('');
    setDescription('');
    setImpactOnFinancials('');
    setDisclosureRequired(false);
  };

  // Handle create
  const handleCreate = async () => {
    if (!eventDate || !description) {
      toast({
        title: 'Validation Error',
        description: 'Please provide event date and description',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createEvent.mutateAsync({
        engagement_id: engagementId,
        event_date: eventDate,
        event_type: eventType,
        description,
        impact_on_financials: impactOnFinancials || null,
        disclosure_required: disclosureRequired,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create subsequent event',
        variant: 'destructive',
      });
    }
  };

  // Filter events by type
  const type1Events = events?.filter((e) => e.event_type === 'type_1');
  const type2Events = events?.filter((e) => e.event_type === 'type_2');

  // Count disclosure required
  const disclosureCount = events?.filter((e) => e.disclosure_required).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subsequent Events Log</CardTitle>
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
              <Calendar className="h-5 w-5" />
              Subsequent Events Log
            </CardTitle>
            <CardDescription>Track events occurring after balance sheet date per AU-C 560</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AU-C 560</Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Subsequent Event</DialogTitle>
                  <DialogDescription>
                    Document event occurring after balance sheet date
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={eventType}
                      onValueChange={(value) => setEventType(value as 'type_1' | 'type_2')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="type_1">
                          <div className="flex flex-col">
                            <span className="font-medium">Type I - Recognized Subsequent Event</span>
                            <span className="text-xs text-muted-foreground">
                              Provides additional evidence about conditions existing at balance sheet date
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="type_2">
                          <div className="flex flex-col">
                            <span className="font-medium">Type II - Non-Recognized Subsequent Event</span>
                            <span className="text-xs text-muted-foreground">
                              Evidence about conditions arising after balance sheet date
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Event Type Explanation */}
                  <div className={`p-3 rounded-lg ${eventType === 'type_1' ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <h5 className={`font-medium mb-2 ${eventType === 'type_1' ? 'text-blue-900' : 'text-purple-900'}`}>
                      {eventType === 'type_1' ? 'Type I Event - Requires Adjustment' : 'Type II Event - Disclosure Only'}
                    </h5>
                    <p className={`text-xs ${eventType === 'type_1' ? 'text-blue-800' : 'text-purple-800'}`}>
                      {eventType === 'type_1'
                        ? 'These events provide additional evidence about conditions that existed at the balance sheet date. Financial statements should be adjusted to reflect this new evidence. Examples: Settlement of litigation, bankruptcy of customer (for AR collectibility).'
                        : 'These events provide evidence about conditions that arose after the balance sheet date. Financial statements should NOT be adjusted, but may require disclosure. Examples: New borrowing, loss from fire, acquisition of another company.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Event Date *</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Event Description *</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the subsequent event..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Financial Statement Impact</Label>
                    <Textarea
                      value={impactOnFinancials}
                      onChange={(e) => setImpactOnFinancials(e.target.value)}
                      placeholder="Describe the impact on financial statements (adjustments for Type I, disclosure for Type II)..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      checked={disclosureRequired}
                      onCheckedChange={(checked) => setDisclosureRequired(checked as boolean)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Disclosure Required in Financial Statements</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check if this event requires disclosure in notes to financial statements
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createEvent.isPending}>
                    Add Event
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
              <div className="text-2xl font-bold">{events?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{type1Events?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Type I (Recognized)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{type2Events?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Type II (Non-Recognized)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{disclosureCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Require Disclosure</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for disclosure required */}
        {disclosureCount > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
              <AlertTriangle className="h-5 w-5" />
              {disclosureCount} Event{disclosureCount > 1 ? 's' : ''} Require{disclosureCount === 1 ? 's' : ''} Disclosure
            </div>
            <p className="text-sm text-orange-700">
              Ensure all required disclosures are included in the notes to financial statements
            </p>
          </div>
        )}

        {/* Events Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Financial Impact</TableHead>
                <TableHead>Disclosure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!events || events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subsequent events logged</p>
                    <p className="text-sm mt-2">Click "Add Event" to log a subsequent event</p>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {format(new Date(event.event_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {event.event_type === 'type_1' ? (
                        <Badge className="bg-blue-600">Type I - Recognized</Badge>
                      ) : (
                        <Badge className="bg-purple-600">Type II - Non-Recognized</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">{event.description}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {event.impact_on_financials || '-'}
                    </TableCell>
                    <TableCell>
                      {event.disclosure_required ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Required</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Examples by Type */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Type I Examples (Adjust)
              </h5>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Settlement of litigation that confirms liability existed at year-end</li>
                <li>Bankruptcy of customer (impacts AR collectibility at year-end)</li>
                <li>Sale of inventory below cost (impairment existed at year-end)</li>
                <li>Determination of purchase price of asset acquired before year-end</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Type II Examples (Disclose)
              </h5>
              <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
                <li>Sale of bond or capital stock issue</li>
                <li>Purchase of a business</li>
                <li>Loss of plant or inventories from fire or flood</li>
                <li>Changes in fair value of assets or liabilities</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Professional Guidance */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 className="font-medium text-amber-900 mb-2">AU-C 560 Requirements</h5>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>
              <strong>Subsequent Period:</strong> Period from balance sheet date to date of auditor's report
            </li>
            <li>
              <strong>Type I Events:</strong> Adjust financial statements (provide evidence about year-end
              conditions)
            </li>
            <li>
              <strong>Type II Events:</strong> Disclose in notes (arose after year-end, material impact)
            </li>
            <li>Obtain management representation letter regarding subsequent events</li>
            <li>Read minutes of meetings held after year-end</li>
            <li>Inquire of management regarding subsequent events</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
