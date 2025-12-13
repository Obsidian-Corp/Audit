import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEngagementScope } from "@/hooks/useEngagementScope";
import { MaterialityCalculator } from "@/components/audit-tools/MaterialityCalculator";
import { Separator } from "@/components/ui/separator";

export const EngagementScopeTab = ({ engagementId }: { engagementId: string }) => {
  const { scope, loading } = useEngagementScope(engagementId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scope Definition</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : scope ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Objectives</h4>
                <ul className="list-disc list-inside">
                  {scope.objectives?.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              </div>
            </div>
          ) : <p className="text-muted-foreground">No scope defined yet</p>}
        </CardContent>
      </Card>

      <Separator />

      {/* Materiality Calculator - Contextual Tool */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Materiality Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Calculate overall materiality, performance materiality, and clearly trivial thresholds per AU-C 320
          </p>
        </div>
        <MaterialityCalculator engagementId={engagementId} />
      </div>
    </div>
  );
};
