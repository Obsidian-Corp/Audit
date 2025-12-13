/**
 * ==================================================================
 * SAMPLING CALCULATOR PAGE
 * ==================================================================
 * Standalone page for statistical sampling calculations per AU-C 530
 * Supports MUS, Classical Variables, and Attributes sampling
 * ==================================================================
 */

import { SamplingCalculator } from '@/components/audit-tools/SamplingCalculator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SamplingCalculatorPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Sampling Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Statistical sampling tool supporting MUS (Monetary Unit Sampling), Classical Variables, and Attributes sampling per AU-C 530
        </p>
      </div>

      {/* Calculator Component */}
      <SamplingCalculator engagementId={engagementId || undefined} />
    </div>
  );
}
