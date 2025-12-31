/**
 * ==================================================================
 * TCWG COMMUNICATIONS TRACKER
 * ==================================================================
 * Track communications with Those Charged With Governance per AU-C 260/265
 *
 * Features:
 * - Required communications checklist
 * - Communication log with dates and methods
 * - Control deficiency communication tracking (AU-C 265)
 * - Documentation of governance responses
 * - Meeting minutes and correspondence tracking
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
import { MessageSquare, Plus, CheckCircle, AlertTriangle, Calendar, Users, FileText, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Required TCWG communications per AU-C 260
const REQUIRED_COMMUNICATIONS = [
  {
    id: 'req_1',
    topic: 'Auditor Responsibilities',
    description: 'Communication of the auditor\'s responsibilities under GAAS, including forming and expressing an opinion on the financial statements',
    timing: 'Planning',
    required: true,
  },
  {
    id: 'req_2',
    topic: 'Planned Scope and Timing',
    description: 'Overview of the planned scope and timing of the audit, including significant risks identified',
    timing: 'Planning',
    required: true,
  },
  {
    id: 'req_3',
    topic: 'Significant Findings',
    description: 'Significant findings from the audit, including significant audit adjustments and uncorrected misstatements',
    timing: 'Completion',
    required: true,
  },
  {
    id: 'req_4',
    topic: 'Accounting Policies',
    description: 'Qualitative aspects of the entity\'s significant accounting practices, including accounting policies, estimates, and disclosures',
    timing: 'Completion',
    required: true,
  },
  {
    id: 'req_5',
    topic: 'Difficulties Encountered',
    description: 'Any significant difficulties encountered during the audit',
    timing: 'Completion',
    required: true,
  },
  {
    id: 'req_6',
    topic: 'Disagreements with Management',
    description: 'Any disagreements with management, whether or not satisfactorily resolved',
    timing: 'Completion',
    required: true,
  },
  {
    id: 'req_7',
    topic: 'Other Significant Matters',
    description: 'Other significant matters arising from the audit that are relevant to TCWG oversight',
    timing: 'Completion',
    required: true,
  },
  {
    id: 'req_8',
    topic: 'Independence',
    description: 'Communication regarding independence, including all relationships that may affect independence',
    timing: 'Planning/Completion',
    required: true,
  },
  {
    id: 'req_9',
    topic: 'Material Weaknesses',
    description: 'Material weaknesses in internal control identified during the audit (AU-C 265)',
    timing: 'Completion',
    required: true,
  },
  {
    id: 'req_10',
    topic: 'Significant Deficiencies',
    description: 'Significant deficiencies in internal control identified during the audit (AU-C 265)',
    timing: 'Completion',
    required: true,
  },
];

interface TCWGCommunication {
  id: string;
  engagement_id: string;
  communication_date: string;
  communication_type: 'meeting' | 'letter' | 'email' | 'phone' | 'presentation' | 'other';
  topic: string;
  description: string;
  attendees?: string[];
  method: 'written' | 'oral' | 'both';
  required_topic_id?: string;
  governance_response?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_completed: boolean;
  supporting_documents?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ControlDeficiencyCommunication {
  id: string;
  engagement_id: string;
  deficiency_type: 'material_weakness' | 'significant_deficiency' | 'other';
  description: string;
  affected_area: string;
  communicated_to_management: boolean;
  management_communication_date?: string;
  communicated_to_tcwg: boolean;
  tcwg_communication_date?: string;
  management_response?: string;
  remediation_plan?: string;
  status: 'identified' | 'communicated' | 'remediated' | 'ongoing';
  created_at: string;
  updated_at: string;
}

interface TCWGCommunicationsProps {
  engagementId: string;
}

export function TCWGCommunications({ engagementId }: TCWGCommunicationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch communications
  const { data: communications, isLoading: commsLoading } = useQuery({
    queryKey: ['tcwg-communications', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tcwg_communications')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('communication_date', { ascending: false });

      if (error) throw error;
      return data as TCWGCommunication[];
    },
    enabled: !!engagementId,
  });

  // Fetch control deficiencies
  const { data: deficiencies, isLoading: defLoading } = useQuery({
    queryKey: ['control-deficiency-communications', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('control_deficiency_communications')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ControlDeficiencyCommunication[];
    },
    enabled: !!engagementId,
  });

  // Track which required topics have been communicated
  const communicatedTopics = communications?.filter(c => c.required_topic_id).map(c => c.required_topic_id) || [];

  // Dialog state for adding communication
  const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
  const [communicationDate, setCommunicationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [communicationType, setCommunicationType] = useState<TCWGCommunication['communication_type']>('meeting');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('');
  const [method, setMethod] = useState<'written' | 'oral' | 'both'>('oral');
  const [selectedRequiredTopic, setSelectedRequiredTopic] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  // Dialog state for deficiency
  const [isDefDialogOpen, setIsDefDialogOpen] = useState(false);
  const [deficiencyType, setDeficiencyType] = useState<ControlDeficiencyCommunication['deficiency_type']>('significant_deficiency');
  const [defDescription, setDefDescription] = useState('');
  const [affectedArea, setAffectedArea] = useState('');

  // Create communication mutation
  const createCommMutation = useMutation({
    mutationFn: async (comm: Partial<TCWGCommunication>) => {
      const { data, error } = await supabase
        .from('tcwg_communications')
        .insert([comm])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tcwg-communications', engagementId] });
      setIsCommDialogOpen(false);
      resetCommForm();
      toast({
        title: 'Communication logged',
        description: 'The TCWG communication has been documented.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log communication',
        variant: 'destructive',
      });
    },
  });

  // Create deficiency mutation
  const createDefMutation = useMutation({
    mutationFn: async (def: Partial<ControlDeficiencyCommunication>) => {
      const { data, error } = await supabase
        .from('control_deficiency_communications')
        .insert([def])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-deficiency-communications', engagementId] });
      setIsDefDialogOpen(false);
      resetDefForm();
      toast({
        title: 'Deficiency documented',
        description: 'The control deficiency has been documented.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to document deficiency',
        variant: 'destructive',
      });
    },
  });

  const resetCommForm = () => {
    setCommunicationDate(format(new Date(), 'yyyy-MM-dd'));
    setCommunicationType('meeting');
    setTopic('');
    setDescription('');
    setAttendees('');
    setMethod('oral');
    setSelectedRequiredTopic('');
    setFollowUpRequired(false);
  };

  const resetDefForm = () => {
    setDeficiencyType('significant_deficiency');
    setDefDescription('');
    setAffectedArea('');
  };

  const handleCreateCommunication = () => {
    if (!topic || !description) {
      toast({
        title: 'Validation Error',
        description: 'Please provide topic and description',
        variant: 'destructive',
      });
      return;
    }

    createCommMutation.mutate({
      engagement_id: engagementId,
      communication_date: communicationDate,
      communication_type: communicationType,
      topic,
      description,
      attendees: attendees ? attendees.split(',').map(a => a.trim()) : [],
      method,
      required_topic_id: selectedRequiredTopic || undefined,
      follow_up_required: followUpRequired,
      follow_up_completed: false,
      created_by: 'current_user',
    });
  };

  const handleCreateDeficiency = () => {
    if (!defDescription || !affectedArea) {
      toast({
        title: 'Validation Error',
        description: 'Please provide description and affected area',
        variant: 'destructive',
      });
      return;
    }

    createDefMutation.mutate({
      engagement_id: engagementId,
      deficiency_type: deficiencyType,
      description: defDescription,
      affected_area: affectedArea,
      communicated_to_management: false,
      communicated_to_tcwg: false,
      status: 'identified',
    });
  };

  // Stats
  const requiredCompleted = communicatedTopics.length;
  const requiredTotal = REQUIRED_COMMUNICATIONS.length;
  const materialWeaknesses = deficiencies?.filter(d => d.deficiency_type === 'material_weakness').length || 0;
  const significantDeficiencies = deficiencies?.filter(d => d.deficiency_type === 'significant_deficiency').length || 0;
  const pendingFollowUps = communications?.filter(c => c.follow_up_required && !c.follow_up_completed).length || 0;

  const getCommunicationTypeLabel = (type: TCWGCommunication['communication_type']) => {
    const labels: Record<TCWGCommunication['communication_type'], string> = {
      meeting: 'Meeting',
      letter: 'Letter',
      email: 'Email',
      phone: 'Phone Call',
      presentation: 'Presentation',
      other: 'Other',
    };
    return labels[type];
  };

  const getDeficiencyBadge = (type: ControlDeficiencyCommunication['deficiency_type']) => {
    switch (type) {
      case 'material_weakness':
        return <Badge variant="destructive">Material Weakness</Badge>;
      case 'significant_deficiency':
        return <Badge className="bg-orange-600">Significant Deficiency</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  if (commsLoading || defLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>TCWG Communications</CardTitle>
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
              <MessageSquare className="h-5 w-5" />
              TCWG Communications
            </CardTitle>
            <CardDescription>
              Track communications with Those Charged With Governance per AU-C 260/265
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">AU-C 260</Badge>
            <Badge variant="outline">AU-C 265</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{communications?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Communications</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {requiredCompleted}/{requiredTotal}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Required Topics</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{materialWeaknesses}</div>
              <div className="text-xs text-muted-foreground mt-1">Material Weaknesses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{significantDeficiencies}</div>
              <div className="text-xs text-muted-foreground mt-1">Sig. Deficiencies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingFollowUps}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending Follow-ups</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(requiredCompleted < requiredTotal || materialWeaknesses > 0) && (
          <div className="space-y-2">
            {requiredCompleted < requiredTotal && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <AlertTriangle className="h-5 w-5" />
                  {requiredTotal - requiredCompleted} Required Communication{requiredTotal - requiredCompleted > 1 ? 's' : ''} Outstanding
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Complete all required TCWG communications before issuing the audit report.
                </p>
              </div>
            )}
            {materialWeaknesses > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium">
                  <Shield className="h-5 w-5" />
                  {materialWeaknesses} Material Weakness{materialWeaknesses > 1 ? 'es' : ''} Identified
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Material weaknesses must be communicated in writing to management and TCWG.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="communications">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="communications">
              Communications
              <Badge variant="secondary" className="ml-2">
                {communications?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="required">
              Required Topics
              <Badge variant="secondary" className="ml-2">
                {requiredCompleted}/{requiredTotal}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="deficiencies">
              Control Deficiencies
              <Badge variant="secondary" className="ml-2">
                {deficiencies?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Communications Tab */}
          <TabsContent value="communications" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isCommDialogOpen} onOpenChange={setIsCommDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Log Communication
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Log TCWG Communication</DialogTitle>
                      <DialogDescription>
                        Document a communication with Those Charged With Governance
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input
                            type="date"
                            value={communicationDate}
                            onChange={(e) => setCommunicationDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type *</Label>
                          <Select value={communicationType} onValueChange={(v) => setCommunicationType(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="meeting">In-Person Meeting</SelectItem>
                              <SelectItem value="letter">Formal Letter</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                              <SelectItem value="presentation">Presentation</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Related Required Topic (Optional)</Label>
                        <Select value={selectedRequiredTopic} onValueChange={setSelectedRequiredTopic}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select if addressing a required topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {REQUIRED_COMMUNICATIONS.filter(r => !communicatedTopics.includes(r.id)).map((req) => (
                              <SelectItem key={req.id} value={req.id}>
                                {req.topic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Topic *</Label>
                        <Input
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., Audit Planning Discussion"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Summarize what was communicated..."
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Attendees (comma-separated)</Label>
                          <Input
                            value={attendees}
                            onChange={(e) => setAttendees(e.target.value)}
                            placeholder="e.g., John Smith, Jane Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Method *</Label>
                          <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oral">Oral Only</SelectItem>
                              <SelectItem value="written">Written Only</SelectItem>
                              <SelectItem value="both">Both Oral and Written</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox
                          checked={followUpRequired}
                          onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
                        />
                        <Label className="text-sm font-normal">Follow-up action required</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCommDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCommunication} disabled={createCommMutation.isPending}>
                        Log Communication
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Communications List */}
              <div className="space-y-3">
                {!communications || communications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No TCWG communications logged</p>
                    <p className="text-sm mt-2">Click "Log Communication" to document a communication</p>
                  </div>
                ) : (
                  communications.map((comm) => (
                    <div key={comm.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{comm.topic}</span>
                            <Badge variant="outline">{getCommunicationTypeLabel(comm.communication_type)}</Badge>
                            {comm.required_topic_id && (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{comm.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(comm.communication_date), 'MMM d, yyyy')}
                            </span>
                            {comm.attendees && comm.attendees.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {comm.attendees.join(', ')}
                              </span>
                            )}
                            <span className="capitalize">{comm.method}</span>
                          </div>
                        </div>
                        {comm.follow_up_required && !comm.follow_up_completed && (
                          <Badge variant="secondary">Follow-up Required</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Required Topics Tab */}
          <TabsContent value="required" className="mt-4">
            <div className="space-y-3">
              {REQUIRED_COMMUNICATIONS.map((req) => {
                const isCommunicated = communicatedTopics.includes(req.id);
                return (
                  <div
                    key={req.id}
                    className={`p-4 border rounded-lg ${
                      isCommunicated ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isCommunicated ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span className="font-medium">{req.topic}</span>
                          <Badge variant="outline">{req.timing}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-7">{req.description}</p>
                      </div>
                      {!isCommunicated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequiredTopic(req.id);
                            setTopic(req.topic);
                            setIsCommDialogOpen(true);
                          }}
                        >
                          Log
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Control Deficiencies Tab */}
          <TabsContent value="deficiencies" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isDefDialogOpen} onOpenChange={setIsDefDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Document Deficiency
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Document Control Deficiency</DialogTitle>
                      <DialogDescription>
                        Document a control deficiency for communication per AU-C 265
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Deficiency Type *</Label>
                        <Select value={deficiencyType} onValueChange={(v) => setDeficiencyType(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="material_weakness">Material Weakness</SelectItem>
                            <SelectItem value="significant_deficiency">Significant Deficiency</SelectItem>
                            <SelectItem value="other">Other Control Deficiency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Affected Area *</Label>
                        <Input
                          value={affectedArea}
                          onChange={(e) => setAffectedArea(e.target.value)}
                          placeholder="e.g., Revenue Recognition, Cash Disbursements"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={defDescription}
                          onChange={(e) => setDefDescription(e.target.value)}
                          placeholder="Describe the control deficiency..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDefDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDeficiency} disabled={createDefMutation.isPending}>
                        Document Deficiency
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Deficiencies Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Affected Area</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Mgmt Comm.</TableHead>
                      <TableHead>TCWG Comm.</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!deficiencies || deficiencies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No control deficiencies documented</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      deficiencies.map((def) => (
                        <TableRow key={def.id}>
                          <TableCell>{getDeficiencyBadge(def.deficiency_type)}</TableCell>
                          <TableCell className="font-medium">{def.affected_area}</TableCell>
                          <TableCell className="max-w-xs truncate">{def.description}</TableCell>
                          <TableCell>
                            {def.communicated_to_management ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {def.communicated_to_tcwg ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={def.status === 'remediated' ? 'default' : 'secondary'}>
                              {def.status.charAt(0).toUpperCase() + def.status.slice(1)}
                            </Badge>
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
          <h5 className="font-medium text-purple-900 mb-2">AU-C 260/265 Requirements</h5>
          <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
            <li>Communicate required matters on a timely basis throughout the audit</li>
            <li>Significant deficiencies and material weaknesses must be communicated in writing</li>
            <li>Written communications to TCWG should be dated no later than 60 days after report release</li>
            <li>Document all communications and governance responses</li>
            <li>Consider whether oral communications need to be supplemented in writing</li>
            <li>If TCWG and management are the same, tailor communications appropriately</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
