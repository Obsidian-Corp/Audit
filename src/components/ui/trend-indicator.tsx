import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  className?: string;
  showIcon?: boolean;
  showSign?: boolean;
}

export function TrendIndicator({ value, className, showIcon = true, showSign = true }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  const colorClass = isNeutral 
    ? "text-muted-foreground" 
    : isPositive 
      ? "text-success" 
      : "text-destructive";

  return (
    <div className={cn("flex items-center gap-1 font-mono text-xs font-medium", colorClass, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span className="tabular-nums">
        {showSign && value > 0 && "+"}
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
