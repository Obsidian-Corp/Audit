import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardNavigationProps {
  items: any[];
  onSelect?: (item: any, index: number) => void;
  onClose?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  items,
  onSelect,
  onClose,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const selectedIndexRef = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || items.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          selectedIndexRef.current = Math.min(
            selectedIndexRef.current + 1,
            items.length - 1
          );
          // Scroll into view
          const nextElement = document.querySelector(
            `[data-keyboard-index="${selectedIndexRef.current}"]`
          );
          nextElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;

        case 'ArrowUp':
          event.preventDefault();
          selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
          // Scroll into view
          const prevElement = document.querySelector(
            `[data-keyboard-index="${selectedIndexRef.current}"]`
          );
          prevElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;

        case 'Enter':
          event.preventDefault();
          if (selectedIndexRef.current >= 0 && onSelect) {
            onSelect(items[selectedIndexRef.current], selectedIndexRef.current);
          }
          break;

        case 'Escape':
          event.preventDefault();
          if (onClose) {
            onClose();
          }
          selectedIndexRef.current = -1;
          break;

        default:
          break;
      }
    },
    [items, onSelect, onClose, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    selectedIndex: selectedIndexRef.current,
    setSelectedIndex: (index: number) => {
      selectedIndexRef.current = index;
    },
  };
}
