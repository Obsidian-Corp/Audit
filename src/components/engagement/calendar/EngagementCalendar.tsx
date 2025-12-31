/**
 * ==================================================================
 * ENGAGEMENT CALENDAR
 * ==================================================================
 * Calendar view for engagement milestones, deadlines, and events
 * ==================================================================
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

interface EngagementCalendarProps {
  engagementId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'deadline' | 'task' | 'meeting';
  status: 'pending' | 'completed' | 'overdue';
  description?: string;
}

export function EngagementCalendar({ engagementId }: EngagementCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch engagement data including milestones
  const { data: engagement } = useQuery({
    queryKey: ['engagement-calendar', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', engagementId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Generate calendar events from engagement data
  const events = useMemo<CalendarEvent[]>(() => {
    if (!engagement) return [];

    const eventList: CalendarEvent[] = [];
    const now = new Date();

    // Planning deadline
    if (engagement.planning_deadline) {
      const planningDate = new Date(engagement.planning_deadline);
      eventList.push({
        id: 'planning-deadline',
        title: 'Planning Completion',
        date: planningDate,
        type: 'milestone',
        status: planningDate < now ? 'overdue' : 'pending',
        description: 'Complete audit planning phase',
      });
    }

    // Fieldwork start
    if (engagement.fieldwork_start) {
      const fieldworkStart = new Date(engagement.fieldwork_start);
      eventList.push({
        id: 'fieldwork-start',
        title: 'Fieldwork Begins',
        date: fieldworkStart,
        type: 'milestone',
        status: fieldworkStart < now ? 'completed' : 'pending',
        description: 'Start fieldwork procedures',
      });
    }

    // Fieldwork end
    if (engagement.fieldwork_end) {
      const fieldworkEnd = new Date(engagement.fieldwork_end);
      eventList.push({
        id: 'fieldwork-end',
        title: 'Fieldwork Completion',
        date: fieldworkEnd,
        type: 'deadline',
        status: fieldworkEnd < now ? 'overdue' : 'pending',
        description: 'Complete all fieldwork procedures',
      });
    }

    // Report due date
    if (engagement.report_due_date) {
      const reportDue = new Date(engagement.report_due_date);
      eventList.push({
        id: 'report-due',
        title: 'Report Due Date',
        date: reportDue,
        type: 'deadline',
        status: reportDue < now ? 'overdue' : 'pending',
        description: 'Final report delivery to client',
      });
    }

    // Period end date
    if (engagement.period_end) {
      eventList.push({
        id: 'period-end',
        title: 'Period End Date',
        date: new Date(engagement.period_end),
        type: 'milestone',
        status: 'completed',
        description: 'Client fiscal year end',
      });
    }

    return eventList;
  }, [engagement]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'milestone':
        return <Target className="h-4 w-4" />;
      case 'deadline':
        return <AlertTriangle className="h-4 w-4" />;
      case 'task':
        return <FileCheck className="h-4 w-4" />;
      case 'meeting':
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Engagement Calendar</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          View and manage engagement milestones, deadlines, and events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          {/* Calendar */}
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border"
              modifiers={{
                hasEvent: (date) => getEventsForDate(date).length > 0,
                overdue: (date) => getEventsForDate(date).some((e) => e.status === 'overdue'),
              }}
              modifiersStyles={{
                hasEvent: { fontWeight: 'bold', textDecoration: 'underline' },
                overdue: { color: 'rgb(220, 38, 38)' },
              }}
            />
          </div>

          {/* Event List / Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {selectedDate
                ? `Events for ${format(selectedDate, 'MMM d, yyyy')}`
                : 'Upcoming Events'}
            </h3>

            {selectedDate && selectedDateEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No events on this date</p>
            )}

            {(selectedDate ? selectedDateEvents : events.slice(0, 5)).map((event) => (
              <div
                key={event.id}
                className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{event.title}</span>
                      <Badge className={getStatusColor(event.status)} variant="secondary">
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(event.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!selectedDate && events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No events scheduled. Add milestones to your engagement.
              </p>
            )}
          </div>
        </div>

        {/* Event Detail Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent && getEventIcon(selectedEvent.type)}
                {selectedEvent?.title}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent && format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={selectedEvent ? getStatusColor(selectedEvent.status) : ''}>
                  {selectedEvent?.status}
                </Badge>
              </div>
              {selectedEvent?.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="mt-1">{selectedEvent.description}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                {selectedEvent?.status === 'pending' && (
                  <Button variant="outline">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
