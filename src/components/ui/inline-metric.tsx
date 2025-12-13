import { cn } from "@/lib/utils";

interface InlineMetricProps {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}

export function InlineMetric({ label, value, className, valueClassName }: InlineMetricProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={cn("text-xs font-mono font-semibold tabular-nums", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
