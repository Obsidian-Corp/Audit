/**
 * ==================================================================
 * ANALYTICAL PROCEDURES PAGE
 * ==================================================================
 * Standalone page for analytical procedures per AU-C 520
 * Ratio analysis, trend analysis, variance analysis
 * ==================================================================
 */

import { AnalyticalProcedures } from '@/components/audit-tools/AnalyticalProcedures';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AnalyticalProceduresPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Analytical Procedures</h1>
        <p className="text-muted-foreground mt-2">
          Perform ratio analysis, trend analysis, and variance analysis per AU-C 520
        </p>
      </div>

      {/* Analytical Procedures Component */}
      <AnalyticalProcedures engagementId={engagementId || undefined} />
    </div>
  );
}
