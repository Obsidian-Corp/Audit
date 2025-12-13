import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

interface LogAuditParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const logAudit = async ({
    action,
    resourceType,
    resourceId,
    metadata = {},
  }: LogAuditParams) => {
    if (!currentOrg) {
      console.warn("Cannot log audit event: No current organization");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("Cannot log audit event: No authenticated user");
        return;
      }

      const { error } = await supabase.rpc("log_audit_event", {
        _user_id: user.id,
        _organization_id: currentOrg.id,
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _metadata: metadata,
      });

      if (error) {
        console.error("Failed to log audit event:", error);
        // Don't show toast to user - this is background logging
      }
    } catch (error) {
      console.error("Error logging audit event:", error);
      // Silent failure - don't interrupt user experience
    }
  };

  return { logAudit };
};
