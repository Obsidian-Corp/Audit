import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function RiskAssessmentRequiredView({
  onStartRiskAssessment,
  onSkipToManual
}: {
  onStartRiskAssessment: () => void;
  onSkipToManual: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-4 mb-6">
          <AlertCircle className="h-16 w-16 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Risk Assessment Required</h2>

        <p className="text-muted-foreground text-center max-w-md mb-8">
          Professional auditing standards require risk assessment before designing
          audit procedures. This ensures your testing is responsive to engagement-specific risks.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-md">
          <Button onClick={onStartRiskAssessment} size="lg" className="w-full">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Start Risk Assessment
          </Button>

          <Button
            variant="outline"
            onClick={onSkipToManual}
            size="sm"
            className="w-full"
          >
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            Skip to Manual Program (Not Recommended)
          </Button>
        </div>

        <Alert className="mt-8 max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Why Risk Assessment?</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Focus testing on high-risk areas</li>
              <li>Avoid over-testing low-risk areas</li>
              <li>Match procedures to client industry</li>
              <li>Meet professional standards (AU-C 315, 330)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
