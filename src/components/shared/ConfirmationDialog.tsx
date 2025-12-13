/**
 * ==================================================================
 * CONFIRMATION DIALOG COMPONENT
 * ==================================================================
 * Reusable confirmation dialog for destructive actions
 * Prevents accidental data loss per UX critique issue #5
 * ==================================================================
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Archive, XCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'info';
  icon?: 'trash' | 'archive' | 'warning' | 'cancel';
}

const iconMap = {
  trash: Trash2,
  archive: Archive,
  warning: AlertTriangle,
  cancel: XCircle,
};

/**
 * Confirmation Dialog Component
 *
 * Usage:
 * ```tsx
 * const [isConfirmOpen, setIsConfirmOpen] = useState(false);
 *
 * <Button onClick={() => setIsConfirmOpen(true)}>Delete</Button>
 *
 * <ConfirmationDialog
 *   open={isConfirmOpen}
 *   onOpenChange={setIsConfirmOpen}
 *   onConfirm={handleDelete}
 *   title="Delete Procedure?"
 *   description="This will permanently delete the procedure. This action cannot be undone."
 *   variant="destructive"
 *   icon="trash"
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Continue',
  cancelText = 'Cancel',
  variant = 'destructive',
  icon = 'warning',
}: ConfirmationDialogProps) {
  const IconComponent = iconMap[icon];

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`
              p-2 rounded-full
              ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : ''}
              ${variant === 'warning' ? 'bg-yellow-100 text-yellow-600' : ''}
              ${variant === 'info' ? 'bg-blue-100 text-blue-600' : ''}
            `}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for using confirmation dialogs
 */
export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>>({
    onConfirm: () => {},
  });

  const confirm = (confirmConfig: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...confirmConfig,
        onConfirm: async () => {
          await confirmConfig.onConfirm();
          resolve(true);
        },
      });
      setIsOpen(true);
    });
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      {...config}
    />
  );

  return { confirm, ConfirmationDialog: ConfirmationDialogComponent };
}

import React from 'react';
