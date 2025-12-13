import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkpapers } from '@/hooks/useWorkpapers';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Folder,
  LayoutTemplate
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface EngagementWorkpapersTabProps {
  engagementId: string;
}

const workpaperTemplates = [
  {
    id: 'financial-analysis',
    name: 'Financial Statement Analysis',
    description: 'Analyze financial statements and key ratios',
    type: 'financial',
    icon: FileText,
  },
  {
    id: 'internal-controls',
    name: 'Internal Controls Testing',
    description: 'Document and test internal controls',
    type: 'controls',
    icon: CheckCircle2,
  },
  {
    id: 'revenue-recognition',
    name: 'Revenue Recognition Review',
    description: 'Review revenue recognition policies',
    type: 'revenue',
    icon: FileText,
  },
  {
    id: 'it-controls',
    name: 'IT General Controls',
    description: 'Assess IT general controls',
    type: 'it',
    icon: FileText,
  },
  {
    id: 'substantive-testing',
    name: 'Substantive Testing',
    description: 'Document substantive audit procedures',
    type: 'substantive',
    icon: FileText,
  },
  {
    id: 'blank',
    name: 'Blank Workpaper',
    description: 'Start from scratch',
    type: 'blank',
    icon: FileText,
  },
];

export function EngagementWorkpapersTab({ engagementId }: EngagementWorkpapersTabProps) {
  const navigate = useNavigate();
  const { workpapers, isLoading, createWorkpaper } = useWorkpapers(engagementId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkpaper, setNewWorkpaper] = useState({
    title: '',
    workpaper_type: 'analysis',
    template: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'in_review':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_review':
        return <Eye className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleCreateWorkpaper = async () => {
    await createWorkpaper.mutateAsync({
      title: newWorkpaper.title,
      workpaper_type: newWorkpaper.workpaper_type,
    });
    setCreateDialogOpen(false);
    setNewWorkpaper({ title: '', workpaper_type: 'analysis', template: '' });
  };

  const workpapersByStatus = {
    draft: workpapers?.filter(wp => wp.status === 'draft').length || 0,
    in_review: workpapers?.filter(wp => wp.status === 'in_review').length || 0,
    approved: workpapers?.filter(wp => wp.status === 'approved').length || 0,
    rejected: workpapers?.filter(wp => wp.status === 'rejected').length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workpapers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workpapers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{workpapersByStatus.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{workpapersByStatus.in_review}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{workpapersByStatus.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workpaper Templates Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Workpaper Templates
            </h3>
            <p className="text-sm text-muted-foreground">Start with a template or create a blank workpaper</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workpaperTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:border-primary cursor-pointer transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setNewWorkpaper({ ...newWorkpaper, template: template.id, workpaper_type: template.type })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Workpaper from Template</DialogTitle>
                        <DialogDescription>
                          Create a new workpaper based on the {template.name} template
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Workpaper Title</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Cash and Equivalents Analysis"
                            value={newWorkpaper.title}
                            onChange={(e) => setNewWorkpaper({ ...newWorkpaper, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reference">Reference Number</Label>
                          <Input
                            id="reference"
                            placeholder="e.g., A-1"
                            defaultValue={`WP-${workpapers?.length ? workpapers.length + 1 : 1}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateWorkpaper} disabled={!newWorkpaper.title}>
                          Create Workpaper
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Existing Workpapers Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Engagement Workpapers
            </h3>
            <p className="text-sm text-muted-foreground">
              {workpapers?.length || 0} workpaper{workpapers?.length !== 1 ? 's' : ''} in this engagement
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workpaper
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workpaper</DialogTitle>
                <DialogDescription>
                  Create a new blank workpaper for this engagement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-title">Workpaper Title</Label>
                  <Input
                    id="new-title"
                    placeholder="e.g., Cash and Equivalents Analysis"
                    value={newWorkpaper.title}
                    onChange={(e) => setNewWorkpaper({ ...newWorkpaper, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Workpaper Type</Label>
                  <Select
                    value={newWorkpaper.workpaper_type}
                    onValueChange={(value) => setNewWorkpaper({ ...newWorkpaper, workpaper_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkpaper} disabled={!newWorkpaper.title}>
                  Create Workpaper
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {workpapers && workpapers.length > 0 ? (
          <div className="grid gap-3">
            {workpapers.map((workpaper) => (
              <Card
                key={workpaper.id}
                className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => navigate(`/workpapers/${workpaper.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{workpaper.title}</CardTitle>
                          <Badge variant={getStatusColor(workpaper.status)} className="text-xs">
                            {workpaper.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">
                          Ref: {workpaper.reference_number} • Type: {workpaper.workpaper_type}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(workpaper.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workpapers/${workpaper.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Prepared: {format(new Date(workpaper.prepared_date), 'MMM d, yyyy')}</span>
                    {workpaper.reviewed_date && (
                      <span>Reviewed: {format(new Date(workpaper.reviewed_date), 'MMM d, yyyy')}</span>
                    )}
                    <span>Updated: {format(new Date(workpaper.updated_at), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No workpapers yet</p>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Start by creating a workpaper from a template above or create a blank workpaper
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Workpaper
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
