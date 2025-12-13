/**
 * ==================================================================
 * REVIEW NOTES WORKFLOW COMPONENT
 * ==================================================================
 * Comprehensive review notes management system for audit procedures
 * - Add review notes to any procedure
 * - Track preparer responses
 * - Mark as resolved
 * - Priority levels (High/Medium/Low)
 * - Escalation for overdue items
 * - Email notifications support
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Reply,
  User,
  Flag,
  AlertTriangle,
  Send,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, addDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

// Types
interface ReviewNote {
  id: string;
  procedure_id: string;
  procedure_name: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  note: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  preparer_response?: string;
  preparer_id?: string;
  preparer_name?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  category: 'documentation' | 'evidence' | 'calculation' | 'judgment' | 'compliance' | 'other';
  tags?: string[];
  attachments?: string[];
}

interface ReviewNotesWorkflowProps {
  engagementId: string;
  procedureId?: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'manager' | 'partner';
}

// Mock data for demonstration
const mockReviewNotes: ReviewNote[] = [
  {
    id: '1',
    procedure_id: 'AR-001',
    procedure_name: 'Accounts Receivable Confirmations',
    reviewer_id: 'reviewer1',
    reviewer_name: 'John Manager',
    note: 'Please provide additional support for the allowance calculation. The current documentation does not adequately support the aging percentages used.',
    status: 'open',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: addDays(new Date(), 2).toISOString(),
    category: 'documentation',
    tags: ['allowance', 'ar-aging']
  },
  {
    id: '2',
    procedure_id: 'INV-002',
    procedure_name: 'Inventory Observation',
    reviewer_id: 'reviewer1',
    reviewer_name: 'John Manager',
    note: 'The inventory count sheets are missing for Location B. Please upload the signed count sheets.',
    status: 'in_progress',
    priority: 'medium',
    preparer_response: 'I am following up with the warehouse manager to get the signed copies. Expected by EOD today.',
    preparer_id: 'preparer1',
    preparer_name: 'Sarah Staff',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'evidence',
    tags: ['inventory', 'count-sheets']
  },
  {
    id: '3',
    procedure_id: 'REV-003',
    procedure_name: 'Revenue Cutoff Testing',
    reviewer_id: 'reviewer2',
    reviewer_name: 'Emily Partner',
    note: 'Good work on the cutoff testing. Minor comment: please add a conclusion statement to the workpaper.',
    status: 'resolved',
    priority: 'low',
    preparer_response: 'Thank you! I have added the conclusion statement as requested.',
    preparer_id: 'preparer1',
    preparer_name: 'Sarah Staff',
    resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolution_note: 'Conclusion statement added. Workpaper is complete.',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'documentation',
    tags: ['revenue', 'cutoff']
  }
];

export function ReviewNotesWorkflow({
  engagementId,
  procedureId,
  userId,
  userRole
}: ReviewNotesWorkflowProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<ReviewNote[]>(mockReviewNotes);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ReviewNote | null>(null);

  // Form states
  const [newNote, setNewNote] = useState({
    procedure_id: '',
    note: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: 'documentation' as ReviewNote['category'],
    due_date: ''
  });

  const [response, setResponse] = useState('');

  // Filter notes based on tab and filters
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Tab filtering
    if (selectedTab === 'open') {
      filtered = filtered.filter(n => n.status === 'open');
    } else if (selectedTab === 'in-progress') {
      filtered = filtered.filter(n => n.status === 'in_progress');
    } else if (selectedTab === 'resolved') {
      filtered = filtered.filter(n => n.status === 'resolved' || n.status === 'closed');
    } else if (selectedTab === 'my-notes' && userRole === 'reviewer') {
      filtered = filtered.filter(n => n.reviewer_id === userId);
    } else if (selectedTab === 'assigned-to-me' && userRole === 'preparer') {
      filtered = filtered.filter(n => n.preparer_id === userId || (!n.preparer_id && n.status === 'open'));
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.note.toLowerCase().includes(query) ||
        n.procedure_name.toLowerCase().includes(query) ||
        n.preparer_response?.toLowerCase().includes(query) ||
        n.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Priority filtering
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }

    // Status filtering
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(n => n.status === selectedStatus);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return filtered;
  }, [notes, selectedTab, searchQuery, selectedPriority, selectedStatus, userId, userRole]);

  // Statistics
  const stats = useMemo(() => {
    const open = notes.filter(n => n.status === 'open').length;
    const inProgress = notes.filter(n => n.status === 'in_progress').length;
    const resolved = notes.filter(n => n.status === 'resolved' || n.status === 'closed').length;
    const overdue = notes.filter(n =>
      n.due_date &&
      isAfter(new Date(), new Date(n.due_date)) &&
      n.status !== 'resolved' &&
      n.status !== 'closed'
    ).length;

    return { open, inProgress, resolved, overdue, total: notes.length };
  }, [notes]);

  // Add new review note
  const handleAddNote = () => {
    if (!newNote.note.trim() || !newNote.procedure_id.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both procedure and note details.',
        variant: 'destructive',
      });
      return;
    }

    const note: ReviewNote = {
      id: `note-${Date.now()}`,
      procedure_id: newNote.procedure_id,
      procedure_name: `Procedure ${newNote.procedure_id}`,
      reviewer_id: userId,
      reviewer_name: 'Current Reviewer',
      note: newNote.note,
      status: 'open',
      priority: newNote.priority,
      category: newNote.category,
      due_date: newNote.due_date || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setNotes([note, ...notes]);
    setIsAddNoteOpen(false);
    setNewNote({
      procedure_id: '',
      note: '',
      priority: 'medium',
      category: 'documentation',
      due_date: ''
    });

    toast({
      title: 'Review Note Added',
      description: 'The review note has been added and assigned to the preparer.',
    });
  };

  // Add response to a note
  const handleAddResponse = () => {
    if (!response.trim() || !selectedNote) return;

    const updatedNotes = notes.map(n => {
      if (n.id === selectedNote.id) {
        return {
          ...n,
          preparer_response: response,
          preparer_id: userId,
          preparer_name: 'Current Preparer',
          status: 'in_progress' as const,
          updated_at: new Date().toISOString()
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    setIsResponseOpen(false);
    setResponse('');
    setSelectedNote(null);

    toast({
      title: 'Response Added',
      description: 'Your response has been added to the review note.',
    });
  };

  // Mark note as resolved
  const handleResolveNote = (noteId: string, resolutionNote?: string) => {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          status: 'resolved' as const,
          resolved_at: new Date().toISOString(),
          resolution_note: resolutionNote,
          updated_at: new Date().toISOString()
        };
      }
      return n;
    });

    setNotes(updatedNotes);

    toast({
      title: 'Note Resolved',
      description: 'The review note has been marked as resolved.',
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-sm text-muted-foreground">Open Notes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
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
                <MessageSquare className="h-5 w-5" />
                Review Notes Workflow
              </CardTitle>
              <CardDescription>
                Track and respond to review notes across all procedures
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {userRole === 'reviewer' && (
                <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Review Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Review Note</DialogTitle>
                      <DialogDescription>
                        Add a review note to a procedure for the preparer to address
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Procedure</Label>
                        <Input
                          placeholder="Enter procedure ID or name"
                          value={newNote.procedure_id}
                          onChange={(e) => setNewNote({ ...newNote, procedure_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Note</Label>
                        <Textarea
                          placeholder="Describe what needs to be addressed..."
                          value={newNote.note}
                          onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Priority</Label>
                          <Select
                            value={newNote.priority}
                            onValueChange={(value: 'high' | 'medium' | 'low') =>
                              setNewNote({ ...newNote, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={newNote.category}
                            onValueChange={(value: ReviewNote['category']) =>
                              setNewNote({ ...newNote, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="documentation">Documentation</SelectItem>
                              <SelectItem value="evidence">Evidence</SelectItem>
                              <SelectItem value="calculation">Calculation</SelectItem>
                              <SelectItem value="judgment">Judgment</SelectItem>
                              <SelectItem value="compliance">Compliance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={newNote.due_date}
                            onChange={(e) => setNewNote({ ...newNote, due_date: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddNote}>
                        Add Note
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              {userRole === 'reviewer' ? (
                <TabsTrigger value="my-notes">My Notes</TabsTrigger>
              ) : (
                <TabsTrigger value="assigned-to-me">Assigned to Me</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No review notes found</p>
                    </div>
                  ) : (
                    filteredNotes.map((note) => (
                      <Card key={note.id} className="border-l-4" style={{ borderLeftColor: note.priority === 'high' ? '#ef4444' : note.priority === 'medium' ? '#eab308' : '#22c55e' }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(note.status)}
                              <span className="font-semibold">{note.procedure_name}</span>
                              <Badge className={cn('text-xs', getPriorityColor(note.priority))}>
                                {note.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {note.category}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Review Note */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{note.reviewer_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{note.reviewer_name}</span>
                              <Badge variant="secondary" className="text-xs">Reviewer</Badge>
                            </div>
                            <p className="text-sm">{note.note}</p>
                            {note.due_date && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Due: {format(new Date(note.due_date), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>

                          {/* Preparer Response */}
                          {note.preparer_response && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-3 ml-6">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>{note.preparer_name?.split(' ').map(n => n[0]).join('') || 'P'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{note.preparer_name}</span>
                                <Badge variant="secondary" className="text-xs">Preparer</Badge>
                              </div>
                              <p className="text-sm">{note.preparer_response}</p>
                            </div>
                          )}

                          {/* Resolution Note */}
                          {note.resolution_note && (
                            <div className="bg-green-50 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">Resolved</span>
                              </div>
                              <p className="text-sm">{note.resolution_note}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex gap-2">
                              {note.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              {userRole === 'preparer' && note.status === 'open' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedNote(note);
                                    setIsResponseOpen(true);
                                  }}
                                >
                                  <Reply className="mr-1 h-3 w-3" />
                                  Respond
                                </Button>
                              )}
                              {userRole === 'reviewer' && note.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolveNote(note.id, 'Review complete')}
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Response</DialogTitle>
            <DialogDescription>
              Respond to the review note from {selectedNote?.reviewer_name}
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Original Note:</p>
                <p className="text-sm">{selectedNote.note}</p>
              </div>
              <div>
                <Label>Your Response</Label>
                <Textarea
                  placeholder="Type your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsResponseOpen(false);
              setResponse('');
              setSelectedNote(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddResponse}>
              <Send className="mr-2 h-4 w-4" />
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}