import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamMemberAssignment {
  id: string;
  user_id: string;
  audit_id: string;
  role: string;
  allocated_hours: number;
  hours_logged: number;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
  is_backup: boolean;
  skills?: any;
}

export interface ResourceConflict {
  user_id: string;
  user_name: string;
  conflicts: {
    engagement_id: string;
    engagement_name: string;
    overlap_start: string;
    overlap_end: string;
    allocated_hours: number;
  }[];
  total_hours: number;
}

export const useResourceScheduling = () => {
  const [teamAssignments, setTeamAssignments] = useState<TeamMemberAssignment[]>([]);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamAssignments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_team_members")
        .select(`
          *,
          audits!inner(
            id,
            audit_title,
            planned_start_date,
            planned_end_date,
            status
          )
        `)
        .in("audits.status", ["approved", "active", "fieldwork"]);

      if (error) throw error;
      setTeamAssignments(data || []);
      
      // Detect conflicts
      detectResourceConflicts(data || []);
    } catch (error: any) {
      console.error("Error fetching team assignments:", error);
      toast({
        title: "Error loading resource assignments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const detectResourceConflicts = (assignments: any[]) => {
    const userMap = new Map<string, any[]>();
    
    // Group assignments by user
    assignments.forEach(assignment => {
      if (!userMap.has(assignment.user_id)) {
        userMap.set(assignment.user_id, []);
      }
      userMap.get(assignment.user_id)!.push(assignment);
    });

    const detectedConflicts: ResourceConflict[] = [];

    // Check for overlapping assignments
    userMap.forEach((userAssignments, userId) => {
        const overlaps: any[] = [];
        
        for (let i = 0; i < userAssignments.length; i++) {
          for (let j = i + 1; j < userAssignments.length; j++) {
            const a1 = userAssignments[i];
            const a2 = userAssignments[j];
            
            // Check date overlap
            const start1 = new Date(a1.start_date || a1.audits.planned_start_date);
            const end1 = new Date(a1.end_date || a1.audits.planned_end_date);
            const start2 = new Date(a2.start_date || a2.audits.planned_start_date);
            const end2 = new Date(a2.end_date || a2.audits.planned_end_date);

            if (start1 <= end2 && start2 <= end1) {
              overlaps.push({
                engagement_id: a2.audit_id,
                engagement_name: a2.audits.audit_title,
                overlap_start: start2 > start1 ? a2.start_date : a1.start_date,
                overlap_end: end2 < end1 ? a2.end_date : a1.end_date,
                allocated_hours: a2.allocated_hours,
              });
            }
          }
        }

      if (overlaps.length > 0) {
        detectedConflicts.push({
          user_id: userId,
          user_name: userAssignments[0].user_id, // Would need to join with profiles
          conflicts: overlaps,
          total_hours: overlaps.reduce((sum, o) => sum + o.allocated_hours, 0),
        });
      }
    });

    setConflicts(detectedConflicts);
  };

  const checkAvailability = async (
    userId: string,
    startDate: string,
    endDate: string,
    excludeEngagementId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("audit_team_members")
        .select(`
          *,
          audits!inner(
            id,
            audit_title,
            planned_start_date,
            planned_end_date,
            status
          )
        `)
        .eq("user_id", userId)
        .in("audits.status", ["approved", "active", "fieldwork"]);

      if (error) throw error;

      const conflicts = (data || []).filter(assignment => {
        if (excludeEngagementId && assignment.audit_id === excludeEngagementId) {
          return false;
        }

        const assignStart = new Date(assignment.start_date || assignment.audits.planned_start_date);
        const assignEnd = new Date(assignment.end_date || assignment.audits.planned_end_date);
        const checkStart = new Date(startDate);
        const checkEnd = new Date(endDate);

        return assignStart <= checkEnd && checkStart <= assignEnd;
      });

      return {
        available: conflicts.length === 0,
        conflicts: conflicts.map(c => ({
          engagement_id: c.audit_id,
          engagement_name: c.audits.audit_title,
          start_date: c.start_date || c.audits.planned_start_date,
          end_date: c.end_date || c.audits.planned_end_date,
          allocated_hours: c.allocated_hours,
        })),
      };
    } catch (error: any) {
      console.error("Error checking availability:", error);
      return { available: false, conflicts: [] };
    }
  };

  useEffect(() => {
    fetchTeamAssignments();
  }, []);

  return {
    teamAssignments,
    conflicts,
    loading,
    checkAvailability,
    refetch: fetchTeamAssignments,
  };
};
