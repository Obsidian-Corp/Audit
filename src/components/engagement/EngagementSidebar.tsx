/**
 * ==================================================================
 * ENGAGEMENT SIDEBAR COMPONENT
 * ==================================================================
 * Right sidebar for engagement detail page showing team members,
 * key dates, engagement stats, and materiality per System Design
 * Document Section 7.4
 * ==================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  DollarSign,
  Calculator,
  TrendingUp,
  Mail,
  Phone,
  Plus,
} from 'lucide-react';
import { useMateriality } from '@/hooks/useAuditTools';

interface EngagementSidebarProps {
  engagement: any;
}

export function EngagementSidebar({ engagement }: EngagementSidebarProps) {
  const engagementId = engagement?.id;
  const { data: materiality } = useMateriality(engagementId || '');

  // Helper to get initials
  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="space-y-4">
      {/* Team Members Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Partner */}
          {engagement?.partner && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={engagement.partner.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(engagement.partner.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{engagement.partner.full_name}</p>
                <p className="text-xs text-muted-foreground">Partner</p>
              </div>
            </div>
          )}

          {/* Manager */}
          {engagement?.manager && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={engagement.manager.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(engagement.manager.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{engagement.manager.full_name}</p>
                <p className="text-xs text-muted-foreground">Manager</p>
              </div>
            </div>
          )}

          {/* Team Members */}
          {engagement?.team_members?.map((member: any) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.user?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(member.user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{member.role || 'Team Member'}</p>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" className="w-full mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardContent>
      </Card>

      {/* Key Dates Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Year End</span>
            <span className="font-medium">
              {engagement?.year_end_date
                ? new Date(engagement.year_end_date).toLocaleDateString()
                : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Planning Start</span>
            <span className="font-medium">
              {engagement?.planning_start_date
                ? new Date(engagement.planning_start_date).toLocaleDateString()
                : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Fieldwork Start</span>
            <span className="font-medium">
              {engagement?.fieldwork_start_date
                ? new Date(engagement.fieldwork_start_date).toLocaleDateString()
                : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Report Due</span>
            <span className="font-medium">
              {engagement?.planned_end_date
                ? new Date(engagement.planned_end_date).toLocaleDateString()
                : 'Not set'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Hours Logged */}
          <div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground">Hours Logged</span>
              <span className="font-medium">87 / {engagement?.budget_hours || 0}</span>
            </div>
            <Progress
              value={
                engagement?.budget_hours
                  ? Math.min((87 / engagement.budget_hours) * 100, 100)
                  : 0
              }
              className="h-1.5"
            />
          </div>

          {/* Workpapers */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Workpapers
            </span>
            <span className="font-medium">18 / 25</span>
          </div>

          {/* Findings */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Open Findings</span>
            <Badge variant="secondary" className="h-5 text-xs">
              12
            </Badge>
          </div>

          {/* PBC Items */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">PBC Items</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">28/42</span>
              <Badge variant="outline" className="h-5 text-xs">
                5 Overdue
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materiality Card */}
      {materiality && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Materiality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Overall</span>
              <span className="font-medium">
                ${materiality.overall_materiality?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Performance</span>
              <span className="font-medium">
                ${materiality.performance_materiality?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Clearly Trivial</span>
              <span className="font-medium">
                ${materiality.clearly_trivial_threshold?.toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Benchmark: {materiality.benchmark_type?.replace('_', ' ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Contact Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Client Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {engagement?.client && (
            <>
              <div className="text-sm font-medium">{engagement.client.client_name}</div>
              {engagement.client.contact_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <a
                    href={`mailto:${engagement.client.contact_email}`}
                    className="hover:underline truncate"
                  >
                    {engagement.client.contact_email}
                  </a>
                </div>
              )}
              {engagement.client.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <a href={`tel:${engagement.client.contact_phone}`} className="hover:underline">
                    {engagement.client.contact_phone}
                  </a>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Clock className="h-4 w-4 mr-2" />
            Log Time
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Add Workpaper
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Mail className="h-4 w-4 mr-2" />
            Contact Client
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
