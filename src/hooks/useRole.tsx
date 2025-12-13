import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export const useRole = (role: AppRole) => {
  const { hasRole, isLoading } = useAuth();
  
  return { 
    hasRole: hasRole(role), 
    isLoading 
  };
};
