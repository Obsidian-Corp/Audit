/**
 * ==================================================================
 * MATERIALITY CALCULATOR PAGE
 * ==================================================================
 * Standalone page for materiality calculation per AU-C 320
 * Accessible from Settings > Audit Tools or Planning Tab
 * ==================================================================
 */

import { MaterialityCalculator } from '@/components/audit-tools/MaterialityCalculator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function MaterialityCalculatorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const engagementId = searchParams.get('engagementId');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => engagementId ? navigate(`/engagements/${engagementId}/audit`) : navigate('/workspace')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {engagementId ? 'Back to Engagement' : 'Back to Workspace'}
        </Button>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Materiality Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Calculate overall materiality, performance materiality, and clearly trivial thresholds per AU-C 320
        </p>
      </div>

      {/* Calculator Component */}
      <MaterialityCalculator engagementId={engagementId || undefined} />
    </div>
  );
}
