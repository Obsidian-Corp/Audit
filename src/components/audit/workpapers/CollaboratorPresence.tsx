import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollaboratorPresence as CollaboratorType } from '@/hooks/useWorkpaperCollaboration';
import { Users } from 'lucide-react';

interface CollaboratorPresenceProps {
  collaborators: CollaboratorType[];
  maxVisible?: number;
}

export function CollaboratorPresence({ 
  collaborators, 
  maxVisible = 5 
}: CollaboratorPresenceProps) {
  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const overflowCount = Math.max(0, collaborators.length - maxVisible);

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
        <Users className="w-4 h-4 text-muted-foreground" />
        <div className="flex -space-x-2">
          {visibleCollaborators.map((collaborator) => (
            <Tooltip key={collaborator.user_id}>
              <TooltipTrigger asChild>
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{ 
                    borderColor: collaborator.color,
                    backgroundColor: 'hsl(var(--background))'
                  }}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ 
                      backgroundColor: collaborator.color + '20',
                      color: collaborator.color
                    }}
                  >
                    {collaborator.user_name.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">{collaborator.user_name}</p>
                  <p className="text-muted-foreground">{collaborator.user_email}</p>
                  <p className="text-muted-foreground mt-1">
                    Active now
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {overflowCount > 0 && (
            <Avatar className="w-8 h-8 border-2 border-background">
              <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                +{overflowCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-1">
          {collaborators.length === 1 ? '1 editor' : `${collaborators.length} editors`}
        </span>
      </div>
    </TooltipProvider>
  );
}
