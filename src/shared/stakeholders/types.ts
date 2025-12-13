export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization?: string;
  email?: string;
  phone?: string;
  influence_level: 'low' | 'medium' | 'high';
  interest_level: 'low' | 'medium' | 'high';
  engagement_strategy?: string;
  communication_preferences?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  project_id?: string;
}

export interface StakeholderFilter {
  projectId?: string;
  influenceLevel?: string;
  interestLevel?: string;
  searchQuery?: string;
}

export interface CommunicationLog {
  id: string;
  stakeholder_id: string;
  communication_type: string;
  subject?: string;
  content?: string;
  direction?: string;
  scheduled_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
}
