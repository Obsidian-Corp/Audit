import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2, Clock, MapPin } from "lucide-react";
import { ReactNode } from "react";

interface MeetingHoverCardProps {
  children: ReactNode;
  meeting: {
    title: string;
    type: string;
    date: string;
    duration: number;
    attendees?: number;
    actionItems?: number;
    completedActions?: number;
    location?: string;
  };
}

export function MeetingHoverCard({ children, meeting }: MeetingHoverCardProps) {
  const completionRate = meeting.actionItems && meeting.completedActions
    ? (meeting.completedActions / meeting.actionItems) * 100
    : 0;

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 animate-scale-in" 
        side="right"
        align="start"
      >
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold">{meeting.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {meeting.type}
              </Badge>
              <span className="text-xs text-muted-foreground">{meeting.date}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Duration</span>
              </div>
              <p className="font-mono font-semibold tabular-nums">
                {meeting.duration}m
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Attendees</span>
              </div>
              <p className="font-mono font-semibold tabular-nums">
                {meeting.attendees || 8}
              </p>
            </div>
          </div>

          {meeting.actionItems && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Action Items</span>
                </div>
                <span className="font-mono font-semibold tabular-nums">
                  {meeting.completedActions}/{meeting.actionItems}
                </span>
              </div>
              <Progress value={completionRate} className="h-1.5" />
            </div>
          )}

          {meeting.location && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{meeting.location}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Hover to preview • Enter to open details
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
