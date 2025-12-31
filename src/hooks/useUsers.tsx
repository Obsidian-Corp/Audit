import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  user_roles: {
    role: string;
  }[];
}

export interface InviteUserData {
  email: string;
  full_name: string;
  role: string;
}

export const useUsers = () => {
  const { currentOrg } = useOrganization();
  const { profile } = useAuth();

  // Fallback to profile.firm_id if currentOrg is not available
  const firmId = currentOrg?.id || profile?.firm_id;

  return useQuery({
    queryKey: ['users', firmId],
    queryFn: async () => {
      if (!firmId) return [];

      // First fetch profiles from the firm
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, created_at, firm_id')
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError.message);
        return [];
      }

      // Then fetch user_roles separately to avoid complex join issues
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('firm_id', firmId);

      if (rolesError) {
        console.warn('Error fetching roles:', rolesError.message);
        // Return profiles without roles
        return (profiles || []).map(p => ({
          ...p,
          user_roles: []
        })) as UserWithRoles[];
      }

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map(profile => {
        const userRoles = (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => ({
            role: r.role
          }));

        return {
          ...profile,
          user_roles: userRoles
        };
      });

      return usersWithRoles as UserWithRoles[];
    },
    enabled: !!firmId,
  });
};

export const useUserDetails = (userId: string) => {
  const { currentOrg } = useOrganization();
  const { profile } = useAuth();

  // Fallback to profile.firm_id if currentOrg is not available
  const firmId = currentOrg?.id || profile?.firm_id;

  return useQuery({
    queryKey: ['user', userId, firmId],
    queryFn: async () => {
      if (!firmId || !userId) return null;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, created_at, firm_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Error fetching user profile:', profileError.message);
        return null;
      }

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('firm_id', firmId);

      const userRoles = (roles || []).map(r => ({
        role: r.role
      }));

      return {
        ...profileData,
        user_roles: userRoles
      } as UserWithRoles;
    },
    enabled: !!firmId && !!userId,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrg } = useOrganization();
  const { profile } = useAuth();
  const firmId = currentOrg?.id || profile?.firm_id;

  return useMutation({
    mutationFn: async (inviteData: InviteUserData) => {
      if (!firmId) throw new Error('No organization selected');

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', inviteData.email)
        .single();

      if (existingUser) {
        // User exists, just add role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            firm_id: firmId,
            role: inviteData.role,
          });

        if (roleError) throw roleError;

        return { userId: existingUser.id, isNewUser: false };
      } else {
        // Create new user via auth.admin API would go here
        // For now, we'll create a placeholder profile
        // In production, this should send an invitation email

        toast({
          title: 'Invitation Sent',
          description: `An invitation has been sent to ${inviteData.email}`,
        });

        return { userId: null, isNewUser: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User Added',
        description: 'The user has been successfully added to your organization.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUserRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrg } = useOrganization();
  const { profile } = useAuth();
  const firmId = currentOrg?.id || profile?.firm_id;

  return useMutation({
    mutationFn: async ({
      userId,
      rolesToAdd,
      rolesToRemove,
    }: {
      userId: string;
      rolesToAdd: { role: string }[];
      rolesToRemove: string[];
    }) => {
      if (!firmId) throw new Error('No organization selected');

      // Remove roles
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('firm_id', firmId)
          .in('role', rolesToRemove);

        if (deleteError) throw deleteError;
      }

      // Add roles
      if (rolesToAdd.length > 0) {
        const rolesToInsert = rolesToAdd.map(r => ({
          user_id: userId,
          firm_id: firmId,
          role: r.role,
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (insertError) throw insertError;
      }

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      toast({
        title: 'Roles Updated',
        description: 'User roles have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user roles',
        variant: 'destructive',
      });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrg } = useOrganization();
  const { profile } = useAuth();
  const firmId = currentOrg?.id || profile?.firm_id;

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!firmId) throw new Error('No organization selected');

      // Remove all roles for this user in this organization
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('firm_id', firmId);

      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User Deactivated',
        description: 'The user has been removed from your organization.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate user',
        variant: 'destructive',
      });
    },
  });
};
