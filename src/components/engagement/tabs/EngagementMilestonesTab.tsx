import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEngagementMilestones } from "@/hooks/useEngagementMilestones";

export const EngagementMilestonesTab = ({ engagementId }: { engagementId: string }) => {
  const { milestones, loading } = useEngagementMilestones(engagementId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <p>Loading...</p> : milestones.length > 0 ? (
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.id} className="p-3 border rounded">
                <p className="font-medium">{m.milestone_name}</p>
                <p className="text-sm text-muted-foreground">{new Date(m.planned_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground">No milestones yet</p>}
      </CardContent>
    </Card>
  );
};
