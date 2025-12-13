import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, LayoutGrid, Table, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EngagementWizard } from "@/components/engagement/EngagementWizard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type ViewMode = "grid" | "table";
type GroupBy = "none" | "client" | "status" | "manager";

export default function EngagementList() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const { data: engagements, isLoading } = useQuery({
    queryKey: ["engagements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audits")
        .select(`
          *,
          client:clients(id, client_name),
          lead_auditor:profiles!audits_lead_auditor_id_fkey(id, first_name, last_name),
          manager:profiles!audits_manager_id_fkey(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform to include full names
      const transformed = data?.map(eng => {
        const leadAuditor = Array.isArray(eng.lead_auditor) ? eng.lead_auditor[0] : eng.lead_auditor;
        const manager = Array.isArray(eng.manager) ? eng.manager[0] : eng.manager;
        
        return {
          ...eng,
          lead_auditor: leadAuditor ? {
            ...leadAuditor,
            full_name: `${leadAuditor.first_name || ''} ${leadAuditor.last_name || ''}`.trim()
          } : null,
          manager: manager ? {
            ...manager,
            full_name: `${manager.first_name || ''} ${manager.last_name || ''}`.trim()
          } : null
        };
      });
      
      return transformed;
    },
  });

  const filteredEngagements = engagements?.filter((eng) => {
    const matchesSearch =
      eng.audit_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.audit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.client?.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || eng.workflow_status === statusFilter;
    const matchesType = typeFilter === "all" || eng.audit_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const groupedEngagements = () => {
    if (!filteredEngagements) return {};
    if (groupBy === "none") return { "All Engagements": filteredEngagements };

    return filteredEngagements.reduce((groups: any, eng) => {
      let key = "Unassigned";
      
      if (groupBy === "client") {
        key = eng.client?.client_name || "No Client";
      } else if (groupBy === "status") {
        key = eng.workflow_status || "draft";
      } else if (groupBy === "manager") {
        key = eng.manager?.full_name || "Unassigned";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(eng);
      return groups;
    }, {});
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-slate-500",
      pipeline: "bg-blue-500",
      proposal: "bg-purple-500",
      pending_approval: "bg-yellow-500",
      approved: "bg-green-500",
      planned: "bg-cyan-500",
      active: "bg-emerald-500",
      fieldwork: "bg-orange-500",
      reporting: "bg-pink-500",
      complete: "bg-gray-500",
      archived: "bg-gray-400",
    };
    return colors[status] || "bg-slate-500";
  };

  const EngagementCard = ({ engagement }: { engagement: any }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/engagements/${engagement.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{engagement.audit_title}</CardTitle>
            <CardDescription className="mt-1">
              {engagement.audit_number} • {engagement.client?.client_name || "No Client"}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(engagement.workflow_status || "draft")}>
            {(engagement.workflow_status || "draft").replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Type</span>
          <Badge variant="outline">{engagement.audit_type}</Badge>
        </div>
        
        {engagement.manager && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Manager</span>
            <span className="font-medium">{engagement.manager.full_name}</span>
          </div>
        )}

        {engagement.planned_start_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Start Date</span>
            <span>{format(new Date(engagement.planned_start_date), "MMM d, yyyy")}</span>
          </div>
        )}

        {engagement.budget_allocated && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">${engagement.budget_allocated.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EngagementTableRow = ({ engagement }: { engagement: any }) => (
    <tr
      className="hover:bg-muted/50 cursor-pointer border-b"
      onClick={() => navigate(`/engagements/${engagement.id}`)}
    >
      <td className="py-3 px-4">
        <div className="font-medium">{engagement.audit_title}</div>
        <div className="text-sm text-muted-foreground">{engagement.audit_number}</div>
      </td>
      <td className="py-3 px-4">{engagement.client?.client_name || "-"}</td>
      <td className="py-3 px-4">
        <Badge variant="outline">{engagement.audit_type}</Badge>
      </td>
      <td className="py-3 px-4">
        <Badge className={getStatusColor(engagement.workflow_status || "draft")}>
          {(engagement.workflow_status || "draft").replace("_", " ")}
        </Badge>
      </td>
      <td className="py-3 px-4">{engagement.manager?.full_name || "-"}</td>
      <td className="py-3 px-4">
        {engagement.planned_start_date
          ? format(new Date(engagement.planned_start_date), "MMM d, yyyy")
          : "-"}
      </td>
      <td className="py-3 px-4 text-right font-medium">
        {engagement.budget_allocated ? `$${engagement.budget_allocated.toLocaleString()}` : "-"}
      </td>
    </tr>
  );

  const groups = groupedEngagements();

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Engagements</h1>
          <p className="text-muted-foreground mt-1">
            Manage all client engagements and projects
          </p>
        </div>
        {can('create', 'engagement') && (
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Engagement
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search engagements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pipeline">Pipeline</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="fieldwork">Fieldwork</SelectItem>
            <SelectItem value="reporting">Reporting</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="audit">Audit</SelectItem>
            <SelectItem value="tax">Tax</SelectItem>
            <SelectItem value="advisory">Advisory</SelectItem>
            <SelectItem value="consulting">Consulting</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Group By
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setGroupBy("none")}>
              None
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("client")}>
              Client
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("status")}>
              Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("manager")}>
              Manager
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredEngagements?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No engagements found</p>
          <Button onClick={() => setWizardOpen(true)} className="mt-4">
            Create Your First Engagement
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([groupName, groupEngagements]: [string, any]) => (
            <div key={groupName} className="space-y-4">
              {groupBy !== "none" && (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{groupName}</h2>
                  <Badge variant="secondary">{groupEngagements.length}</Badge>
                </div>
              )}

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupEngagements.map((engagement: any) => (
                    <EngagementCard key={engagement.id} engagement={engagement} />
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">Engagement</th>
                        <th className="text-left py-3 px-4 font-medium">Client</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Manager</th>
                        <th className="text-left py-3 px-4 font-medium">Start Date</th>
                        <th className="text-right py-3 px-4 font-medium">Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupEngagements.map((engagement: any) => (
                        <EngagementTableRow key={engagement.id} engagement={engagement} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Wizard */}
      <EngagementWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
