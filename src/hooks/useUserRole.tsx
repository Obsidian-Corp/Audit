import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export const useUserRole = () => {
  const { roles, isLoading } = useAuth();

  return {
    isAdmin: roles.includes('firm_administrator'),
    isPM: roles.includes('engagement_manager'),
    isContributor: roles.includes('senior_auditor') || roles.includes('staff_auditor'),
    isReadOnly: roles.includes('client_user'),
    isAuditor: roles.includes('senior_auditor') || roles.includes('staff_auditor'),
    primaryRole: roles[0] || null,
    roles,
    isLoading
  };
};
