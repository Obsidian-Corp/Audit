import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EngagementScheduleTab = ({ engagementId }: { engagementId: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Gantt chart coming soon</p>
      </CardContent>
    </Card>
  );
};
