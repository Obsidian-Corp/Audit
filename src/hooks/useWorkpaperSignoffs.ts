/**
 * useWorkpaperSignoffs Hook
 * Ticket: FEAT-001
 *
 * Manages electronic sign-off workflow for workpapers.
 * Supports preparer, reviewer, manager, and partner sign-offs.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

// Type definitions
export type SignoffType = 'preparer' | 'reviewer' | 'manager' | 'partner';

export interface WorkpaperSignoff {
  id: string;
  workpaper_id: string;
  user_id: string;
  signoff_type: SignoffType;
  signed_at: string;
  comments: string | null;
  signature_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined profile data
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SignoffRequirement {
  type: SignoffType;
  required: boolean;
  completed: boolean;
  signoff: WorkpaperSignoff | null;
}

export interface SignoffStatus {
  canSign: boolean;
  nextRequiredType: SignoffType | null;
  completedTypes: SignoffType[];
  pendingTypes: SignoffType[];
  isFullySigned: boolean;
  isLocked: boolean;
}

interface CreateSignoffParams {
  workpaperId: string;
  signoffType: SignoffType;
  comments?: string;
}

interface RevokeSignoffParams {
  signoffId: string;
  reason: string;
}

/**
 * Hook for managing workpaper sign-offs
 * @param workpaperId - The workpaper to manage sign-offs for
 */
