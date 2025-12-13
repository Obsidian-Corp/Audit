import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      setRoles(rolesData?.map(r => r.role as AppRole) || []);

      // Fetch organization
      if (profileData?.firm_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('firms') // Note: table is still called 'firms' in database
          .select('*')
          .eq('id', profileData.firm_id)
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
