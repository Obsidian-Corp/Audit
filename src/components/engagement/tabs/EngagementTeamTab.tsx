import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EngagementTeamTab = ({ engagementId }: { engagementId: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Team management coming soon</p>
      </CardContent>
    </Card>
  );
};
