/**
 * EngagementContext
 * Ticket: CTX-001, FEAT-002
 *
 * Provides engagement data and actions to all components within an engagement route.
 * Fetches engagement details, team, materiality, and computes statistics.
 *
 * FEAT-002 enhancements:
 * - Recent engagements tracking with localStorage persistence
 * - Quick engagement switching functionality
 * - Engagement breadcrumb support
 */

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

// Type definitions
type Engagement = Database['public']['Tables']['audits']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export type EngagementStatus =
  | 'draft'
  | 'accepted'
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'complete'
  | 'on_hold'
  | 'cancelled';

export type EngagementPhase =
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'complete';

export type EngagementRole =
  | 'partner'
  | 'manager'
  | 'senior'
  | 'staff'
  | 'observer';

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  hours_allocated: number;
  hours_actual: number;
  profiles: Profile | null;
}

export interface MaterialityCalculation {
  id: string;
  benchmark_type: string;
  benchmark_amount: number;
  overall_materiality: number;
  performance_materiality: number;
  clearly_trivial_threshold: number;
  is_active: boolean;
}

export interface ProcedureStats {
  total: number;
  not_started: number;
  in_progress: number;
  in_review: number;
  complete: number;
}

export interface FindingStats {
  total: number;
  open: number;
  resolved: number;
  by_severity: Record<string, number>;
}

export interface WorkpaperStats {
  total: number;
  draft: number;
  pending_review: number;
  approved: number;
  locked: number;
}

/** Recent engagement for quick switching */
export interface RecentEngagement {
  id: string;
  name: string;
  clientName: string | null;
  visitedAt: number;
}

// Local storage key for recent engagements
const RECENT_ENGAGEMENTS_KEY = 'audit-recent-engagements';
const MAX_RECENT_ENGAGEMENTS = 5;

/**
 * Load recent engagements from localStorage
 */
