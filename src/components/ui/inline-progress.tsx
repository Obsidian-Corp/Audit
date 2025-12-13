import { cn } from "@/lib/utils";

interface InlineProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function InlineProgress({ value, max = 100, className, showLabel = true }: InlineProgressProps) {
  const percentage = (value / max) * 100;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
