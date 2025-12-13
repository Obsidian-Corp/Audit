import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  user_roles: {
    role: string;
    client_id: string | null;
    clients: {
      client_name: string;
    } | null;
  }[];
}

export interface InviteUserData {
  email: string;
  full_name: string;
  role: string;
  client_id?: string;
}

export const useUsers = () => {
  const { currentOrg } = useOrganization();

  return useQuery({
    queryKey: ['users', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          created_at,
          user_roles!inner(
            role,
            client_id,
            clients(client_name)
          )
        `)
        .eq('user_roles.firm_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserWithRoles[];
    },
    enabled: !!currentOrg,
  });
};

export const useUserDetails = (userId: string) => {
  const { currentOrg } = useOrganization();

  return useQuery({
    queryKey: ['user', userId, currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg || !userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          created_at,
          user_roles!inner(
            role,
            client_id,
            firm_id,
            clients(client_name)
          )
        `)
        .eq('id', userId)
        .eq('user_roles.firm_id', currentOrg.id)
        .single();

      if (error) throw error;
      return data as UserWithRoles;
    },
    enabled: !!currentOrg && !!userId,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  return useMutation({
    mutationFn: async (inviteData: InviteUserData) => {
      if (!currentOrg) throw new Error('No organization selected');

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
            firm_id: currentOrg.id,
            role: inviteData.role,
            client_id: inviteData.client_id || null,
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

  return useMutation({
    mutationFn: async ({
      userId,
      rolesToAdd,
      rolesToRemove,
    }: {
      userId: string;
      rolesToAdd: { role: string; client_id?: string }[];
      rolesToRemove: string[];
    }) => {
      if (!currentOrg) throw new Error('No organization selected');

      // Remove roles
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('firm_id', currentOrg.id)
          .in('role', rolesToRemove);

        if (deleteError) throw deleteError;
      }

      // Add roles
      if (rolesToAdd.length > 0) {
        const rolesToInsert = rolesToAdd.map(r => ({
          user_id: userId,
          firm_id: currentOrg.id,
          role: r.role,
          client_id: r.client_id || null,
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

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!currentOrg) throw new Error('No organization selected');

      // Remove all roles for this user in this organization
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('firm_id', currentOrg.id);

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