function loadRecentEngagements(): RecentEngagement[] {
  try {
    const stored = localStorage.getItem(RECENT_ENGAGEMENTS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save recent engagements to localStorage
 */
function saveRecentEngagements(engagements: RecentEngagement[]): void {
  try {
    localStorage.setItem(RECENT_ENGAGEMENTS_KEY, JSON.stringify(engagements));
  } catch {
    // Ignore storage errors
  }
}

export interface EngagementWithRelations extends Engagement {
  clients: Client | null;
  audit_team_members: TeamMember[];
  materiality_calculations: MaterialityCalculation[];
}

interface EngagementContextType {
  // Core Data
  engagement: EngagementWithRelations | null;
  engagementId: string | null;
  client: Client | null;

  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;

  // Team
  team: TeamMember[];
  currentUserRole: EngagementRole | null;

  // Materiality (latest active)
  materiality: MaterialityCalculation | null;

  // Statistics
  procedureStats: ProcedureStats;
  findingStats: FindingStats;
  workpaperStats: WorkpaperStats;

  // Computed Properties
  completionPercentage: number;
  hoursRemaining: number;
  budgetVariance: number;
  daysUntilDue: number;

  // FEAT-002: Recent engagements and switching
  recentEngagements: RecentEngagement[];
  switchToEngagement: (engagementId: string) => void;
  clearEngagementContext: () => void;

  // Actions
  refreshEngagement: () => Promise<void>;
  updateStatus: (status: EngagementStatus) => Promise<void>;
  updatePhase: (phase: EngagementPhase) => Promise<void>;
  navigateToSection: (section: string) => void;
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

// Default stats
const DEFAULT_PROCEDURE_STATS: ProcedureStats = {
  total: 0,
  not_started: 0,
  in_progress: 0,
  in_review: 0,
  complete: 0,
};

const DEFAULT_FINDING_STATS: FindingStats = {
  total: 0,
  open: 0,
  resolved: 0,
  by_severity: {},
};

const DEFAULT_WORKPAPER_STATS: WorkpaperStats = {
  total: 0,
  draft: 0,
  pending_review: 0,
  approved: 0,
  locked: 0,
};

/**
 * EngagementProvider component
 * Wraps engagement pages to provide context
 */
export function EngagementProvider({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // FEAT-002: Recent engagements state
  const [recentEngagements, setRecentEngagements] = useState<RecentEngagement[]>(
    loadRecentEngagements
  );

  // Main engagement query with related data
  const {
    data: engagement,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['engagement', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          clients (id, client_name, industry, entity_type, client_type),
          audit_team_members (
            id, user_id, role, hours_allocated, hours_actual,
            profiles (id, full_name, email, avatar_url, first_name, last_name)
          ),
          materiality_calculations (
            id, benchmark_type, benchmark_amount,
            overall_materiality, performance_materiality,
            clearly_trivial_threshold, is_active
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as EngagementWithRelations;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Procedure stats query
  const { data: procedureStatsData } = useQuery({
    queryKey: ['engagement-procedure-stats', id],
    queryFn: async () => {
      if (!id) return DEFAULT_PROCEDURE_STATS;

      const { data, error } = await supabase
        .from('audit_procedures')
        .select('status')
        .eq('engagement_id', id);

      if (error) {
        console.error('Error fetching procedure stats:', error);
        return DEFAULT_PROCEDURE_STATS;
      }

      const stats: ProcedureStats = {
        total: data?.length || 0,
        not_started: data?.filter((p) => p.status === 'not_started').length || 0,
        in_progress: data?.filter((p) => p.status === 'in_progress').length || 0,
        in_review: data?.filter((p) => p.status === 'in_review' || p.status === 'pending_review').length || 0,
        complete: data?.filter((p) => p.status === 'complete' || p.status === 'signed_off').length || 0,
      };

      return stats;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Finding stats query
  const { data: findingStatsData } = useQuery({
    queryKey: ['engagement-finding-stats', id],
    queryFn: async () => {
      if (!id) return DEFAULT_FINDING_STATS;

      const { data, error } = await supabase
        .from('audit_findings')
        .select('status, severity')
        .eq('engagement_id', id);

      if (error) {
        console.error('Error fetching finding stats:', error);
        return DEFAULT_FINDING_STATS;
      }

      const bySeverity: Record<string, number> = {};
      data?.forEach((f) => {
        const sev = f.severity || 'unknown';
        bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      });

      const stats: FindingStats = {
        total: data?.length || 0,
        open: data?.filter((f) => f.status === 'open' || f.status === 'identified').length || 0,
        resolved: data?.filter((f) => f.status === 'resolved' || f.status === 'closed').length || 0,
        by_severity: bySeverity,
      };

      return stats;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  // Workpaper stats query
  const { data: workpaperStatsData } = useQuery({
    queryKey: ['engagement-workpaper-stats', id],
    queryFn: async () => {
      if (!id) return DEFAULT_WORKPAPER_STATS;

      const { data, error } = await supabase
        .from('audit_workpapers')
        .select('status, review_status')
        .eq('audit_id', id);

      if (error) {
        console.error('Error fetching workpaper stats:', error);
        return DEFAULT_WORKPAPER_STATS;
      }

      const stats: WorkpaperStats = {
        total: data?.length || 0,
        draft: data?.filter((w) => w.status === 'draft' || w.review_status === 'draft').length || 0,
        pending_review: data?.filter((w) => w.status === 'in_review' || w.review_status === 'pending_review').length || 0,
        approved: data?.filter((w) => w.status === 'approved' || w.review_status === 'approved').length || 0,
        locked: data?.filter((w) => w.review_status === 'locked').length || 0,
      };

      return stats;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: EngagementStatus) => {
      if (!id) throw new Error('No engagement ID');

      const { error } = await supabase
        .from('audits')
        .update({ workflow_status: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement', id] });
      toast({
        title: 'Status updated',
        description: 'Engagement status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update phase mutation
  const updatePhaseMutation = useMutation({
    mutationFn: async (phase: EngagementPhase) => {
      if (!id) throw new Error('No engagement ID');

      const { error } = await supabase
        .from('audits')
        .update({
          engagement_phase: phase,
          current_phase: phase,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement', id] });
      toast({
        title: 'Phase updated',
        description: 'Engagement phase has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating phase',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Actions
  const refreshEngagement = useCallback(async () => {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['engagement-procedure-stats', id] });
    await queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', id] });
    await queryClient.invalidateQueries({ queryKey: ['engagement-workpaper-stats', id] });
  }, [refetch, queryClient, id]);

  const updateStatus = useCallback(
    async (status: EngagementStatus) => {
      await updateStatusMutation.mutateAsync(status);
    },
    [updateStatusMutation]
  );

  const updatePhase = useCallback(
    async (phase: EngagementPhase) => {
      await updatePhaseMutation.mutateAsync(phase);
    },
    [updatePhaseMutation]
  );

  const navigateToSection = useCallback(
    (section: string) => {
      navigate(`/engagements/${id}/${section}`);
    },
    [navigate, id]
  );

  // FEAT-002: Switch to a different engagement
  const switchToEngagement = useCallback(
    (newEngagementId: string) => {
      // Replace engagement ID in current path
      const newPath = location.pathname.replace(
        /^\/engagements\/[^/]+/,
        `/engagements/${newEngagementId}`
      );
      navigate(newPath);
    },
    [location.pathname, navigate]
  );

  // FEAT-002: Clear engagement context
  const clearEngagementContext = useCallback(() => {
    navigate('/engagements');
  }, [navigate]);

  // FEAT-002: Track engagement visits
  useEffect(() => {
    if (engagement && id) {
      setRecentEngagements((prev) => {
        // Remove if already exists
        const filtered = prev.filter((e) => e.id !== id);

        // Add to front
        const updated: RecentEngagement[] = [
          {
            id: id,
            name: engagement.audit_name || engagement.engagement_name || 'Unnamed',
            clientName: engagement.clients?.client_name || null,
            visitedAt: Date.now(),
          },
          ...filtered,
        ].slice(0, MAX_RECENT_ENGAGEMENTS);

        // Persist
        saveRecentEngagements(updated);
        return updated;
      });
    }
  }, [engagement, id]);

  // Computed values
  const computedValues = useMemo(() => {
    const team = engagement?.audit_team_members || [];
    const materiality = engagement?.materiality_calculations?.find((m) => m.is_active) || null;
    const procedureStats = procedureStatsData || DEFAULT_PROCEDURE_STATS;

    // Completion percentage based on procedure completion
    const completionPercentage =
      procedureStats.total > 0
        ? Math.round((procedureStats.complete / procedureStats.total) * 100)
        : 0;

    // Hours calculations
    const totalAllocated = team.reduce((sum, m) => sum + (m.hours_allocated || 0), 0);
    const totalActual = team.reduce((sum, m) => sum + (m.hours_actual || 0), 0);
    const hoursRemaining = Math.max(0, totalAllocated - totalActual);

    // Budget variance (percentage over/under)
    const budgetVariance =
      totalAllocated > 0 ? ((totalActual - totalAllocated) / totalAllocated) * 100 : 0;

    // Days until due
    const endDate = engagement?.end_date ? new Date(engagement.end_date) : null;
    const daysUntilDue = endDate
      ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    // Current user's role in engagement
    let currentUserRole: EngagementRole | null = null;
    if (user) {
      const userTeamMember = team.find((m) => m.user_id === user.id);
      if (userTeamMember) {
        // Map team role to engagement role
        const roleMap: Record<string, EngagementRole> = {
          partner: 'partner',
          manager: 'manager',
          senior: 'senior',
          senior_auditor: 'senior',
          staff: 'staff',
          staff_auditor: 'staff',
          observer: 'observer',
        };
        currentUserRole = roleMap[userTeamMember.role?.toLowerCase()] || 'staff';
      }
    }

    return {
      team,
      materiality,
      completionPercentage,
      hoursRemaining,
      budgetVariance,
      daysUntilDue,
      currentUserRole,
    };
  }, [engagement, procedureStatsData, user]);

  // Build context value
  const value = useMemo<EngagementContextType>(
    () => ({
      engagement,
      engagementId: id || null,
      client: engagement?.clients || null,
      isLoading,
      isRefreshing: isRefetching,
      error: error as Error | null,
      team: computedValues.team,
      currentUserRole: computedValues.currentUserRole,
      materiality: computedValues.materiality,
      procedureStats: procedureStatsData || DEFAULT_PROCEDURE_STATS,
      findingStats: findingStatsData || DEFAULT_FINDING_STATS,
      workpaperStats: workpaperStatsData || DEFAULT_WORKPAPER_STATS,
      completionPercentage: computedValues.completionPercentage,
      hoursRemaining: computedValues.hoursRemaining,
      budgetVariance: computedValues.budgetVariance,
      daysUntilDue: computedValues.daysUntilDue,
      // FEAT-002: Recent engagements
      recentEngagements,
      switchToEngagement,
      clearEngagementContext,
      // Actions
      refreshEngagement,
      updateStatus,
      updatePhase,
      navigateToSection,
    }),
    [
      engagement,
      id,
      isLoading,
      isRefetching,
      error,
      computedValues,
      procedureStatsData,
      findingStatsData,
      workpaperStatsData,
      recentEngagements,
      switchToEngagement,
      clearEngagementContext,
      refreshEngagement,
      updateStatus,
      updatePhase,
      navigateToSection,
    ]
  );

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
}

/**
 * Hook to access engagement context
 * Must be used within EngagementProvider
 * @throws Error if used outside EngagementProvider
 */
export function useEngagementContext(): EngagementContextType {
  const context = useContext(EngagementContext);
  if (!context) {
    throw new Error('useEngagementContext must be used within EngagementProvider');
  }
  return context;
}

/**
 * Hook to optionally access engagement context
 * Returns null if not within EngagementProvider (for shared components)
 */
export function useOptionalEngagementContext(): EngagementContextType | null {
  return useContext(EngagementContext) || null;
}

export default EngagementContext;
