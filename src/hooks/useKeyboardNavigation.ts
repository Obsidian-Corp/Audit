/**
 * useKeyboardNavigation Hook
 * Ticket: UI-003
 *
 * Provides keyboard navigation support for the sidebar.
 * Features:
 * - Arrow key navigation between items
 * - Enter/Space to activate items
 * - Home/End to jump to first/last item
 * - Escape to close sidebar on mobile
 * - Cmd/Ctrl+K for quick search (future)
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardNavigationOptions {
  /** Container element ref */
  containerRef: React.RefObject<HTMLElement>;
  /** Selector for focusable nav items */
  itemSelector?: string;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Enable navigation (can be disabled when modal is open) */
  enabled?: boolean;
}

interface UseKeyboardNavigationReturn {
  /** Handle keyboard events on the container */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Focus the first navigation item */
  focusFirst: () => void;
  /** Focus the last navigation item */
  focusLast: () => void;
  /** Focus the currently active item */
  focusActive: () => void;
}

/**
 * Hook for keyboard navigation in the sidebar
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { handleKeyDown } = useKeyboardNavigation({
 *   containerRef,
 *   onEscape: () => closeSidebar(),
 * });
 *
 * return (
 *   <nav ref={containerRef} onKeyDown={handleKeyDown}>
 *     ...navigation items
 *   </nav>
 * );
 * ```
 */
export function useKeyboardNavigation({
  containerRef,
  itemSelector = '[role="menuitem"], [data-nav-item]',
  onEscape,
  enabled = true,
}: KeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const navigate = useNavigate();
  const currentIndex = useRef(-1);

  /**
   * Get all focusable navigation items
   */
  const getItems = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(itemSelector)
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }, [containerRef, itemSelector]);

  /**
   * Focus an item by index
   */
  const focusItemByIndex = useCallback(
    (index: number) => {
      const items = getItems();
      if (items.length === 0) return;

      // Clamp index to valid range
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      currentIndex.current = clampedIndex;

      items[clampedIndex]?.focus();
    },
    [getItems]
  );

  /**
   * Focus the first navigation item
   */
  const focusFirst = useCallback(() => {
    focusItemByIndex(0);
  }, [focusItemByIndex]);

  /**
   * Focus the last navigation item
   */
  const focusLast = useCallback(() => {
    const items = getItems();
    focusItemByIndex(items.length - 1);
  }, [getItems, focusItemByIndex]);

  /**
   * Focus the currently active navigation item
   */
  const focusActive = useCallback(() => {
    const items = getItems();
    const activeIndex = items.findIndex(
      (item) =>
        item.getAttribute('aria-current') === 'page' ||
        item.classList.contains('active') ||
        item.dataset.active === 'true'
    );

    if (activeIndex !== -1) {
      focusItemByIndex(activeIndex);
    } else {
      focusFirst();
    }
  }, [getItems, focusItemByIndex, focusFirst]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      const items = getItems();
      if (items.length === 0) return;

      // Find current focused item index
      const focusedElement = document.activeElement as HTMLElement;
      const focusedIndex = items.indexOf(focusedElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'j': // Vim-style navigation
          e.preventDefault();
          if (focusedIndex === -1) {
            focusFirst();
          } else {
            focusItemByIndex(
              focusedIndex < items.length - 1 ? focusedIndex + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
        case 'k': // Vim-style navigation
          e.preventDefault();
          if (focusedIndex === -1) {
            focusLast();
          } else {
            focusItemByIndex(
              focusedIndex > 0 ? focusedIndex - 1 : items.length - 1
            );
          }
          break;

        case 'Home':
          e.preventDefault();
          focusFirst();
          break;

        case 'End':
          e.preventDefault();
          focusLast();
          break;

        case 'Enter':
        case ' ':
          if (focusedElement && items.includes(focusedElement)) {
            e.preventDefault();
            // Check if it's a link and navigate
            const link = focusedElement.closest('a');
            if (link?.href) {
              const url = new URL(link.href);
              navigate(url.pathname + url.search);
            } else {
              // Trigger click for buttons
              focusedElement.click();
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;

        // Expand/collapse collapsible sections
        case 'ArrowRight':
          if (focusedElement?.hasAttribute('aria-expanded')) {
            const isExpanded =
              focusedElement.getAttribute('aria-expanded') === 'true';
            if (!isExpanded) {
              e.preventDefault();
              focusedElement.click();
            }
          }
          break;

        case 'ArrowLeft':
          if (focusedElement?.hasAttribute('aria-expanded')) {
            const isExpanded =
              focusedElement.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
              e.preventDefault();
              focusedElement.click();
            }
          }
          break;
      }
    },
    [
      enabled,
      getItems,
      focusFirst,
      focusLast,
      focusItemByIndex,
      navigate,
      onEscape,
    ]
  );

  // Global keyboard shortcut for focusing sidebar (Cmd/Ctrl + /)
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + / to focus sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        focusActive();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [enabled, focusActive]);

  return {
    handleKeyDown,
    focusFirst,
    focusLast,
    focusActive,
  };
}

export default useKeyboardNavigation;
