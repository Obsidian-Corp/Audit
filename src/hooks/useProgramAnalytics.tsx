import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProgramMetrics {
  program_id: string;
  program_name: string;
  total_procedures: number;
  completed_procedures: number;
  in_progress_procedures: number;
  not_started_procedures: number;
  completion_percentage: number;
  avg_completion_time_days: number;
  overdue_procedures: number;
  total_estimated_hours: number;
  total_actual_hours: number;
  efficiency_ratio: number;
}

export interface ProcedureEfficiency {
  procedure_name: string;
  estimated_hours: number;
  actual_hours: number;
  completion_count: number;
  avg_days_to_complete: number;
  variance_percentage: number;
}

export interface TeamPerformance {
  user_id: string;
  user_name: string;
  total_assigned: number;
  completed: number;
  in_progress: number;
  overdue: number;
  avg_completion_time_days: number;
  completion_rate: number;
}

export interface WorkpaperReviewMetrics {
  status: string;
  count: number;
  avg_review_time_days: number;
  oldest_pending_days: number;
}

export function useProgramAnalytics(engagementId?: string) {
  const { data: programMetrics, isLoading: programsLoading } = useQuery({
    queryKey: ['program-metrics', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagement_programs')
        .select(`
          id,
          program_name,
          total_procedures,
          completed_procedures,
          in_progress_procedures,
          created_at
        `);

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((program: any) => ({
        program_id: program.id,
        program_name: program.program_name,
        total_procedures: program.total_procedures || 0,
        completed_procedures: program.completed_procedures || 0,
        in_progress_procedures: program.in_progress_procedures || 0,
        not_started_procedures: (program.total_procedures || 0) - (program.completed_procedures || 0) - (program.in_progress_procedures || 0),
        completion_percentage: program.total_procedures > 0 
          ? Math.round(((program.completed_procedures || 0) / program.total_procedures) * 100)
          : 0,
        avg_completion_time_days: 0,
        overdue_procedures: 0,
        total_estimated_hours: 0,
        total_actual_hours: 0,
        efficiency_ratio: 0,
      })) as ProgramMetrics[];
    },
  });

  const { data: procedureEfficiency, isLoading: efficiencyLoading } = useQuery({
    queryKey: ['procedure-efficiency', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagement_procedures')
        .select(`
          procedure_name,
          estimated_hours,
          status,
          completed_at,
          started_at,
          due_date
        `);

      if (engagementId) {
        query = query.eq('engagement_program_id', engagementId);
      }

      const { data, error } = await query.eq('status', 'complete');
      if (error) throw error;

      const procedureMap = new Map<string, any>();

      (data || []).forEach((proc: any) => {
        if (!procedureMap.has(proc.procedure_name)) {
          procedureMap.set(proc.procedure_name, {
            procedure_name: proc.procedure_name,
            estimated_hours: proc.estimated_hours || 0,
            actual_hours: proc.estimated_hours || 0,
            completion_count: 0,
            total_days: 0,
          });
        }

        const procData = procedureMap.get(proc.procedure_name);
        procData.completion_count += 1;

        if (proc.started_at && proc.completed_at) {
          const days = Math.ceil(
            (new Date(proc.completed_at).getTime() - new Date(proc.started_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          procData.total_days += days;
        }
      });

      return Array.from(procedureMap.values()).map((proc) => ({
        ...proc,
        avg_days_to_complete: proc.completion_count > 0 ? Math.round(proc.total_days / proc.completion_count) : 0,
        variance_percentage: proc.estimated_hours > 0 
          ? Math.round(((proc.actual_hours - proc.estimated_hours) / proc.estimated_hours) * 100)
          : 0,
      })) as ProcedureEfficiency[];
    },
  });

  const { data: teamPerformance, isLoading: teamLoading } = useQuery({
    queryKey: ['team-performance', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagement_procedures')
        .select(`
          assigned_to,
          status,
          completed_at,
          started_at,
          due_date,
          profiles:assigned_to (
            full_name
          )
        `);

      if (engagementId) {
        query = query.eq('engagement_program_id', engagementId);
      }

      const { data, error } = await query.not('assigned_to', 'is', null);
      if (error) throw error;

      const userMap = new Map<string, any>();

      (data || []).forEach((proc: any) => {
        const userId = proc.assigned_to;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            user_name: proc.profiles?.full_name || 'Unknown',
            total_assigned: 0,
            completed: 0,
            in_progress: 0,
            overdue: 0,
            total_days: 0,
            completed_count: 0,
          });
        }

        const userData = userMap.get(userId);
        userData.total_assigned += 1;

        if (proc.status === 'complete') {
          userData.completed += 1;
          if (proc.started_at && proc.completed_at) {
            const days = Math.ceil(
              (new Date(proc.completed_at).getTime() - new Date(proc.started_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            userData.total_days += days;
            userData.completed_count += 1;
          }
        } else if (proc.status === 'in_progress') {
          userData.in_progress += 1;
        }

        if (proc.due_date && new Date(proc.due_date) < new Date() && proc.status !== 'complete') {
          userData.overdue += 1;
        }
      });

      return Array.from(userMap.values()).map((user) => ({
        ...user,
        avg_completion_time_days: user.completed_count > 0 
          ? Math.round(user.total_days / user.completed_count)
          : 0,
        completion_rate: user.total_assigned > 0 
          ? Math.round((user.completed / user.total_assigned) * 100)
          : 0,
      })) as TeamPerformance[];
    },
  });

  const { data: workpaperMetrics, isLoading: workpapersLoading } = useQuery({
    queryKey: ['workpaper-review-metrics', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('audit_workpapers')
        .select(`
          status,
          prepared_date,
          reviewed_date,
          created_at
        `);

      const { data, error } = await query;
      if (error) throw error;

      const statusMap = new Map<string, any>();

      (data || []).forEach((wp: any) => {
        if (!statusMap.has(wp.status)) {
          statusMap.set(wp.status, {
            status: wp.status,
            count: 0,
            total_review_days: 0,
            review_count: 0,
            oldest_days: 0,
          });
        }

        const statusData = statusMap.get(wp.status);
        statusData.count += 1;

        if (wp.prepared_date && wp.reviewed_date) {
          const days = Math.ceil(
            (new Date(wp.reviewed_date).getTime() - new Date(wp.prepared_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          statusData.total_review_days += days;
          statusData.review_count += 1;
        }

        if (wp.status === 'in_review' && wp.prepared_date) {
          const days = Math.ceil(
            (new Date().getTime() - new Date(wp.prepared_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          statusData.oldest_days = Math.max(statusData.oldest_days, days);
        }
      });

      return Array.from(statusMap.values()).map((status) => ({
        ...status,
        avg_review_time_days: status.review_count > 0 
          ? Math.round(status.total_review_days / status.review_count)
          : 0,
      })) as WorkpaperReviewMetrics[];
    },
  });

  return {
    programMetrics: programMetrics || [],
    procedureEfficiency: procedureEfficiency || [],
    teamPerformance: teamPerformance || [],
    workpaperMetrics: workpaperMetrics || [],
    isLoading: programsLoading || efficiencyLoading || teamLoading || workpapersLoading,
  };
}
