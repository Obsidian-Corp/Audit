import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgramTemplates } from '@/hooks/useProgramTemplates';
import { useEngagementPrograms } from '@/hooks/useEngagementPrograms';
import { Search, FileText, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ApplyProgramDialogProps {
  engagementId: string;
  engagementName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyProgramDialog({
  engagementId,
  engagementName,
  open,
  onOpenChange,
}: ApplyProgramDialogProps) {
  const { templates, isLoading } = useProgramTemplates();
  const { applyProgramToEngagement } = useEngagementPrograms(engagementId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customName, setCustomName] = useState('');

  const standardPrograms = templates?.filter(t => t.is_standard) || [];
  const customPrograms = templates?.filter(t => !t.is_standard) || [];

  const filterPrograms = (programs: typeof templates) => {
    if (!searchTerm) return programs;
    return programs?.filter(
      p =>
        p.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.audit_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setCustomName(template.template_name);
  };

  const handleApply = () => {
    if (!selectedTemplate) return;

    applyProgramToEngagement({
      engagementId,
      programTemplateId: selectedTemplate.id,
      programName: customName || selectedTemplate.template_name,
    });

    onOpenChange(false);
    setSelectedTemplate(null);
    setCustomName('');
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Apply Audit Program</DialogTitle>
          <DialogDescription>
            Select a program template to apply to {engagementName}
          </DialogDescription>
        </DialogHeader>

        {!selectedTemplate ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <Tabs defaultValue="standard" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="standard">
                    Standard Programs ({standardPrograms.length})
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    Custom Programs ({customPrograms.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="space-y-3">
                  {filterPrograms(standardPrograms)?.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">
                              {template.template_name}
                            </CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                          <Badge variant="secondary">Standard</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="outline">{template.audit_type}</Badge>
                          {template.industry && (
                            <Badge variant="outline">{template.industry}</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{template.procedure_count || 0} procedures</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="custom" className="space-y-3">
                  {filterPrograms(customPrograms)?.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">
                              {template.template_name}
                            </CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="outline">{template.audit_type}</Badge>
                          {template.industry && (
                            <Badge variant="outline">{template.industry}</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{template.procedure_count || 0} procedures</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedTemplate.template_name}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Audit Type</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedTemplate.audit_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedTemplate.industry || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Procedures</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {selectedTemplate.procedure_count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="program-name">Program Name (Optional)</Label>
              <Input
                id="program-name"
                placeholder={selectedTemplate.template_name}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the template name
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">What happens next?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All {selectedTemplate.procedure_count || 0} procedures will be copied to this engagement</li>
                    <li>• You can customize procedures after applying</li>
                    <li>• Team members can be assigned to each procedure</li>
                    <li>• Progress will be tracked automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {selectedTemplate && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTemplate(null);
                setCustomName('');
              }}
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleApply}
            disabled={!selectedTemplate}
          >
            Apply Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
