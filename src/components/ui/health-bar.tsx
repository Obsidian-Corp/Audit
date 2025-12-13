import { cn } from "@/lib/utils";

interface HealthBarProps {
  value: number;
  max?: number;
  status?: "healthy" | "warning" | "critical";
  className?: string;
  showLabel?: boolean;
}

export function HealthBar({ value, max = 100, status, className, showLabel = true }: HealthBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Auto-determine status if not provided
  const effectiveStatus = status || (
    percentage >= 75 ? "healthy" :
    percentage >= 40 ? "warning" :
    "critical"
  );
  
  const statusConfig = {
    healthy: {
      gradient: "from-success/80 to-success",
      glow: "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
      label: "Healthy"
    },
    warning: {
      gradient: "from-warning/80 to-warning",
      glow: "shadow-[0_0_10px_rgba(251,146,60,0.3)]",
      label: "Warning"
    },
    critical: {
      gradient: "from-destructive/80 to-destructive",
      glow: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
      label: "Critical"
    }
  };

  const config = statusConfig[effectiveStatus];

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Health</span>
          <span className="font-mono font-medium tabular-nums">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
            config.gradient,
            config.glow
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
