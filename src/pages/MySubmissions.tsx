import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  FolderOpen,
  TrendingUp,
  Plus,
  AlertCircle,
  Eye,
  Archive,
} from 'lucide-react';

import { listSubmissions, type SubmissionItem } from '@/lib/api';
import { STUDY_TYPE_OPTIONS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { SubmissionPreviewSheet } from '@/components/submission/SubmissionPreviewSheet';

export default function MySubmissions() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [archivedPreviewId, setArchivedPreviewId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['submissions', 'active'],
    queryFn: () => listSubmissions('active'),
    enabled: isAuthenticated,
  });

  const archived = useQuery({
    queryKey: ['submissions', 'archived'],
    queryFn: () => listSubmissions('archived'),
    enabled: isAuthenticated,
  });

  const submissions = data?.submissions ?? [];
  const archivedSubmissions = archived.data?.submissions ?? [];
  const activeCount = submissions.length;
  const archivedCount = archivedSubmissions.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground">
            Overview of your study submissions and research activities
          </p>
        </div>
        <Button asChild>
          <Link to="/submit">
            <Plus className="mr-2 h-4 w-4" />
            New Study
          </Link>
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load submissions. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Submissions"
          value={activeCount + archivedCount}
          description="All time submissions"
          icon={FileText}
          isLoading={isLoading || archived.isLoading}
          borderColor="border-l-foreground"
        />
        <StatCard
          title="Active Studies"
          value={activeCount}
          description="Currently active"
          icon={TrendingUp}
          isLoading={isLoading}
          borderColor="border-l-primary"
        />
        <StatCard
          title="Archived"
          value={archivedCount}
          description="Archived submissions"
          icon={Archive}
          isLoading={archived.isLoading}
          borderColor="border-l-destructive"
        />
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Your latest studies and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <FolderOpen className="mb-2 h-10 w-10 opacity-50" />
              <p>No submissions yet</p>
              <p className="text-sm">Submit a study to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: SubmissionItem) => (
                <SubmissionRow
                  key={sub.submissionId}
                  submission={sub}
                  onPreview={() => setPreviewId(sub.submissionId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived Submissions */}
      {archivedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archived Submissions
            </CardTitle>
            <CardDescription>Previously archived studies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {archivedSubmissions.map((sub: SubmissionItem) => (
                <SubmissionRow
                  key={sub.submissionId}
                  submission={sub}
                  onPreview={() => setArchivedPreviewId(sub.submissionId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <SubmissionPreviewSheet
        submissionId={previewId}
        onClose={() => setPreviewId(null)}
        onEdit={(id) => {
          setPreviewId(null);
          navigate(`/submit/${id}`);
        }}
        mode="active"
      />

      <SubmissionPreviewSheet
        submissionId={archivedPreviewId}
        onClose={() => setArchivedPreviewId(null)}
        mode="archived"
      />
    </div>
  );
}

function SubmissionRow({
  submission,
  onPreview,
}: {
  submission: SubmissionItem;
  onPreview: () => void;
}) {
  const studyTypeLabel = STUDY_TYPE_OPTIONS.find(o => o.value === submission.studyType)?.label || submission.studyType;
  const dateStr = new Date(submission.createdAt).toLocaleDateString();

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{submission.studyTitle} &middot; {submission.studyId as string}</p>
        <p className="text-sm text-muted-foreground">
          {studyTypeLabel} &middot; {submission.leadCenter} &middot; {dateStr}
        </p>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onPreview} title="Preview">
          <Eye className="h-4 w-4" />
        </Button>
        <Badge variant="secondary">v{submission.version}</Badge>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  isLoading?: boolean;
  borderColor?: string;
}

function StatCard({ title, value, description, icon: Icon, isLoading, borderColor }: StatCardProps) {
  return (
    <Card className={borderColor ? `border-l-[6px] ${borderColor}` : undefined}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
