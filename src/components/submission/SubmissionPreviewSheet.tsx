import { useQuery } from '@tanstack/react-query';
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
import { AlertCircle, Pencil } from 'lucide-react';
import { getSubmission } from '@/lib/api';
import { SubmissionPreview } from './SubmissionPreview';

interface SubmissionPreviewSheetProps {
  submissionId: string | null;
  onClose: () => void;
  onEdit: (submissionId: string) => void;
}

export function SubmissionPreviewSheet({
  submissionId,
  onClose,
  onEdit,
}: SubmissionPreviewSheetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmission(submissionId!),
    enabled: !!submissionId,
  });

  return (
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
            <Button onClick={() => onEdit(submissionId!)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
