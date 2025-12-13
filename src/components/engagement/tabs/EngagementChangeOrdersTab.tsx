import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEngagementChangeOrders } from "@/hooks/useEngagementChangeOrders";

export const EngagementChangeOrdersTab = ({ engagementId }: { engagementId: string }) => {
  const { changeOrders, loading } = useEngagementChangeOrders(engagementId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <p>Loading...</p> : changeOrders.length > 0 ? (
          <div className="space-y-2">
            {changeOrders.map((co) => (
              <div key={co.id} className="p-3 border rounded">
                <p className="font-medium">{co.title}</p>
                <p className="text-sm text-muted-foreground">{co.status}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground">No change orders</p>}
      </CardContent>
    </Card>
  );
};
