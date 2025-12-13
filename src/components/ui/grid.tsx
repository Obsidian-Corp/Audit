import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  className?: string;
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  colSpan?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  rowSpan?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

// 12-column asymmetric grid system
export function Grid({ children, className }: GridProps) {
  return (
    <div className={cn("grid grid-cols-12 gap-4 md:gap-6", className)}>
      {children}
    </div>
  );
}

export function GridItem({ children, className, colSpan, rowSpan }: GridItemProps) {
  const colSpanClasses = [
    colSpan?.sm && `col-span-${colSpan.sm}`,
    colSpan?.md && `md:col-span-${colSpan.md}`,
    colSpan?.lg && `lg:col-span-${colSpan.lg}`,
    colSpan?.xl && `xl:col-span-${colSpan.xl}`,
  ].filter(Boolean).join(" ");

  const rowSpanClasses = [
    rowSpan?.sm && `row-span-${rowSpan.sm}`,
    rowSpan?.md && `md:row-span-${rowSpan.md}`,
    rowSpan?.lg && `lg:row-span-${rowSpan.lg}`,
    rowSpan?.xl && `xl:row-span-${rowSpan.xl}`,
  ].filter(Boolean).join(" ");

  return (
    <div className={cn(colSpanClasses, rowSpanClasses, className)}>
      {children}
    </div>
  );
}
