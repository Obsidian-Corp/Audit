import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProcedures, AuditProcedure } from '@/hooks/useProcedures';
import { Search, Plus, Clock, AlertCircle, Eye, Edit, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcedureDetailDialog } from '@/components/audit/programs/ProcedureDetailDialog';
import { ProcedureEditor } from '@/components/audit/programs/ProcedureEditor';
import { useAuth } from '@/contexts/AuthContext';

export default function ProcedureLibrary() {
  const { procedures, isLoading } = useProcedures();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProcedure, setSelectedProcedure] = useState<AuditProcedure | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<AuditProcedure | null>(null);

  const categories = [
    { value: 'all', label: 'All Procedures' },
    { value: 'walkthrough', label: 'Walkthroughs' },
    { value: 'control_test', label: 'Control Tests' },
    { value: 'substantive', label: 'Substantive Tests' },
    { value: 'analytical', label: 'Analytical Procedures' },
    { value: 'inquiry', label: 'Inquiries' },
  ];

  const filterProcedures = () => {
    let filtered = procedures || [];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        p =>
          p.procedure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.procedure_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.objective?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleViewDetails = (procedure: AuditProcedure) => {
    setSelectedProcedure(procedure);
    setDetailOpen(true);
  };

  const handleEdit = (procedure: AuditProcedure) => {
    setEditingProcedure(procedure);
    setDetailOpen(false);
    setEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingProcedure(null);
    setEditorOpen(true);
  };

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
          <h1 className="text-3xl font-bold">Procedure Library</h1>
          <p className="text-muted-foreground">
            Browse and manage audit test procedures
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Procedure
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search procedures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-4">
            {filterProcedures().length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No procedures found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filterProcedures().map((procedure) => (
                  <Card key={procedure.id} className="hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {procedure.procedure_code}
                            </Badge>
                            <Badge variant={getRiskBadgeColor(procedure.risk_level)}>
                              {procedure.risk_level.toUpperCase()}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{procedure.procedure_name}</CardTitle>
                          <CardDescription>{procedure.objective}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(procedure)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(procedure)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{procedure.estimated_hours}h estimated</span>
                        </div>
                        <Badge variant="secondary">{procedure.category.replace('_', ' ')}</Badge>
                        {procedure.control_objectives && Array.isArray(procedure.control_objectives) && procedure.control_objectives.length > 0 && (
                          <span className="text-xs">
                            {procedure.control_objectives.length} control objectives
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      <ProcedureDetailDialog
        procedure={selectedProcedure}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selectedProcedure!)}
      />

      <ProcedureEditor
        procedure={editingProcedure}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        firmId={profile?.firm_id || ''}
      />
    </div>
  );
}
