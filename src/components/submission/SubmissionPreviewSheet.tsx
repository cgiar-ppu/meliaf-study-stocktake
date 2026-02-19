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
import { getSubmissionHistory, deleteSubmission, restoreSubmission, lookupUsers } from '@/lib/api';
import type { UserInfo, SubmissionItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SubmissionPreview } from './SubmissionPreview';
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';

function displayName(users: Record<string, UserInfo> | undefined, userId: string): string | null {
  if (!users) return null;
  const u = users[userId];
  if (!u) return null;
  return u.name || u.email;
}

function formatDescription(
  data: SubmissionItem,
  users?: Record<string, UserInfo>,
): string {
  const date = new Date(data.createdAt).toLocaleDateString();
  const version = data.version;
  const authorName = displayName(users, data.userId);
  const modifierName = data.modifiedBy ? displayName(users, data.modifiedBy) : null;

  if (version === 1) {
    const byAuthor = authorName ? ` by ${authorName}` : '';
    return `Submitted on ${date}${byAuthor} · v1`;
  }

  // v2+
  const byModifier = modifierName ? ` by ${modifierName}` : '';
  const sameEditor = data.userId === data.modifiedBy;

  if (sameEditor || !data.modifiedBy) {
    const byAuthor = authorName ? ` by ${authorName}` : '';
    return `Last updated on ${date}${byAuthor} · v${version}`;
  }

  const origAuthor = authorName ? `Originally submitted by ${authorName} · ` : '';
  return `Last updated on ${date}${byModifier}\n${origAuthor}v${version}`;
}

interface SubmissionPreviewSheetProps {
  submissionId: string | null;
  onClose: () => void;
  onEdit?: (submissionId: string) => void;
  mode?: 'active' | 'archived' | 'readonly';
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

  const targetStatus = mode === 'archived' ? 'archived' : 'active';

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

  const userIds = data
    ? [...new Set([data.userId, data.modifiedBy].filter(Boolean) as string[])]
    : [];

  const { data: usersData } = useQuery({
    queryKey: ['users', ...userIds],
    queryFn: () => lookupUsers(userIds),
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
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
              {data ? formatDescription(data, usersData?.users) : 'Loading...'}
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
              {mode === 'active' && (
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
              )}
              {mode === 'archived' && (
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
