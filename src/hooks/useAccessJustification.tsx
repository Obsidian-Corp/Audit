import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateJustificationParams {
  targetOrgId: string;
  reason: string;
  ticketReference?: string;
  durationMinutes?: number;
}

interface AccessJustification {
  id: string;
  expires_at: string;
  organization_id: string;
}

export const useAccessJustification = () => {
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [activeJustification, setActiveJustification] = useState<AccessJustification | null>(null);

  const checkExistingAccess = useCallback(async (orgId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_valid_justification' as any, {
        _admin_id: user.id,
        _org_id: orgId
      }) as { data: boolean | null; error: any };

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }, []);

  const createJustification = useCallback(async ({
    targetOrgId,
    reason,
    ticketReference,
    durationMinutes = 120
  }: CreateJustificationParams): Promise<AccessJustification | null> => {
    setIsCheckingAccess(true);
    
    try {
      // Get client info
      const ipAddress = null; // Would need backend call to get real IP
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.rpc('create_access_justification', {
        _target_org_id: targetOrgId,
        _reason: reason,
        _ticket_reference: ticketReference || null,
        _duration_minutes: durationMinutes,
        _ip_address: ipAddress,
        _user_agent: userAgent
      }) as { data: any; error: any };

      if (error) throw error;

      const result = data as { id: string; expires_at: string; organization_id: string };
      
      const justification: AccessJustification = {
        id: result.id,
        expires_at: result.expires_at,
        organization_id: result.organization_id
      };

      setActiveJustification(justification);
      
      toast.success(`Access granted for ${durationMinutes} minutes`, {
        description: `Expires at ${new Date(result.expires_at).toLocaleTimeString()}`
      });

      return justification;
    } catch (error: any) {
      console.error('Error creating justification:', error);
      toast.error(`Failed to create access justification: ${error.message}`);
      return null;
    } finally {
      setIsCheckingAccess(false);
    }
  }, []);

  const revokeAccess = useCallback(async (justificationId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('revoke_access_justification', {
        _justification_id: justificationId,
        _revoke_reason: 'Manually revoked by admin'
      });

      if (error) throw error;

      if (data) {
        setActiveJustification(null);
        toast.success('Access revoked successfully');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast.error(`Failed to revoke access: ${error.message}`);
      return false;
    }
  }, []);

  return {
    isCheckingAccess,
    activeJustification,
    checkExistingAccess,
    createJustification,
    revokeAccess
  };
};
