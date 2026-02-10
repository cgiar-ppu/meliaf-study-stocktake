import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getSubmission } from '@/lib/api';
import { transformSubmissionToFormData } from '@/lib/transformSubmission';
import { StudyForm } from '@/components/form/StudyForm';

export default function EditSubmission() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmission(submissionId!),
    enabled: !!submissionId,
  });

  const formData = useMemo(
    () => (data ? transformSubmissionToFormData(data) : undefined),
    [data],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load submission. It may have been deleted or you may not have access.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to="/submissions">Back to Submissions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => navigate('/submissions')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Edit Study</h1>
        <p className="text-muted-foreground">
          {data.studyTitle} — v{data.version}
        </p>
      </div>

      <StudyForm mode="edit" submissionId={submissionId} initialData={formData} />
    </div>
  );
}
