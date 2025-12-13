import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EngagementFindingsTabProps {
  engagementId: string;
}

export function EngagementFindingsTab({ engagementId }: EngagementFindingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Findings & Observations</h3>
          <p className="text-sm text-muted-foreground">
            Audit findings, deficiencies, and recommendations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Finding
        </Button>
      </div>

      {/* Findings by Severity */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Material Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-500">2</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Significant Deficiencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">5</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Control Deficiencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">8</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">12</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Findings</CardTitle>
          <CardDescription>
            Documented findings and management responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Findings list will display all identified issues with:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Condition, Criteria, Cause, and Effect (4 C's)</li>
              <li>Severity classification and risk rating</li>
              <li>Management response and remediation status</li>
              <li>Links to related workpapers and procedures</li>
              <li>Approval workflow and sign-off tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