export function useWorkpaperSignoffs(workpaperId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Get all sign-offs for a workpaper
  const {
    data: signoffs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workpaper-signoffs', workpaperId],
    queryFn: async () => {
      if (!workpaperId) return [];

      const { data, error } = await supabase
        .from('workpaper_signoffs')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('workpaper_id', workpaperId)
        .order('signed_at', { ascending: true });

      if (error) throw error;
      return data as WorkpaperSignoff[];
    },
    enabled: !!workpaperId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Query: Get current user's role on the engagement (for permission checks)
  const { data: userRole } = useQuery({
    queryKey: ['workpaper-user-role', workpaperId, user?.id],
    queryFn: async () => {
      if (!workpaperId || !user?.id) return null;

      // Get the engagement ID from the workpaper
      const { data: workpaper, error: wpError } = await supabase
        .from('audit_workpapers')
        .select('audit_id')
        .eq('id', workpaperId)
        .single();

      if (wpError || !workpaper) return null;

      // Get user's role on the engagement
      const { data: teamMember, error: tmError } = await supabase
        .from('audit_team_members')
        .select('role')
        .eq('audit_id', workpaper.audit_id)
        .eq('user_id', user.id)
        .single();

      if (tmError || !teamMember) return null;

      return teamMember.role?.toLowerCase() || null;
    },
    enabled: !!workpaperId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Compute sign-off status
  const signoffStatus: SignoffStatus = (() => {
    const signoffTypes: SignoffType[] = ['preparer', 'reviewer', 'manager', 'partner'];
    const completedTypes = signoffs?.map((s) => s.signoff_type) || [];
    const pendingTypes = signoffTypes.filter((t) => !completedTypes.includes(t));
    const isFullySigned = pendingTypes.length === 0;
    const isLocked = completedTypes.includes('partner');

    // Determine next required type
    let nextRequiredType: SignoffType | null = null;
    if (!isFullySigned) {
      // Hierarchy: preparer must sign first, then reviewer, then manager, then partner
      for (const type of signoffTypes) {
        if (!completedTypes.includes(type)) {
          nextRequiredType = type;
          break;
        }
      }
    }

    // Check if current user can sign based on their role
    let canSign = false;
    if (user && userRole && nextRequiredType) {
      const roleToSignoffType: Record<string, SignoffType[]> = {
        staff: ['preparer'],
        staff_auditor: ['preparer'],
        senior: ['preparer', 'reviewer'],
        senior_auditor: ['preparer', 'reviewer'],
        reviewer: ['reviewer'],
        manager: ['preparer', 'reviewer', 'manager'],
        partner: ['preparer', 'reviewer', 'manager', 'partner'],
      };

      const allowedTypes = roleToSignoffType[userRole] || [];
      canSign = allowedTypes.includes(nextRequiredType);

      // Can't sign if already signed
      const hasUserSigned = signoffs?.some((s) => s.user_id === user.id);
      if (hasUserSigned) canSign = false;
    }

    return {
      canSign,
      nextRequiredType,
      completedTypes,
      pendingTypes,
      isFullySigned,
      isLocked,
    };
  })();

  // Mutation: Create a sign-off
  const createSignoffMutation = useMutation({
    mutationFn: async ({ workpaperId, signoffType, comments }: CreateSignoffParams) => {
      // Compute content hash for integrity verification
      const { data: workpaper, error: wpError } = await supabase
        .from('audit_workpapers')
        .select('content, title')
        .eq('id', workpaperId)
        .single();

      if (wpError) throw wpError;

      // Simple hash computation (in production, use a proper hash function)
      const contentString = JSON.stringify(workpaper.content) + (workpaper.title || '');
      const signatureHash = await computeHash(contentString);

      const { data, error } = await supabase
        .from('workpaper_signoffs')
        .insert({
          workpaper_id: workpaperId,
          user_id: user?.id,
          signoff_type: signoffType,
          comments: comments || null,
          signature_hash: signatureHash,
          user_agent: navigator.userAgent,
        })
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update workpaper review_status based on sign-off type
      const statusMap: Record<SignoffType, string> = {
        preparer: 'pending_review',
        reviewer: 'in_review',
        manager: 'approved',
        partner: 'locked',
      };

      const newStatus = statusMap[signoffType];
      const updateData: Record<string, any> = {
        review_status: newStatus,
        content_hash: signatureHash,
      };

      if (signoffType === 'partner') {
        updateData.locked_at = new Date().toISOString();
        updateData.locked_by = user?.id;
      }

      await supabase
        .from('audit_workpapers')
        .update(updateData)
        .eq('id', workpaperId);

      return data as WorkpaperSignoff;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workpaper-signoffs', workpaperId] });
      queryClient.invalidateQueries({ queryKey: ['workpapers'] });
      queryClient.invalidateQueries({ queryKey: ['engagement-workpaper-stats'] });

      toast({
        title: 'Sign-off recorded',
        description: `${capitalizeFirst(data.signoff_type)} sign-off has been recorded.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sign-off failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Revoke a sign-off (for corrections, admin only)
  const revokeSignoffMutation = useMutation({
    mutationFn: async ({ signoffId, reason }: RevokeSignoffParams) => {
      // Only managers/partners can revoke
      if (!['manager', 'partner'].includes(userRole || '')) {
        throw new Error('Only managers and partners can revoke sign-offs');
      }

      const { error } = await supabase
        .from('workpaper_signoffs')
        .delete()
        .eq('id', signoffId);

      if (error) throw error;

      // Reset workpaper status
      await supabase
        .from('audit_workpapers')
        .update({
          review_status: 'draft',
          locked_at: null,
          locked_by: null,
        })
        .eq('id', workpaperId);

      return { signoffId, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpaper-signoffs', workpaperId] });
      queryClient.invalidateQueries({ queryKey: ['workpapers'] });

      toast({
        title: 'Sign-off revoked',
        description: 'The sign-off has been revoked. Workpaper returned to draft.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Revocation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get sign-off requirements with completion status
  const getSignoffRequirements = (): SignoffRequirement[] => {
    const types: SignoffType[] = ['preparer', 'reviewer', 'manager', 'partner'];

    return types.map((type) => {
      const signoff = signoffs?.find((s) => s.signoff_type === type) || null;
      return {
        type,
        required: true, // All types required for full sign-off
        completed: !!signoff,
        signoff,
      };
    });
  };

  // Check if a specific user has signed
  const hasUserSigned = (userId: string): boolean => {
    return signoffs?.some((s) => s.user_id === userId) || false;
  };

  // Get sign-off by type
  const getSignoffByType = (type: SignoffType): WorkpaperSignoff | undefined => {
    return signoffs?.find((s) => s.signoff_type === type);
  };

  return {
    // Data
    signoffs: signoffs || [],
    signoffStatus,
    isLoading,
    error: error as Error | null,
    userRole,

    // Computed
    requirements: getSignoffRequirements(),
    hasUserSigned,
    getSignoffByType,

    // Actions
    createSignoff: createSignoffMutation.mutate,
    createSignoffAsync: createSignoffMutation.mutateAsync,
    revokeSignoff: revokeSignoffMutation.mutate,
    revokeSignoffAsync: revokeSignoffMutation.mutateAsync,
    refetch,

    // Loading states
    isCreating: createSignoffMutation.isPending,
    isRevoking: revokeSignoffMutation.isPending,
  };
}

// Helper functions
async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default useWorkpaperSignoffs;
