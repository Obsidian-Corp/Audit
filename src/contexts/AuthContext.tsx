import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Organization = Database['public']['Tables']['firms']['Row']; // Note: Database still uses 'firms' as table name

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  currentOrganization: Organization | null;
  /** @deprecated Use currentOrganization instead */
  currentFirm: Organization | null;
  organizationId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasPermission: (permission: string, resourceType?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and roles
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Don't throw - continue with null profile
      }
      setProfile(profileData || null);

      // Get firm_id from profile or try to find it from user_roles
      const firmId = profileData?.firm_id || '00000000-0000-0000-0000-000000000001';

      // Fetch roles using RPC function (uses SECURITY DEFINER to bypass RLS)
      // This avoids the infinite recursion issue with direct table access
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles', {
          _user_id: userId,
          _firm_id: firmId
        });

      if (rolesError) {
        console.error('Error fetching roles via RPC:', rolesError);
        // Fallback: try direct query (may fail due to RLS)
        const { data: directRoles, error: directError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (directError) {
          console.error('Error fetching roles directly:', directError);
          setRoles([]);
        } else {
          setRoles(directRoles?.map(r => r.role as AppRole) || []);
        }
      } else {
        // RPC returns array of { role: string }
        const rolesList = Array.isArray(rolesData)
          ? rolesData.map(r => (typeof r === 'string' ? r : r.role) as AppRole)
          : [];
        setRoles(rolesList);
      }

      // Fetch organization
      if (firmId) {
        const { data: orgData, error: orgError } = await supabase
          .from('firms') // Note: table is still called 'firms' in database
          .select('*')
          .eq('id', firmId)
          .single();

        if (!orgError && orgData) {
          setCurrentOrganization(orgData);
          setOrganizationId(orgData.id);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // If Supabase is not configured, skip auth initialization
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - running in unauthenticated mode');
      setIsLoading(false);
      return;
    }

    // CRITICAL: Do not fetch user data if on platform admin routes
    // Platform admins use a separate auth system (platform_admin.admin_users)
    const isPlatformAdmin = window.location.pathname.startsWith('/platform-admin');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Only fetch user data for regular users (not platform admins)
        if (session?.user && !isPlatformAdmin) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setCurrentOrganization(null);
          setOrganizationId(null);
        }

        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Only fetch user data for regular users (not platform admins)
      if (session?.user && !isPlatformAdmin) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setCurrentOrganization(null);
    setOrganizationId(null);
  };

  const hasRole = (role: AppRole) => {
    return roles.includes(role);
  };

  const hasPermission = async (permission: string, resourceType?: string) => {
    if (!user || !profile?.firm_id) return false;
    
    const { data } = await supabase.rpc('has_permission', {
      _user_id: user.id,
      _firm_id: profile.firm_id,
      _permission: permission,
      _resource_type: resourceType || null
    });
    
    return data || false;
  };

  const value = {
    user,
    session,
    profile,
    roles,
    currentOrganization,
    currentFirm: currentOrganization, // Alias for backward compatibility
    organizationId,
    isLoading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
