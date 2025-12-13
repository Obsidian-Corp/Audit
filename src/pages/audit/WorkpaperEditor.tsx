import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { RichTextEditor } from '@/components/audit/workpapers/RichTextEditor';
import { WorkpaperReviewPanel } from '@/components/audit/workpapers/WorkpaperReviewPanel';
import { WorkpaperTemplates } from '@/components/audit/workpapers/WorkpaperTemplates';
import { useWorkpapers } from '@/hooks/useWorkpapers';
import { useWorkpaperCollaboration } from '@/hooks/useWorkpaperCollaboration';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function WorkpaperEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const procedureId = searchParams.get('procedure');
  const auditId = searchParams.get('audit') || 'temp-audit-id';
  const isNew = id === 'new';

  const { workpapers, isLoading: workpapersLoading, createWorkpaper, updateWorkpaper, submitForReview, approveWorkpaper, rejectWorkpaper } = useWorkpapers(auditId);
  
  // Get single workpaper if editing
  const { data: workpaper, isLoading: workpaperLoading } = useQuery({
    queryKey: ['workpaper', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const { data, error } = await supabase
        .from('audit_workpapers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !isNew && !!id,
  });

  const { collaborators, updateCursorPosition, updateSelection } = useWorkpaperCollaboration({
    workpaperId: id || '',
  });

  const isLoading = isNew ? workpapersLoading : workpaperLoading;

  const [title, setTitle] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [workpaperType, setWorkpaperType] = useState('testing');
  const [content, setContent] = useState<any>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [showTemplates, setShowTemplates] = useState(isNew);

  useEffect(() => {
    if (workpaper) {
      setTitle(workpaper.title);
      setReferenceNumber(workpaper.reference_number);
      setWorkpaperType(workpaper.workpaper_type || 'testing');
      setContent(workpaper.content || { type: 'doc', content: [{ type: 'paragraph' }] });
    }
  }, [workpaper]);

  const handleSave = async () => {
    if (!title || !referenceNumber) {
      toast.error('Title and reference number are required');
      return;
    }

    const workpaperData = {
      title,
      reference_number: referenceNumber,
      workpaper_type: workpaperType,
      content,
      procedure_id: procedureId || undefined,
    };

    if (isNew) {
      createWorkpaper(workpaperData as any, {
        onSuccess: (data: any) => {
          toast.success('Workpaper created');
          navigate(`/workpapers/${data.id}`);
        },
      });
    } else if (id) {
      updateWorkpaper({ id, updates: workpaperData });
    }
  };

  const handleSubmitForReview = () => {
    if (id) {
      submitForReview(id);
    }
  };

  const handleApprove = () => {
    if (id) {
      approveWorkpaper(id);
    }
  };

  const handleReject = (reason: string) => {
    if (id) {
      rejectWorkpaper({ workpaperId: id, reason });
    }
  };

  const handleSelectTemplate = (template: any) => {
    setTitle(template.template_name);
    setWorkpaperType(template.workpaper_type);
    setContent(template.content);
    setShowTemplates(false);
    toast.success('Template applied');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div>Loading workpaper...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/audit/workpapers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'New Workpaper' : workpaper?.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {!isNew && workpaper?.reference_number && (
                <span className="text-sm text-muted-foreground">{workpaper.reference_number}</span>
              )}
              {workpaper?.status && (
                <Badge>
                  {workpaper.status === 'draft' && 'Draft'}
                  {workpaper.status === 'in_review' && 'In Review'}
                  {workpaper.status === 'approved' && 'Approved'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {workpaper?.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmitForReview}>
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            </>
          )}
          {isNew && (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Create Workpaper
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={showTemplates ? 'templates' : 'editor'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          {!isNew && <TabsTrigger value="review">Review</TabsTrigger>}
        </TabsList>

        <TabsContent value="templates">
          <WorkpaperTemplates onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {/* Workpaper Details */}
          <Card>
            <CardHeader>
              <CardTitle>Workpaper Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter workpaper title"
                  />
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g., WP-001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={content}
                onChange={setContent}
                editable={workpaper?.status !== 'approved'}
                collaborators={collaborators}
                onCursorChange={updateCursorPosition}
                onSelectionChange={(start, end) => updateSelection(start, end)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && (
          <TabsContent value="review">
            <WorkpaperReviewPanel
              workpaper={workpaper!}
              onSubmitForReview={handleSubmitForReview}
              onApprove={handleApprove}
              onReject={handleReject}
              canReview={true}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
