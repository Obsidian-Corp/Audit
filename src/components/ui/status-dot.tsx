import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusDotProps {
  status: "high" | "medium" | "low" | "critical" | "success" | "warning" | "info";
  tooltip?: string;
  className?: string;
}

const statusColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  warning: "bg-yellow-500",
  medium: "bg-blue-500",
  info: "bg-blue-400",
  success: "bg-green-500",
  low: "bg-slate-400",
};

export function StatusDot({ status, tooltip, className }: StatusDotProps) {
  const dot = (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        statusColors[status],
        className
      )}
    />
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {dot}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return dot;
}
