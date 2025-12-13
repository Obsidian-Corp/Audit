import { ReactNode } from 'react';
import { useVirtualized } from '@/hooks/useVirtualized';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5,
}: VirtualizedListProps<T>) {
  const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualized({
    itemHeight,
    overscan,
    totalItems: items.length,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((index) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="animate-fade-in"
            >
              {renderItem(items[index], index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
