import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: ArchiveConfirmDialogProps) {
  const [input, setInput] = useState('');

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setInput('');
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this submission?</AlertDialogTitle>
          <AlertDialogDescription>
            This submission will be moved to your archived submissions. You can restore it later.
            Type <span className="font-semibold">archive</span> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          placeholder='Type "archive" to confirm'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={input !== 'archive' || isLoading}
            onClick={onConfirm}
          >
            {isLoading ? 'Archiving...' : 'Archive'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
