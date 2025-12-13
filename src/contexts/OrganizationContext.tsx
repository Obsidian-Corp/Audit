import { useAuth } from './AuthContext';

// Backward compatibility - redirects to AuthContext
export function useOrganization() {
  const { currentFirm, profile, isLoading } = useAuth();
  
  return {
    currentOrg: currentFirm ? {
      id: currentFirm.id,
      name: currentFirm.name,
      slug: currentFirm.slug,
      status: currentFirm.status || 'active',
    } : null,
    userOrgs: currentFirm ? [{
      id: currentFirm.id,
      name: currentFirm.name,
      slug: currentFirm.slug,
      status: currentFirm.status || 'active',
    }] : [],
    switchOrg: () => {},
    refreshOrganizations: async () => {},
    isLoading,
  };
}
