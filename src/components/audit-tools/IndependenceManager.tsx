/**
 * ==================================================================
 * INDEPENDENCE MANAGER
 * ==================================================================
 * Track independence declarations per AICPA Code of Professional Conduct
 * - Annual independence declarations
 * - Threat identification (7 categories)
 * - Safeguards application
 * - Engagement-level independence assessment
 * ==================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { useIndependenceDeclarations, useCreateIndependenceDeclaration } from '@/hooks/useAuditTools';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface IndependenceManagerProps {
  engagementId: string;
}

// AICPA Independence Threat Categories
const THREAT_CATEGORIES = [
  { id: 'self-review', label: 'Self-Review Threat', description: 'Reviewing own work or firm\'s work' },
  { id: 'advocacy', label: 'Advocacy Threat', description: 'Promoting client\'s position or opinion' },
  { id: 'adverse-interest', label: 'Adverse Interest Threat', description: 'Opposing interests with client' },
  { id: 'familiarity', label: 'Familiarity Threat', description: 'Too close relationship with client' },
  { id: 'undue-influence', label: 'Undue Influence Threat', description: 'Client pressure on professional judgment' },
  { id: 'financial-interest', label: 'Financial Interest Threat', description: 'Financial interest in client' },
  { id: 'management-participation', label: 'Management Participation Threat', description: 'Performing management functions' },
];

// Common Safeguards
const COMMON_SAFEGUARDS = [
  'Independent quality control review',
  'Consultation with another professional',
  'Rotation of senior personnel',
  'Policies preventing management decision-making',
  'Client acceptance and continuance procedures',
  'Ethics and independence training',
  'Monitoring of compliance with independence policies',
  'Second partner review',
];

export function IndependenceManager({ engagementId }: IndependenceManagerProps) {
  const { toast } = useToast();
  const { data: declarations, isLoading } = useIndependenceDeclarations(engagementId);
  const createDeclaration = useCreateIndependenceDeclaration();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedThreats, setSelectedThreats] = useState<string[]>([]);
  const [selectedSafeguards, setSelectedSafeguards] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState('');

  // Reset form
  const resetForm = () => {
    setSelectedThreats([]);
    setSelectedSafeguards([]);
    setConclusion('');
  };

  // Handle threat toggle
  const toggleThreat = (threatId: string) => {
    setSelectedThreats((prev) =>
      prev.includes(threatId) ? prev.filter((id) => id !== threatId) : [...prev, threatId]
    );
  };

  // Handle safeguard toggle
  const toggleSafeguard = (safeguard: string) => {
    setSelectedSafeguards((prev) =>
      prev.includes(safeguard) ? prev.filter((s) => s !== safeguard) : [...prev, safeguard]
    );
  };

  // Handle create
  const handleCreate = async () => {
    if (!conclusion) {
      toast({
        title: 'Validation Error',
        description: 'Please provide independence conclusion',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createDeclaration.mutateAsync({
        engagement_id: engagementId,
        team_member_id: '', // Will be set by auth context
        declaration_date: new Date().toISOString().split('T')[0],
        threats_identified: selectedThreats,
        safeguards_applied: selectedSafeguards,
        conclusion,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create independence declaration',
        variant: 'destructive',
      });
    }
  };

  // Calculate stats
  const totalDeclarations = declarations?.length || 0;
  const independentCount = declarations?.filter(
    (d) => d.conclusion?.toLowerCase().includes('independent')
  ).length || 0;
  const threatsIdentified = declarations?.filter(
    (d) => d.threats_identified && d.threats_identified.length > 0
  ).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Independence Manager</CardTitle>
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
              <Shield className="h-5 w-5" />
              Independence Manager
            </CardTitle>
            <CardDescription>
              Track independence declarations per AICPA Code of Professional Conduct
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">AICPA</Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Declaration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Independence Declaration</DialogTitle>
                  <DialogDescription>
                    Complete independence assessment for this engagement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
                  {/* Threat Identification */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Step 1: Identify Threats to Independence
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Select all threats that may compromise independence:
                    </p>
                    <div className="space-y-2">
                      {THREAT_CATEGORIES.map((threat) => (
                        <div key={threat.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                          <Checkbox
                            checked={selectedThreats.includes(threat.id)}
                            onCheckedChange={() => toggleThreat(threat.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{threat.label}</p>
                            <p className="text-xs text-muted-foreground">{threat.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safeguards */}
                  {selectedThreats.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        Step 2: Apply Safeguards (Required when threats identified)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select safeguards implemented to reduce threats:
                      </p>
                      <div className="space-y-2">
                        {COMMON_SAFEGUARDS.map((safeguard) => (
                          <div key={safeguard} className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50">
                            <Checkbox
                              checked={selectedSafeguards.includes(safeguard)}
                              onCheckedChange={() => toggleSafeguard(safeguard)}
                            />
                            <span className="text-sm">{safeguard}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conclusion */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Step 3: Independence Conclusion *
                    </Label>
                    <Textarea
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="Document conclusion regarding independence (e.g., 'I am independent in fact and appearance', 'Independence is impaired due to...')"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createDeclaration.isPending}>
                    Submit Declaration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{totalDeclarations}</div>
              <div className="text-sm text-muted-foreground mt-2">Total Declarations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{independentCount}</div>
              <div className="text-sm text-muted-foreground mt-2">Independent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{threatsIdentified}</div>
              <div className="text-sm text-muted-foreground mt-2">With Threats Identified</div>
            </CardContent>
          </Card>
        </div>

        {/* Independence Status */}
        {totalDeclarations > 0 ? (
          <Card className={independentCount === totalDeclarations ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {independentCount === totalDeclarations ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">All Team Members Independent</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {totalDeclarations} team member{totalDeclarations > 1 ? 's have' : ' has'} declared
                        independence for this engagement
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div>
                      <h4 className="font-semibold text-orange-900">Review Required</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Some declarations include identified threats. Review safeguards and conclusions.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-900">No Independence Declarations</h4>
                  <p className="text-sm text-red-700 mt-1">
                    All team members must complete independence declarations before beginning fieldwork
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Declarations Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Threats Identified</TableHead>
                <TableHead>Safeguards Applied</TableHead>
                <TableHead>Conclusion</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!declarations || declarations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No independence declarations yet</p>
                    <p className="text-sm mt-2">Click "Add Declaration" to create one</p>
                  </TableCell>
                </TableRow>
              ) : (
                declarations.map((declaration) => {
                  const hasThreats = declaration.threats_identified && declaration.threats_identified.length > 0;
                  const hasSafeguards = declaration.safeguards_applied && declaration.safeguards_applied.length > 0;
                  const isIndependent = declaration.conclusion?.toLowerCase().includes('independent');

                  return (
                    <TableRow key={declaration.id}>
                      <TableCell className="font-medium">
                        {declaration.team_member?.full_name || 'Team Member'}
                      </TableCell>
                      <TableCell>{format(new Date(declaration.declaration_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {hasThreats ? (
                          <Badge variant="outline" className="bg-amber-50">
                            {declaration.threats_identified.length} threat{declaration.threats_identified.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasSafeguards ? (
                          <Badge variant="outline" className="bg-blue-50">
                            {declaration.safeguards_applied.length} safeguard{declaration.safeguards_applied.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{declaration.conclusion}</TableCell>
                      <TableCell>
                        {isIndependent ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Independent
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Professional Guidance */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">AICPA Independence Requirements</h5>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>All engagement team members must be independent in fact and appearance</li>
            <li>Independence must be assessed at engagement acceptance and throughout the engagement</li>
            <li>Threats to independence must be evaluated using the conceptual framework</li>
            <li>Safeguards must be applied to reduce threats to an acceptable level</li>
            <li>If safeguards cannot reduce threats, withdraw from the engagement</li>
            <li>Document all independence assessments and conclusions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
