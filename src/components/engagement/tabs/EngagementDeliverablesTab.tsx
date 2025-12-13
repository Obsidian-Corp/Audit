import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEngagementDeliverables } from "@/hooks/useEngagementDeliverables";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const EngagementDeliverablesTab = ({ engagementId }: { engagementId: string }) => {
  const { deliverables, isLoading } = useEngagementDeliverables(engagementId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Deliverables</h3>
          <p className="text-sm text-muted-foreground">Track engagement deliverables</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Add Deliverable</Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {deliverables?.map((deliverable) => (
            <Card key={deliverable.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(deliverable.status)}
                    <CardTitle className="text-base">{deliverable.deliverable_name}</CardTitle>
                  </div>
                  <Badge>{deliverable.status.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{deliverable.deliverable_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{format(new Date(deliverable.due_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
