import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, TrendingUp, Zap } from "lucide-react";
import { ReactNode } from "react";

interface MemberHoverCardProps {
  children: ReactNode;
  member: {
    name: string;
    role: string;
    email: string;
    projects?: number;
    utilization?: number;
    skills?: string[];
    lastActive?: string;
  };
}

export function MemberHoverCard({ children, member }: MemberHoverCardProps) {
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
            <h4 className="text-sm font-semibold">{member.name}</h4>
            <p className="text-xs text-muted-foreground">{member.email}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {member.role}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Zap className="h-3 w-3" />
                Utilization
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {member.utilization || 75}%
              </span>
            </div>
            <Progress value={member.utilization || 75} className="h-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Active Projects</span>
              </div>
              <p className="font-mono font-semibold tabular-nums">
                {member.projects || 3}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last Active</span>
              </div>
              <p className="font-mono font-semibold tabular-nums">
                {member.lastActive || '2h ago'}
              </p>
            </div>
          </div>

          {member.skills && member.skills.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Top Skills</p>
              <div className="flex flex-wrap gap-1">
                {member.skills.slice(0, 4).map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Available Mon-Fri, 9AM-5PM</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
