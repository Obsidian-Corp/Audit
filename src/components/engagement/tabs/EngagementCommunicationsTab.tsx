import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Mail, Phone, FileText } from "lucide-react";
import { useEngagementCommunications } from "@/hooks/useEngagementCommunications";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const EngagementCommunicationsTab = ({ engagementId }: { engagementId: string }) => {
  const { communications, isLoading } = useEngagementCommunications(engagementId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone_call': return <Phone className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Communications Log</h3>
          <p className="text-sm text-muted-foreground">Track all client interactions</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Log Communication</Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-3">
          {communications?.map((comm) => (
            <Card key={comm.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(comm.communication_type)}
                    <CardTitle className="text-base">{comm.subject}</CardTitle>
                  </div>
                  <Badge variant="outline">{comm.communication_type.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{comm.summary}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(comm.communication_date), 'MMM d, yyyy h:mm a')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
