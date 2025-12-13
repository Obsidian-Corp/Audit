import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in-up", className)}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full animate-pulse-glow" />
        <div className="relative bg-surface-elevated border border-border-interactive rounded-2xl p-6 animate-float">
          <Icon className="h-12 w-12 text-gold mx-auto" strokeWidth={1.5} />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">{description}</p>
      
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-gold text-black hover:bg-gold/90 transition-all duration-200 hover:scale-105 hover:shadow-gold"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
