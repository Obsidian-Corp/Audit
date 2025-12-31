import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkpapers, Workpaper } from '@/hooks/useWorkpapers';
import { useWorkpaperCollaboration } from '@/hooks/useWorkpaperCollaboration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Folder,
  FolderOpen,
  Search,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { RichTextEditor } from '@/components/audit/workpapers/RichTextEditor';
import { WorkpaperTemplates } from '@/components/audit/workpapers/WorkpaperTemplates';
import { WorkpaperReviewPanel } from '@/components/audit/workpapers/WorkpaperReviewPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditWorkpapers() {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const {
    workpapers,
    isLoading,
    createWorkpaper,
    updateWorkpaper,
    submitForReview,
    approveWorkpaper,
    rejectWorkpaper,
  } = useWorkpapers(auditId || '');

  const [selectedWorkpaper, setSelectedWorkpaper] = useState<Workpaper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Collaboration
  const { 
    collaborators, 
    updateCursorPosition, 
    updateSelection 
  } = useWorkpaperCollaboration({
    workpaperId: selectedWorkpaper?.id || '',
  });

  // New workpaper form state
  const [newWorkpaper, setNewWorkpaper] = useState({
    title: '',
    workpaper_type: 'analysis',
    reference_number: '',
  });

  useEffect(() => {
    if (!currentOrg) {
      navigate('/portal');
    }
  }, [currentOrg, navigate]);

  useEffect(() => {
    if (selectedWorkpaper) {
      setEditorContent(selectedWorkpaper.content?.html || '');
    }
  }, [selectedWorkpaper]);

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (selectedWorkpaper) {
      updateWorkpaper({
        id: selectedWorkpaper.id,
        updates: {
          content: { html: editorContent },
        },
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleCreateWorkpaper = () => {
    const refNumber = newWorkpaper.reference_number || `WP-${Date.now()}`;
    createWorkpaper({
      ...newWorkpaper,
      reference_number: refNumber,
      content: { html: '' },
    });
    setNewWorkpaper({ title: '', workpaper_type: 'analysis', reference_number: '' });
    setIsCreateDialogOpen(false);
  };

  const handleSelectTemplate = (template: any) => {
    setEditorContent(template.content);
    setHasUnsavedChanges(true);
    setIsCreateDialogOpen(false);
  };

  const filteredWorkpapers = workpapers.filter((wp) =>
    wp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wp.reference_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group workpapers by type
  const groupedWorkpapers = filteredWorkpapers.reduce((acc, wp) => {
    const type = wp.workpaper_type || 'general';
    if (!acc[type]) acc[type] = [];
    acc[type].push(wp);
    return acc;
  }, {} as Record<string, Workpaper[]>);

  const getStatusBadge = (status: string) => {
    const configs = {
      draft: { label: 'Draft', className: 'bg-muted' },
      in_review: { label: 'In Review', className: 'bg-warning/20 text-warning border-warning' },
      approved: { label: 'Approved', className: 'bg-success/20 text-success border-success' },
      rejected: { label: 'Rejected', className: 'bg-destructive/20 text-destructive border-destructive' },
    };
    const config = configs[status as keyof typeof configs] || configs.draft;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (!currentOrg || !auditId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workpapers')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Audit Workpapers
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Document audit procedures, findings, and evidence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <WorkpaperTemplates onSelectTemplate={handleSelectTemplate} />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Workpaper
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workpaper</DialogTitle>
                  <DialogDescription>
                    Add a new workpaper to document your audit procedures
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newWorkpaper.title}
                      onChange={(e) =>
                        setNewWorkpaper({ ...newWorkpaper, title: e.target.value })
                      }
                      placeholder="e.g., Revenue Recognition Analysis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Workpaper Type *</Label>
                    <Select
                      value={newWorkpaper.workpaper_type}
                      onValueChange={(value) =>
                        setNewWorkpaper({ ...newWorkpaper, workpaper_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="reconciliation">Reconciliation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      value={newWorkpaper.reference_number}
                      onChange={(e) =>
                        setNewWorkpaper({ ...newWorkpaper, reference_number: e.target.value })
                      }
                      placeholder="Auto-generated if left empty"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkpaper}
                    disabled={!newWorkpaper.title}
                  >
                    Create Workpaper
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workpapers List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Workpapers</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workpapers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : Object.entries(groupedWorkpapers).length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No workpapers yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create your first workpaper to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedWorkpapers).map(([type, papers]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                          <Folder className="w-3 h-3" />
                          {type}
                        </div>
                        <div className="space-y-1">
                          {papers.map((wp) => (
                            <button
                              key={wp.id}
                              onClick={() => setSelectedWorkpaper(wp)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedWorkpaper?.id === wp.id
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-card border-border hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-medium line-clamp-1">
                                  {wp.title}
                                </p>
                                {getStatusBadge(wp.status)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {wp.reference_number}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-2">
            {selectedWorkpaper ? (
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{selectedWorkpaper.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedWorkpaper.reference_number}
                      </p>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    content={editorContent}
                    onChange={handleEditorChange}
                    editable={selectedWorkpaper.status !== 'approved'}
                    collaborators={collaborators}
                    onCursorChange={updateCursorPosition}
                    onSelectionChange={updateSelection}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No Workpaper Selected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a workpaper from the list or create a new one
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-1">
            {selectedWorkpaper ? (
              <WorkpaperReviewPanel
                workpaper={selectedWorkpaper}
                onSubmitForReview={() => submitForReview(selectedWorkpaper.id)}
                onApprove={() => approveWorkpaper(selectedWorkpaper.id)}
                onReject={(reason) =>
                  rejectWorkpaper({ workpaperId: selectedWorkpaper.id, reason })
                }
                canReview={true} // TODO: Check actual permissions
              />
            ) : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Review Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a workpaper to view review status
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
