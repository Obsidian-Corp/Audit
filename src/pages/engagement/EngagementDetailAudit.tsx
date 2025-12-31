/**
 * ==================================================================
 * ENGAGEMENT DETAIL PAGE - AUDIT WORKFLOW
 * ==================================================================
 * New engagement-centric audit workflow page with 5 tabs per
 * System Design Document Section 5.1.2 and 7
 * ==================================================================
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// New Audit Workflow Components
import { EngagementHeader } from '@/components/engagement/EngagementHeader';
import { EngagementSidebar } from '@/components/engagement/EngagementSidebar';
import { AuditOverviewTab } from '@/components/engagement/tabs/AuditOverviewTab';
import { AuditPlanningTab } from '@/components/engagement/tabs/AuditPlanningTab';
import { AuditFieldworkTab } from '@/components/engagement/tabs/AuditFieldworkTab';
import { AuditReviewTab } from '@/components/engagement/tabs/AuditReviewTab';
import { AuditReportingTab } from '@/components/engagement/tabs/AuditReportingTab';

export default function EngagementDetailAudit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch engagement with all related data
  const {
    data: engagement,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['engagement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select(
          `
          *,
          client:clients(
            id,
            client_name
          ),
          partner:profiles!audits_lead_auditor_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          ),
          manager:profiles!audits_manager_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          ),
          team_members:audit_team_members(
            id,
            role,
            user:profiles(
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading engagement',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!engagement) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Engagement not found</p>
            <Button onClick={() => navigate('/engagements')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Engagements
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/engagements')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Engagements
            </Button>
          </div>

          {/* Engagement Header */}
          <EngagementHeader engagement={engagement} />

          {/* Main Content Area with Sidebar */}
          <div className="grid grid-cols-12 gap-6">
            {/* Tabs and Content (9 columns) */}
            <div className="col-span-12 lg:col-span-9">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="planning">Planning</TabsTrigger>
                  <TabsTrigger value="fieldwork">Fieldwork</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                  <TabsTrigger value="reporting">Reporting</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <AuditOverviewTab engagementId={id!} engagement={engagement} />
                </TabsContent>

                <TabsContent value="planning">
                  <AuditPlanningTab engagementId={id!} engagement={engagement} />
                </TabsContent>

                <TabsContent value="fieldwork">
                  <AuditFieldworkTab engagementId={id!} engagement={engagement} />
                </TabsContent>

                <TabsContent value="review">
                  <AuditReviewTab engagementId={id!} engagement={engagement} />
                </TabsContent>

                <TabsContent value="reporting">
                  <AuditReportingTab engagementId={id!} engagement={engagement} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar (3 columns) */}
            <div className="col-span-12 lg:col-span-3">
              <EngagementSidebar engagement={engagement} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
