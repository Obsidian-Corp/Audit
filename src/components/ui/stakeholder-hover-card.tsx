import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, MessageSquare, Target } from "lucide-react";
import { ReactNode } from "react";

interface StakeholderHoverCardProps {
  children: ReactNode;
  stakeholder: {
    name: string;
    role?: string;
    influence: string;
    interest: string;
    engagement?: number;
    lastContact?: string;
    nextTouchpoint?: string;
    communicationFrequency?: string;
  };
}

export function StakeholderHoverCard({ children, stakeholder }: StakeholderHoverCardProps) {
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
            <h4 className="text-sm font-semibold">{stakeholder.name}</h4>
            {stakeholder.role && (
              <p className="text-xs text-muted-foreground">{stakeholder.role}</p>
            )}
            <div className="flex gap-2 mt-1">
              <Badge 
                variant="outline" 
                className="text-xs"
              >
                {stakeholder.influence} influence
              </Badge>
              <Badge 
                variant="outline" 
                className="text-xs"
              >
                {stakeholder.interest} interest
              </Badge>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Engagement Score</span>
              </div>
              <span className="font-mono font-semibold tabular-nums">
                {stakeholder.engagement || 85}%
              </span>
            </div>
            <Progress value={stakeholder.engagement || 85} className="h-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Last Contact</span>
              </div>
              <p className="font-mono font-semibold tabular-nums">
                {stakeholder.lastContact || '3d ago'}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>Next Touchpoint</span>
              </div>
              <p className="font-mono font-semibold tabular-nums">
                {stakeholder.nextTouchpoint || 'In 4d'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>
                Contact: {stakeholder.communicationFrequency || 'Weekly'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Press E to edit • Press M to log communication
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
