/**
 * ClientsPage
 * Ticket: DEMO-FIX-001
 *
 * Client management page for viewing, creating, and managing clients.
 * Supports search, filtering, and navigation to client engagements.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Search,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';

// Industry options
const INDUSTRIES = [
  'Manufacturing',
  'Technology',
  'Healthcare',
  'Financial Services',
  'Retail',
  'Real Estate',
  'Professional Services',
  'Nonprofit',
  'Government',
  'Other',
];

// Entity types
const ENTITY_TYPES = [
  'Corporation',
  'LLC',
  'Partnership',
  'Sole Proprietorship',
  'Nonprofit',
  'Government Entity',
];

interface Client {
  id: string;
  client_name: string;
  client_code: string | null;
  industry: string | null;
  client_type: string | null;
  company_size: string | null;
  website: string | null;
  status: string;
  risk_rating: string | null;
  notes: string | null;
  created_at: string;
  engagements_count?: number;
}

interface CreateClientForm {
  client_name: string;
  client_code: string;
  industry: string;
  client_type: string;
  company_size: string;
  website: string;
  notes: string;
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateClientForm>({
    client_name: '',
    client_code: '',
    industry: '',
    client_type: '',
    company_size: '',
    website: '',
    notes: '',
  });

  // Fetch clients with engagement count
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('client_name');

      if (clientsError) throw clientsError;

      // Fetch all audits to count engagements per client
      const { data: auditsData, error: auditsError } = await supabase
        .from('audits')
        .select('id, client_id');

      if (auditsError) {
        console.warn('Could not fetch audits for engagement count:', auditsError.message);
        // Return clients with 0 count if audits query fails
        return (clientsData || []).map((client: any) => ({
          ...client,
          engagements_count: 0,
        })) as Client[];
      }

      // Count engagements per client
      const engagementCounts = (auditsData || []).reduce((acc: Record<string, number>, audit: any) => {
        if (audit.client_id) {
          acc[audit.client_id] = (acc[audit.client_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Transform to include engagement count
      return (clientsData || []).map((client: any) => ({
        ...client,
        engagements_count: engagementCounts[client.id] || 0,
      })) as Client[];
    },
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: CreateClientForm) => {
      const { data: result, error } = await supabase
        .from('clients')
        .insert({
          client_name: data.client_name,
          client_code: data.client_code || null,
          industry: data.industry || null,
          client_type: data.client_type || null,
          company_size: data.company_size || null,
          website: data.website || null,
          notes: data.notes || null,
          firm_id: profile?.firm_id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client Created',
        description: `${data.client_name} has been added successfully.`,
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_code: '',
      industry: '',
      client_type: '',
      company_size: '',
      website: '',
      notes: '',
    });
  };

  const handleCreateClient = () => {
    if (!formData.client_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client name is required.',
        variant: 'destructive',
      });
      return;
    }
    createClientMutation.mutate(formData);
  };

  // Filter clients
  const filteredClients = clients?.filter((client) => {
    const matchesSearch =
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      industryFilter === 'all' || client.industry === industryFilter;

    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your firm's client relationships
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your firm's client list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    placeholder="Acme Manufacturing Ltd"
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData({ ...formData, client_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_code">Client Code</Label>
                  <Input
                    id="client_code"
                    placeholder="ACME-001"
                    value={formData.client_code}
                    onChange={(e) =>
                      setFormData({ ...formData, client_code: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(v) =>
                      setFormData({ ...formData, industry: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_type">Client Type</Label>
                  <Select
                    value={formData.client_type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, client_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select
                    value={formData.company_size}
                    onValueChange={(v) =>
                      setFormData({ ...formData, company_size: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-50)</SelectItem>
                      <SelectItem value="medium">Medium (51-200)</SelectItem>
                      <SelectItem value="large">Large (201-1000)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://acme.com"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this client..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={createClientMutation.isPending}
              >
                {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clients?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Engagements</p>
                <p className="text-2xl font-bold">
                  {clients?.reduce((sum, c) => sum + (c.engagements_count || 0), 0) || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Industries</p>
                <p className="text-2xl font-bold">
                  {new Set(clients?.map((c) => c.industry).filter(Boolean)).size || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Year</p>
                <p className="text-2xl font-bold">
                  {clients?.filter(
                    (c) =>
                      new Date(c.created_at).getFullYear() ===
                      new Date().getFullYear()
                  ).length || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">No Clients Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || industryFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first client.'}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients?.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/engagements?client=${client.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.client_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {client.industry && (
                        <Badge variant="secondary">{client.industry}</Badge>
                      )}
                      {client.client_type && (
                        <span className="text-xs">{client.client_type}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Add dropdown menu for more actions
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {client.client_code && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Code: {client.client_code}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">
                      {client.engagements_count || 0} engagement
                      {(client.engagements_count || 0) !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/engagements?client=${client.id}`);
                      }}
                    >
                      View
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
