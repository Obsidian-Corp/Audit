import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const usePlatformAdminRealtime = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to schema boundary logs
    const boundaryChannel = supabase
      .channel('platform-admin-boundaries')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'platform_admin',
          table: 'schema_boundary_logs',
        },
        (payload) => {
          toast({
            title: "New Boundary Request",
            description: `${payload.new.operation} from ${payload.new.source_schema} to ${payload.new.target_schema}`,
          });
          // Query invalidation disabled to prevent tab resets
          // queryClient.invalidateQueries({ queryKey: ['schema-boundary-logs'] });
        }
      )
      .subscribe();

    // Subscribe to anomaly alerts
    const anomalyChannel = supabase
      .channel('platform-admin-anomalies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'platform_admin',
          table: 'anomaly_alerts',
        },
        (payload) => {
          const severity = payload.new.severity;
          toast({
            title: "Anomaly Detected",
            description: payload.new.description,
            variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
          });
          // Query invalidation disabled to prevent tab resets
          // queryClient.invalidateQueries({ queryKey: ['anomaly-alerts'] });
        }
      )
      .subscribe();

    // Subscribe to security alerts (Phase 4)
    const securityChannel = supabase
      .channel('platform-admin-security')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'platform_admin',
          table: 'security_alerts',
        },
        (payload) => {
          const severity = payload.new.severity;
          toast({
            title: "Security Alert",
            description: payload.new.alert_message,
            variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
          });
          // Query invalidation disabled to prevent tab resets
          // queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
          // queryClient.invalidateQueries({ queryKey: ['security-metrics'] });
        }
      )
      .subscribe();

    // Subscribe to admin auth attempts (Phase 4)
    const authChannel = supabase
      .channel('platform-admin-auth')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'platform_admin',
          table: 'admin_auth_log',
        },
        (payload) => {
          if (!payload.new.success && payload.new.attempt_type === 'login') {
            toast({
              title: "Failed Login Attempt",
              description: `Failed ${payload.new.attempt_type} from IP ${payload.new.ip_address}`,
              variant: 'destructive',
            });
            // Query invalidation disabled to prevent tab resets
            // queryClient.invalidateQueries({ queryKey: ['security-metrics'] });
          }
        }
      )
      .subscribe();

    // Subscribe to privilege elevation requests (Phase 4)
    const privilegeChannel = supabase
      .channel('platform-admin-privileges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'platform_admin',
          table: 'privilege_elevation_requests',
        },
        (payload) => {
          toast({
            title: "Privilege Elevation Request",
            description: `New ${payload.new.requested_privilege} privilege request`,
          });
          // Query invalidation disabled to prevent tab resets
          // queryClient.invalidateQueries({ queryKey: ['privilege-requests'] });
        }
      )
      .subscribe();

    // Subscribe to request queue
    const queueChannel = supabase
      .channel('platform-admin-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'platform_admin',
          table: 'request_queue',
        },
        () => {
          // Query invalidation disabled to prevent tab resets
          // queryClient.invalidateQueries({ queryKey: ['request-queue'] });
        }
      )
      .subscribe();

    return () => {
      boundaryChannel.unsubscribe();
      anomalyChannel.unsubscribe();
      securityChannel.unsubscribe();
      authChannel.unsubscribe();
      privilegeChannel.unsubscribe();
      queueChannel.unsubscribe();
    };
  }, [toast, queryClient]);
};
