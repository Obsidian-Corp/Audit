import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProgramTemplates } from '@/hooks/useProgramTemplates';
import { Search, Plus, FileText, Eye, Copy, Archive, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramBuilderWizard } from '@/components/audit/programs/ProgramBuilderWizard';

export default function ProgramLibrary() {
  const navigate = useNavigate();
  const { templates, isLoading } = useProgramTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);

  const standardPrograms = templates?.filter(t => t.is_standard) || [];
  const customPrograms = templates?.filter(t => !t.is_standard) || [];

  const filterPrograms = (programs: typeof templates) => {
    if (!searchTerm) return programs;
    return programs?.filter(
      p =>
        p.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.audit_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const ProgramCard = ({ program }: { program: any }) => (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{program.template_name}</CardTitle>
            <CardDescription>{program.description}</CardDescription>
          </div>
          {program.is_standard && (
            <Badge variant="secondary" className="ml-2">Standard</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{program.audit_type}</Badge>
            {program.industry && (
              <Badge variant="outline">{program.industry}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{program.procedure_count || 0} procedures</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/audit/programs/${program.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Program Library</h1>
          <p className="text-muted-foreground">
            Browse and manage audit program templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBuilderOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Build Program
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="standard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="standard">
            Standard Programs ({standardPrograms.length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Custom Programs ({customPrograms.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Programs ({templates?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-4">
          {filterPrograms(standardPrograms)?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No standard programs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterPrograms(standardPrograms)?.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {filterPrograms(customPrograms)?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No custom programs yet</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterPrograms(customPrograms)?.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterPrograms(templates)?.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Program Builder Wizard */}
      <ProgramBuilderWizard
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        engagementId="demo-engagement" // This should come from context or props
        onSuccess={() => {
          // Refresh templates or navigate
        }}
      />
    </div>
  );
}
