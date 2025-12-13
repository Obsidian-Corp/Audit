import { supabase } from '@/integrations/supabase/client';
import { Stakeholder, StakeholderFilter, CommunicationLog } from './types';

export class StakeholderService {
  static async listStakeholders(filter: StakeholderFilter = {}): Promise<Stakeholder[]> {
    try {
      let query = supabase
        .from('stakeholders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.projectId) {
        query = query.eq('project_id', filter.projectId);
      }
      if (filter.influenceLevel) {
        query = query.eq('influence_level', filter.influenceLevel);
      }
      if (filter.interestLevel) {
        query = query.eq('interest_level', filter.interestLevel);
      }
      if (filter.searchQuery) {
        query = query.or(`name.ilike.%${filter.searchQuery}%,role.ilike.%${filter.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Stakeholder[];
    } catch (error) {
      console.error('Error listing stakeholders:', error);
      return [];
    }
  }

  static async createStakeholder(stakeholder: Partial<Stakeholder>): Promise<Stakeholder | null> {
    try {
      const { data, error } = await supabase
        .from('stakeholders')
        .insert([stakeholder as any])
        .select()
        .single();

      if (error) throw error;
      return data as Stakeholder;
    } catch (error) {
      console.error('Error creating stakeholder:', error);
      return null;
    }
  }

  static async updateStakeholder(
    id: string,
    updates: Partial<Stakeholder>
  ): Promise<Stakeholder | null> {
    try {
      const { data, error } = await supabase
        .from('stakeholders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Stakeholder;
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      return null;
    }
  }

  static async deleteStakeholder(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stakeholders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      return false;
    }
  }

  static async getCommunicationLogs(stakeholderId: string): Promise<CommunicationLog[]> {
    try {
      const { data, error } = await supabase
        .from('stakeholder_communications')
        .select('*')
        .eq('stakeholder_id', stakeholderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching communication logs:', error);
      return [];
    }
  }

  static async logCommunication(log: Partial<CommunicationLog>): Promise<CommunicationLog | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!log.stakeholder_id) {
        throw new Error('stakeholder_id is required');
      }
      
      const { data, error } = await supabase
        .from('stakeholder_communications')
        .insert([{
          stakeholder_id: log.stakeholder_id,
          communication_type: log.communication_type || 'other',
          subject: log.subject,
          content: log.content,
          direction: log.direction,
          scheduled_at: log.scheduled_at,
          completed_at: log.completed_at,
          created_by: user?.id,
          organization_id: '', // This will be set by your backend/RLS
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging communication:', error);
      return null;
    }
  }

  static getEngagementStrategy(influence: string, interest: string): string {
    const strategies: Record<string, Record<string, string>> = {
      high: {
        high: 'Manage Closely - Key players who need active engagement and management',
        medium: 'Keep Satisfied - Important stakeholders to keep informed and satisfied',
        low: 'Keep Satisfied - Monitor their satisfaction and address concerns',
      },
      medium: {
        high: 'Keep Informed - Engage regularly with updates and information',
        medium: 'Keep Informed - Moderate engagement with regular updates',
        low: 'Monitor - Minimal effort, monitor for changes',
      },
      low: {
        high: 'Keep Informed - Show consideration and keep them updated',
        medium: 'Monitor - Minimal effort, general monitoring',
        low: 'Monitor - Minimal effort, occasional updates sufficient',
      },
    };

    return strategies[influence]?.[interest] || 'Monitor';
  }
}
