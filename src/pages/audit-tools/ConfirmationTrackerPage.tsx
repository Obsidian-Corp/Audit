/**
 * ==================================================================
 * CONFIRMATION TRACKER PAGE
 * ==================================================================
 * Standalone page for tracking AR/AP/Bank confirmations per AS 2310 and AU-C 505
 * Tracks sent, received, reconciled, and exception status
 * ==================================================================
 */

import { ConfirmationTracker } from '@/components/audit-tools/ConfirmationTracker';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ConfirmationTrackerPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Confirmation Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Track AR, AP, Bank, and Legal confirmations per PCAOB AS 2310 and AICPA AU-C 505
        </p>
      </div>

      {/* Tracker Component */}
      <ConfirmationTracker engagementId={engagementId || undefined} />
    </div>
  );
}
