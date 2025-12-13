import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceStandard {
  name: string;
  score: number;
  status: 'compliant' | 'partially-compliant' | 'non-compliant';
  lastAudit: string;
  nextAudit: string;
  violations: number;
  controls: number;
}

export interface ComplianceViolation {
  id: string;
  standard: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  discoveredDate: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'overdue' | 'resolved';
  owner: string;
}

export interface RegulatoryDeadline {
  name: string;
  dueDate: string;
  daysLeft: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ControlEffectiveness {
  category: string;
  score: number;
}

export function useComplianceAnalytics(engagementId?: string) {
  // For now, returning mock data structure but ready for real data
  // This would typically come from a compliance_standards table
  const { data: standards, isLoading: standardsLoading } = useQuery({
    queryKey: ['compliance-standards', engagementId],
    queryFn: async () => {
      // Mock implementation - would query real compliance data
      return [
        {
          name: 'SOX (Sarbanes-Oxley)',
          score: 92,
          status: 'compliant' as const,
          lastAudit: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextAudit: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          violations: 2,
          controls: 145,
        },
        {
          name: 'IFRS (Financial Reporting)',
          score: 88,
          status: 'compliant' as const,
          lastAudit: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextAudit: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          violations: 3,
          controls: 98,
        },
        {
          name: 'GAAP (US Standards)',
          score: 94,
          status: 'compliant' as const,
          lastAudit: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextAudit: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          violations: 1,
          controls: 112,
        },
        {
          name: 'GDPR (Data Privacy)',
          score: 78,
          status: 'partially-compliant' as const,
          lastAudit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextAudit: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          violations: 8,
          controls: 76,
        },
        {
          name: 'ISO 27001 (Security)',
          score: 85,
          status: 'compliant' as const,
          lastAudit: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextAudit: new Date(Date.now() + 68 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          violations: 5,
          controls: 114,
        },
      ] as ComplianceStandard[];
    },
  });

  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ['compliance-violations', engagementId],
    queryFn: async () => {
      // Mock implementation - would query real violation data
      const now = new Date();
      return [
        {
          id: 'VIO-2024-012',
          standard: 'GDPR',
          severity: 'high' as const,
          description: 'Data retention policy not enforced',
          discoveredDate: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'open' as const,
          owner: 'Sarah Johnson',
        },
        {
          id: 'VIO-2024-011',
          standard: 'SOX',
          severity: 'medium' as const,
          description: 'Missing segregation of duties documentation',
          discoveredDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'in-progress' as const,
          owner: 'Mike Chen',
        },
        {
          id: 'VIO-2024-010',
          standard: 'ISO 27001',
          severity: 'high' as const,
          description: 'Incomplete access control review',
          discoveredDate: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'in-progress' as const,
          owner: 'Emily Davis',
        },
      ] as ComplianceViolation[];
    },
  });

  const { data: deadlines, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['regulatory-deadlines', engagementId],
    queryFn: async () => {
      const now = new Date();
      return [
        {
          name: 'SOX 404 Assessment',
          dueDate: new Date(now.getTime() + 79 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 79,
          priority: 'high' as const,
        },
        {
          name: 'GDPR Annual Report',
          dueDate: new Date(now.getTime() + 134 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 134,
          priority: 'medium' as const,
        },
        {
          name: 'ISO 27001 Recertification',
          dueDate: new Date(now.getTime() + 155 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 155,
          priority: 'high' as const,
        },
        {
          name: 'IFRS Quarterly Filing',
          dueDate: new Date(now.getTime() + 34 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 34,
          priority: 'critical' as const,
        },
        {
          name: 'GAAP Disclosure Update',
          dueDate: new Date(now.getTime() + 63 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 63,
          priority: 'medium' as const,
        },
      ] as RegulatoryDeadline[];
    },
  });

  const { data: controlEffectiveness, isLoading: controlsLoading } = useQuery({
    queryKey: ['control-effectiveness', engagementId],
    queryFn: async () => {
      // Mock implementation - would query real control effectiveness data
      return [
        { category: 'Access Controls', score: 92 },
        { category: 'Data Protection', score: 78 },
        { category: 'Financial Controls', score: 94 },
        { category: 'Operational Controls', score: 88 },
        { category: 'IT Controls', score: 85 },
        { category: 'Compliance Monitoring', score: 90 },
      ] as ControlEffectiveness[];
    },
  });

  const overallScore = standards
    ? {
        current: Math.round(standards.reduce((sum, s) => sum + s.score, 0) / standards.length),
        previous: 84.2,
        change: 3.2,
        trend: 'improving' as const,
      }
    : { current: 0, previous: 0, change: 0, trend: 'improving' as const };

  return {
    standards: standards || [],
    violations: violations || [],
    deadlines: deadlines || [],
    controlEffectiveness: controlEffectiveness || [],
    overallScore,
    isLoading: standardsLoading || violationsLoading || deadlinesLoading || controlsLoading,
  };
}
