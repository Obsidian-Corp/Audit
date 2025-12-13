import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users } from "lucide-react";
import { AnalyticalProcedures } from "@/components/audit-tools/AnalyticalProcedures";
import { Separator } from "@/components/ui/separator";

interface EngagementOverviewTabProps {
  engagement: any;
}

export const EngagementOverviewTab = ({ engagement }: EngagementOverviewTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Engagement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{engagement.audit_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{engagement.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{engagement.planned_start_date ? new Date(engagement.planned_start_date).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{engagement.planned_end_date ? new Date(engagement.planned_end_date).toLocaleDateString() : 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Analytical Procedures - Contextual Tool */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Analytical Procedures</h3>
          <p className="text-sm text-muted-foreground">
            Perform ratio analysis, trend analysis, and reasonableness tests per AU-C 520
          </p>
        </div>
        <AnalyticalProcedures engagementId={engagement.id} />
      </div>
    </div>
  );
};
