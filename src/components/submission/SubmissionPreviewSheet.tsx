import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AlertCircle, Archive, Pencil, RotateCcw } from 'lucide-react';
import { getSubmissionHistory, deleteSubmission, restoreSubmission } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SubmissionPreview } from './SubmissionPreview';
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';

interface SubmissionPreviewSheetProps {
  submissionId: string | null;
  onClose: () => void;
  onEdit?: (submissionId: string) => void;
  mode?: 'active' | 'archived';
}

export function SubmissionPreviewSheet({
  submissionId,
  onClose,
  onEdit,
  mode = 'active',
}: SubmissionPreviewSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const targetStatus = mode === 'active' ? 'active' : 'archived';

  const { data, isLoading, error } = useQuery({
    queryKey: ['submission', submissionId, targetStatus],
    queryFn: async () => {
      const res = await getSubmissionHistory(submissionId!);
      const match = res.versions.find(v => v.status === targetStatus);
      if (!match) throw new Error('Submission not found');
      return match;
    },
    enabled: !!submissionId,
  });

  const archiveMutation = useMutation({
    mutationFn: () => deleteSubmission(submissionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({ title: 'Submission archived', description: 'The submission has been moved to your archive.' });
      setArchiveDialogOpen(false);
      onClose();
    },
    onError: () => {
      toast({ title: 'Archive failed', description: 'Could not archive the submission. Please try again.', variant: 'destructive' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreSubmission(submissionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({ title: 'Submission restored', description: 'The submission has been restored to your active submissions.' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Restore failed', description: 'Could not restore the submission. Please try again.', variant: 'destructive' });
    },
  });

  return (
    <>
      <Sheet open={!!submissionId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{data ? `${data.studyTitle} · ${data.studyId as string}` : 'Submission Preview'}</SheetTitle>
            <SheetDescription>
              {data ? `v${data.version} — ${new Date(data.createdAt).toLocaleDateString()}` : 'Loading...'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load submission. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {data && <SubmissionPreview submission={data} />}
          </div>

          {data && (
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {mode === 'active' ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setArchiveDialogOpen(true)}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  {onEdit && (
                    <Button onClick={() => onEdit(submissionId!)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => restoreMutation.mutate()}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {restoreMutation.isPending ? 'Restoring...' : 'Unarchive'}
                </Button>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <ArchiveConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        onConfirm={() => archiveMutation.mutate()}
        isLoading={archiveMutation.isPending}
      />
    </>
  );
}
