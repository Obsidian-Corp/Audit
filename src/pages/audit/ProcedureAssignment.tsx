import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProcedureAssignment() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const navigate = useNavigate();
  const { procedures, assignProcedure, isLoading: proceduresLoading } = useEngagementProcedures(engagementId);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [assignTo, setAssignTo] = useState('');
  const [dueDate, setDueDate] = useState<Date>();

  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('audit_title, audit_number')
        .eq('id', engagementId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!engagementId,
  });

  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: ['engagement-team', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_assignments')
        .select(`
          user_id,
          role_on_engagement,
          profiles(id, full_name, email)
        `)
        .eq('engagement_id', engagementId);

      if (error) throw error;
      return data;
    },
    enabled: !!engagementId,
  });

  const unassignedProcedures = procedures?.filter(p => !p.assigned_to) || [];
  const assignedProcedures = procedures?.filter(p => p.assigned_to) || [];

  const proceduresByCategory = unassignedProcedures.reduce((acc: any, proc) => {
    const category = proc.procedure_name.split(' ')[0] || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(proc);
    return acc;
  }, {});

  const handleToggleProcedure = (procedureId: string) => {
    setSelectedProcedures(prev =>
      prev.includes(procedureId)
        ? prev.filter(id => id !== procedureId)
        : [...prev, procedureId]
    );
  };

  const handleBulkAssign = () => {
    if (!assignTo || selectedProcedures.length === 0) return;

    selectedProcedures.forEach(procedureId => {
      assignProcedure({
        procedureId,
        assignedTo: assignTo,
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      });
    });

    setSelectedProcedures([]);
    setAssignTo('');
    setDueDate(undefined);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getWorkloadHours = (userId: string) => {
    return assignedProcedures
      .filter(p => p.assigned_to === userId)
      .reduce((sum, p) => sum + p.estimated_hours, 0);
  };

  if (proceduresLoading || engagementLoading || teamLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Engagement not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/engagements/${engagementId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Assign Procedures</h1>
          <p className="text-muted-foreground">
            {engagement.audit_title} ({engagement.audit_number})
          </p>
        </div>
      </div>

      {/* Bulk Assignment Bar */}
      {selectedProcedures.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Assign {selectedProcedures.length} procedure(s) to</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers?.map((member: any) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profiles.full_name} ({member.role_on_engagement})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleBulkAssign} disabled={!assignTo}>
                Assign Selected
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedProcedures([])}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Unassigned Procedures */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Procedures ({unassignedProcedures.length})</CardTitle>
              <CardDescription>
                Select procedures and assign them to team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {Object.entries(proceduresByCategory).map(([category, procs]: [string, any]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        {category} ({procs.length})
                      </h3>
                      <div className="space-y-2">
                        {procs.map((proc: any) => (
                          <Card
                            key={proc.id}
                            className={cn(
                              'cursor-pointer transition-colors',
                              selectedProcedures.includes(proc.id)
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            )}
                            onClick={() => handleToggleProcedure(proc.id)}
                          >
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{proc.procedure_name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {proc.objective}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={proc.priority === 'high' ? 'destructive' : 'secondary'}>
                                    {proc.priority}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {proc.estimated_hours}h
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Team Members */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {teamMembers?.map((member: any) => {
                    const workloadHours = getWorkloadHours(member.user_id);
                    const assignedCount = assignedProcedures.filter(
                      p => p.assigned_to === member.user_id
                    ).length;

                    return (
                      <Card key={member.user_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(member.profiles.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {member.profiles.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.role_on_engagement}
                              </p>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Assigned:</span>
                                  <span className="font-medium">{assignedCount} procedures</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Workload:</span>
                                  <span className="font-medium">{workloadHours}h</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
