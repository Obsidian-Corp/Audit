import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Search, Download, Trash2, Tag, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Evidence {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  tags: string[];
  uploaded_at: string;
  uploaded_by: {
    full_name: string;
  };
  audits: {
    audit_number: string;
    audit_title: string;
  };
}

export default function EvidenceLibrary() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [engagementFilter, setEngagementFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: evidence, isLoading } = useQuery({
    queryKey: ['evidence', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data, error } = await supabase
        .from('audit_documents')
        .select(`
          id,
          document_name,
          document_type,
          file_path,
          file_size,
          tags,
          uploaded_at,
          uploaded_by:profiles!audit_documents_uploaded_by_fkey(full_name),
          audits!inner(audit_number, audit_title, firm_id)
        `)
        .eq('audits.firm_id', currentOrg.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Evidence[];
    },
    enabled: !!currentOrg,
  });

  const { data: engagements } = useQuery({
    queryKey: ['engagements-filter', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('audits')
        .select('id, audit_number, audit_title')
        .eq('firm_id', currentOrg.id)
        .order('audit_number');
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const filteredEvidence = evidence?.filter(doc => {
    const matchesSearch = doc.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.audits?.audit_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    const matchesEngagement = engagementFilter === 'all' || doc.audits?.audit_number === engagementFilter;
    return matchesSearch && matchesType && matchesEngagement;
  }) || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      evidence: 'bg-blue-100 text-blue-800',
      workpaper: 'bg-green-100 text-green-800',
      support: 'bg-yellow-100 text-yellow-800',
      client_provided: 'bg-purple-100 text-purple-800',
      correspondence: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleDownload = (doc: Evidence) => {
    toast({
      title: 'Download Started',
      description: `Downloading ${doc.document_name}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Evidence Library</h1>
          <p className="text-muted-foreground">
            Manage and organize audit evidence documents
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Evidence
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evidence?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence Files</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evidence?.filter(e => e.document_type === 'evidence').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workpapers</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evidence?.filter(e => e.document_type === 'workpaper').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Provided</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evidence?.filter(e => e.document_type === 'client_provided').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="workpaper">Workpaper</SelectItem>
                <SelectItem value="support">Supporting</SelectItem>
                <SelectItem value="client_provided">Client Provided</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={engagementFilter} onValueChange={setEngagementFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Engagement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engagements</SelectItem>
                {engagements?.map((eng) => (
                  <SelectItem key={eng.id} value={eng.audit_number}>
                    {eng.audit_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {filteredEvidence.length} document{filteredEvidence.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || engagementFilter !== 'all'
                  ? 'No documents match your filters'
                  : 'No evidence documents yet'}
              </p>
              <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvidence.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium truncate">{doc.document_name}</p>
                        <Badge className={getDocumentTypeColor(doc.document_type)} variant="secondary">
                          {doc.document_type.replace('_', ' ')}
                        </Badge>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-1">
                            {doc.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{doc.audits?.audit_number} - {doc.audits?.audit_title}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploaded_by.full_name}</span>
                        <span>•</span>
                        <span>{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Evidence</DialogTitle>
            <DialogDescription>
              Upload documents to the evidence library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Engagement</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select engagement" />
                </SelectTrigger>
                <SelectContent>
                  {engagements?.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id}>
                      {eng.audit_number} - {eng.audit_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="workpaper">Workpaper</SelectItem>
                  <SelectItem value="support">Supporting Document</SelectItem>
                  <SelectItem value="client_provided">Client Provided</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Drag and drop files or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, Excel, Word, Images (max 25MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Upload Files</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
