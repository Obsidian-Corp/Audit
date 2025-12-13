/**
 * ==================================================================
 * SIGN-OFF WORKFLOW TRACKING SYSTEM
 * ==================================================================
 * Multi-level sign-off workflow for audit procedures and sections
 * - Preparer → Reviewer → Manager → Partner workflow
 * - Digital signatures with timestamps
 * - Lock content after sign-off
 * - Sign-off delegation capability
 * - Complete audit trail
 * ==================================================================
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Shield,
  CheckCircle,
  Lock,
  Unlock,
  User,
  Users,
  Clock,
  AlertCircle,
  FileCheck,
  Signature,
  Key,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  History,
  FileSignature,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Types
interface SignOff {
  id: string;
  entity_type: 'procedure' | 'section' | 'engagement';
  entity_id: string;
  entity_name: string;
  role: 'preparer' | 'reviewer' | 'manager' | 'partner';
  user_id: string;
  user_name: string;
  signed_at?: string;
  signature_type?: 'electronic' | 'digital';
  comments?: string;
  locked: boolean;
  delegated_from?: string;
  delegated_from_name?: string;
  status: 'pending' | 'signed' | 'rejected' | 'delegated';
  rejection_reason?: string;
}

interface SignOffEntity {
  id: string;
  type: 'procedure' | 'section' | 'engagement';
  name: string;
  description: string;
  preparer_signoff?: SignOff;
  reviewer_signoff?: SignOff;
  manager_signoff?: SignOff;
  partner_signoff?: SignOff;
  locked: boolean;
  completion_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
  last_modified: string;
}

interface SignOffWorkflowProps {
  engagementId: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'manager' | 'partner';
  userName: string;
}

// Mock data
const mockEntities: SignOffEntity[] = [
  {
    id: 'proc-001',
    type: 'procedure',
    name: 'AR Confirmations',
    description: 'Accounts Receivable Confirmation Procedures',
    preparer_signoff: {
      id: 'sig-001',
      entity_type: 'procedure',
      entity_id: 'proc-001',
      entity_name: 'AR Confirmations',
      role: 'preparer',
      user_id: 'user-001',
      user_name: 'Sarah Staff',
      signed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      signature_type: 'electronic',
      comments: 'All confirmations reconciled',
      locked: true,
      status: 'signed'
    },
    reviewer_signoff: {
      id: 'sig-002',
      entity_type: 'procedure',
      entity_id: 'proc-001',
      entity_name: 'AR Confirmations',
      role: 'reviewer',
      user_id: 'user-002',
      user_name: 'John Senior',
      signed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      signature_type: 'electronic',
      locked: true,
      status: 'signed'
    },
    locked: false,
    completion_percentage: 50,
    risk_level: 'high',
    last_modified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'proc-002',
    type: 'procedure',
    name: 'Inventory Count',
    description: 'Physical Inventory Count Observation',
    preparer_signoff: {
      id: 'sig-003',
      entity_type: 'procedure',
      entity_id: 'proc-002',
      entity_name: 'Inventory Count',
      role: 'preparer',
      user_id: 'user-001',
      user_name: 'Sarah Staff',
      signed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      signature_type: 'electronic',
      locked: true,
      status: 'signed'
    },
    locked: false,
    completion_percentage: 25,
    risk_level: 'medium',
    last_modified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'section-001',
    type: 'section',
    name: 'Revenue Testing',
    description: 'Complete Revenue Testing Section',
    preparer_signoff: {
      id: 'sig-004',
      entity_type: 'section',
      entity_id: 'section-001',
      entity_name: 'Revenue Testing',
      role: 'preparer',
      user_id: 'user-003',
      user_name: 'Mike Staff',
      locked: false,
      status: 'pending'
    },
    locked: false,
    completion_percentage: 0,
    risk_level: 'high',
    last_modified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export function SignOffWorkflow({
  engagementId,
  userId,
  userRole,
  userName
}: SignOffWorkflowProps) {
  const { toast } = useToast();
  const [entities, setEntities] = useState<SignOffEntity[]>(mockEntities);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [isSignOffDialogOpen, setIsSignOffDialogOpen] = useState(false);
  const [isDelegateDialogOpen, setIsDelegateDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SignOffEntity | null>(null);
  const [signOffComments, setSignOffComments] = useState('');
  const [delegateToUserId, setDelegateToUserId] = useState('');
  const [delegateReason, setDelegateReason] = useState('');

  // Filter entities based on tab and filters
  const filteredEntities = useMemo(() => {
    let filtered = [...entities];

    // Tab filtering
    if (selectedTab === 'pending') {
      // Show entities pending sign-off for current user's role
      filtered = filtered.filter(entity => {
        const signOff = getSignOffForRole(entity, userRole);
        return !signOff?.signed_at || signOff.status === 'pending';
      });
    } else if (selectedTab === 'signed') {
      // Show entities signed by current user
      filtered = filtered.filter(entity => {
        const signOff = getSignOffForRole(entity, userRole);
        return signOff?.signed_at && signOff.status === 'signed';
      });
    } else if (selectedTab === 'delegated') {
      // Show entities delegated by current user
      filtered = filtered.filter(entity => {
        const signOff = getSignOffForRole(entity, userRole);
        return signOff?.status === 'delegated';
      });
    } else if (selectedTab === 'locked') {
      // Show locked entities
      filtered = filtered.filter(entity => entity.locked);
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entity =>
        entity.name.toLowerCase().includes(query) ||
        entity.description.toLowerCase().includes(query)
      );
    }

    // Entity type filtering
    if (selectedEntityType !== 'all') {
      filtered = filtered.filter(entity => entity.type === selectedEntityType);
    }

    // Risk level filtering
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter(entity => entity.risk_level === selectedRiskLevel);
    }

    return filtered;
  }, [entities, selectedTab, searchQuery, selectedEntityType, selectedRiskLevel, userRole]);

  // Get sign-off for a specific role
  function getSignOffForRole(entity: SignOffEntity, role: string): SignOff | undefined {
    switch (role) {
      case 'preparer': return entity.preparer_signoff;
      case 'reviewer': return entity.reviewer_signoff;
      case 'manager': return entity.manager_signoff;
      case 'partner': return entity.partner_signoff;
      default: return undefined;
    }
  }

  // Check if user can sign off
  function canSignOff(entity: SignOffEntity): boolean {
    if (entity.locked) return false;

    // Check prerequisite sign-offs
    switch (userRole) {
      case 'reviewer':
        return entity.preparer_signoff?.status === 'signed';
      case 'manager':
        return entity.preparer_signoff?.status === 'signed' &&
               entity.reviewer_signoff?.status === 'signed';
      case 'partner':
        return entity.preparer_signoff?.status === 'signed' &&
               entity.reviewer_signoff?.status === 'signed' &&
               entity.manager_signoff?.status === 'signed';
      default:
        return true; // Preparer can always sign
    }
  }

  // Handle sign-off
  const handleSignOff = () => {
    if (!selectedEntity) return;

    const newSignOff: SignOff = {
      id: `sig-${Date.now()}`,
      entity_type: selectedEntity.type,
      entity_id: selectedEntity.id,
      entity_name: selectedEntity.name,
      role: userRole,
      user_id: userId,
      user_name: userName,
      signed_at: new Date().toISOString(),
      signature_type: 'electronic',
      comments: signOffComments,
      locked: true,
      status: 'signed'
    };

    // Update the entity with the new sign-off
    const updatedEntities = entities.map(entity => {
      if (entity.id === selectedEntity.id) {
        const updatedEntity = { ...entity };
        switch (userRole) {
          case 'preparer':
            updatedEntity.preparer_signoff = newSignOff;
            break;
          case 'reviewer':
            updatedEntity.reviewer_signoff = newSignOff;
            break;
          case 'manager':
            updatedEntity.manager_signoff = newSignOff;
            break;
          case 'partner':
            updatedEntity.partner_signoff = newSignOff;
            // Lock entity when partner signs
            updatedEntity.locked = true;
            break;
        }
        updatedEntity.completion_percentage = calculateCompletion(updatedEntity);
        return updatedEntity;
      }
      return entity;
    });

    setEntities(updatedEntities);
    setIsSignOffDialogOpen(false);
    setSignOffComments('');
    setSelectedEntity(null);

    toast({
      title: 'Sign-Off Complete',
      description: `${selectedEntity.name} has been signed off successfully.`,
    });
  };

  // Handle delegation
  const handleDelegate = () => {
    if (!selectedEntity || !delegateToUserId) return;

    const delegatedSignOff: SignOff = {
      id: `sig-${Date.now()}`,
      entity_type: selectedEntity.type,
      entity_id: selectedEntity.id,
      entity_name: selectedEntity.name,
      role: userRole,
      user_id: delegateToUserId,
      user_name: 'Delegated User', // Would fetch from user service
      locked: false,
      delegated_from: userId,
      delegated_from_name: userName,
      status: 'delegated',
      comments: delegateReason
    };

    // Update entity with delegation
    const updatedEntities = entities.map(entity => {
      if (entity.id === selectedEntity.id) {
        const updatedEntity = { ...entity };
        switch (userRole) {
          case 'preparer':
            updatedEntity.preparer_signoff = delegatedSignOff;
            break;
          case 'reviewer':
            updatedEntity.reviewer_signoff = delegatedSignOff;
            break;
          case 'manager':
            updatedEntity.manager_signoff = delegatedSignOff;
            break;
          case 'partner':
            updatedEntity.partner_signoff = delegatedSignOff;
            break;
        }
        return updatedEntity;
      }
      return entity;
    });

    setEntities(updatedEntities);
    setIsDelegateDialogOpen(false);
    setDelegateToUserId('');
    setDelegateReason('');
    setSelectedEntity(null);

    toast({
      title: 'Sign-Off Delegated',
      description: `${selectedEntity.name} sign-off has been delegated.`,
    });
  };

  // Calculate completion percentage
  function calculateCompletion(entity: SignOffEntity): number {
    let signed = 0;
    const total = 4;

    if (entity.preparer_signoff?.status === 'signed') signed++;
    if (entity.reviewer_signoff?.status === 'signed') signed++;
    if (entity.manager_signoff?.status === 'signed') signed++;
    if (entity.partner_signoff?.status === 'signed') signed++;

    return (signed / total) * 100;
  }

  // Get risk level color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'preparer': return <User className="h-4 w-4" />;
      case 'reviewer': return <UserCheck className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      case 'partner': return <ShieldCheck className="h-4 w-4" />;
      default: return null;
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const pending = entities.filter(e => {
      const signOff = getSignOffForRole(e, userRole);
      return !signOff?.signed_at || signOff.status === 'pending';
    }).length;

    const signed = entities.filter(e => {
      const signOff = getSignOffForRole(e, userRole);
      return signOff?.status === 'signed';
    }).length;

    const delegated = entities.filter(e => {
      const signOff = getSignOffForRole(e, userRole);
      return signOff?.status === 'delegated';
    }).length;

    const locked = entities.filter(e => e.locked).length;

    return { pending, signed, delegated, locked };
  }, [entities, userRole]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Sign-Off</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.signed}</p>
              <p className="text-sm text-muted-foreground">Signed Off</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Send className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.delegated}</p>
              <p className="text-sm text-muted-foreground">Delegated</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Lock className="h-8 w-8 text-gray-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.locked}</p>
              <p className="text-sm text-muted-foreground">Locked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sign-Off Workflow Tracking
              </CardTitle>
              <CardDescription>
                Multi-level sign-off workflow for audit procedures and sections
              </CardDescription>
            </div>
            <Badge className="flex items-center gap-1">
              {getRoleIcon(userRole)}
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search procedures and sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="procedure">Procedures</SelectItem>
                <SelectItem value="section">Sections</SelectItem>
                <SelectItem value="engagement">Engagements</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="signed">Signed ({stats.signed})</TabsTrigger>
              <TabsTrigger value="delegated">Delegated ({stats.delegated})</TabsTrigger>
              <TabsTrigger value="locked">Locked ({stats.locked})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Preparer</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntities.map((entity) => (
                        <TableRow key={entity.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entity.name}</p>
                              <p className="text-sm text-muted-foreground">{entity.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {entity.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(entity.risk_level)}>
                              {entity.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={entity.completion_percentage} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {entity.completion_percentage}% Complete
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <SignOffCell signOff={entity.preparer_signoff} />
                          </TableCell>
                          <TableCell>
                            <SignOffCell signOff={entity.reviewer_signoff} />
                          </TableCell>
                          <TableCell>
                            <SignOffCell signOff={entity.manager_signoff} />
                          </TableCell>
                          <TableCell>
                            <SignOffCell signOff={entity.partner_signoff} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {canSignOff(entity) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedEntity(entity);
                                    setIsSignOffDialogOpen(true);
                                  }}
                                >
                                  <Signature className="h-3 w-3 mr-1" />
                                  Sign Off
                                </Button>
                              )}
                              {!entity.locked && userRole !== 'preparer' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedEntity(entity);
                                    setIsDelegateDialogOpen(true);
                                  }}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Delegate
                                </Button>
                              )}
                              {entity.locked && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sign-Off Dialog */}
      <Dialog open={isSignOffDialogOpen} onOpenChange={setIsSignOffDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Signature className="h-5 w-5" />
              Electronic Sign-Off
            </DialogTitle>
            <DialogDescription>
              By signing off, you confirm that you have reviewed and approved this {selectedEntity?.type}.
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sign-Off Confirmation</AlertTitle>
                <AlertDescription>
                  You are about to sign off on: <strong>{selectedEntity.name}</strong>
                  <br />
                  This action cannot be undone once all sign-offs are complete.
                </AlertDescription>
              </Alert>
              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  placeholder="Add any comments about this sign-off..."
                  value={signOffComments}
                  onChange={(e) => setSignOffComments(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="confirm" />
                <Label htmlFor="confirm">
                  I confirm that I have reviewed this {selectedEntity.type} and approve it for the next level of review
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsSignOffDialogOpen(false);
              setSignOffComments('');
              setSelectedEntity(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSignOff}>
              <Signature className="mr-2 h-4 w-4" />
              Sign Off as {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={isDelegateDialogOpen} onOpenChange={setIsDelegateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate Sign-Off</DialogTitle>
            <DialogDescription>
              Delegate this sign-off to another team member with the same role
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <div className="space-y-4">
              <div>
                <Label>Delegate To</Label>
                <Select value={delegateToUserId} onValueChange={setDelegateToUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user-alt-1">John Alternate</SelectItem>
                    <SelectItem value="user-alt-2">Jane Backup</SelectItem>
                    <SelectItem value="user-alt-3">Mike Deputy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason for Delegation</Label>
                <Textarea
                  placeholder="Explain why you're delegating this sign-off..."
                  value={delegateReason}
                  onChange={(e) => setDelegateReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDelegateDialogOpen(false);
              setDelegateToUserId('');
              setDelegateReason('');
              setSelectedEntity(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleDelegate}>
              <Send className="mr-2 h-4 w-4" />
              Delegate Sign-Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sign-off cell component
function SignOffCell({ signOff }: { signOff?: SignOff }) {
  if (!signOff) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  if (signOff.status === 'pending') {
    return (
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-yellow-500" />
        <span className="text-sm">Pending</span>
      </div>
    );
  }

  if (signOff.status === 'delegated') {
    return (
      <div className="flex items-center gap-1">
        <Send className="h-3 w-3 text-blue-500" />
        <span className="text-sm">Delegated</span>
      </div>
    );
  }

  if (signOff.status === 'rejected') {
    return (
      <div className="flex items-center gap-1">
        <XCircle className="h-3 w-3 text-red-500" />
        <span className="text-sm">Rejected</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        <span className="text-sm font-medium">{signOff.user_name}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {signOff.signed_at && format(new Date(signOff.signed_at), 'MMM d, h:mm a')}
      </p>
    </div>
  );
}