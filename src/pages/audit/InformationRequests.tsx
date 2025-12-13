import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useInformationRequests } from '@/hooks/useInformationRequests';
import { CreateRequestDialog } from '@/components/audit/requests/CreateRequestDialog';
import { format } from 'date-fns';

export default function InformationRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: requests, isLoading } = useInformationRequests();

  const filteredRequests = requests?.filter(request => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      request.request_title.toLowerCase().includes(search) ||
      request.engagement?.audit_title.toLowerCase().includes(search) ||
      request.engagement?.clients?.client_name.toLowerCase().includes(search)
    );
  });

  const draftRequests = filteredRequests?.filter(r => r.status === 'draft') || [];
  const sentRequests = filteredRequests?.filter(r => r.status === 'sent') || [];
  const inProgressRequests = filteredRequests?.filter(r => r.status === 'in_progress' || r.status === 'acknowledged') || [];
  const completedRequests = filteredRequests?.filter(r => r.status === 'completed') || [];
  const overdueRequests = filteredRequests?.filter(r => r.status === 'overdue') || [];

  const statusColors = {
    draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    acknowledged: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const priorityColors = {
    low: 'bg-gray-500/10 text-gray-500',
    medium: 'bg-blue-500/10 text-blue-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
  };

  const RequestCard = ({ request }: { request: any }) => (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{request.request_title}</h3>
              {request.engagement && (
                <p className="text-sm text-muted-foreground">
                  {request.engagement.clients?.client_name} - {request.engagement.audit_title}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge className={statusColors[request.status]}>
                {request.status.replace('_', ' ')}
              </Badge>
              <Badge className={priorityColors[request.priority]}>
                {request.priority}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>

          {request.items_requested && request.items_requested.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Items Requested:</p>
              <ul className="text-sm space-y-1">
                {request.items_requested.slice(0, 3).map((item: string, index: number) => (
                  <li key={index} className="text-muted-foreground">• {item}</li>
                ))}
                {request.items_requested.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    + {request.items_requested.length - 3} more items
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {format(new Date(request.due_date), 'MMM d, yyyy')}
              </div>
              {request.assignee && (
                <div className="flex items-center gap-1">
                  Assigned to: {request.assignee.full_name}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Information Requests</h1>
        <p className="text-muted-foreground">
          Request and track information from clients
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{sentRequests.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressRequests.length}</p>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdueRequests.length}</p>
                <p className="text-xs text-muted-foreground">Past due date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedRequests.length}</p>
                <p className="text-xs text-muted-foreground">This period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests by title, client, or engagement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>

      {/* Request Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({draftRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressRequests.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading requests...</p>
              </CardContent>
            </Card>
          ) : filteredRequests && filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No information requests yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {draftRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No draft requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sentRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No sent requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {inProgressRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {inProgressRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No requests in progress</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {overdueRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No overdue requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {completedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No completed requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <CreateRequestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
