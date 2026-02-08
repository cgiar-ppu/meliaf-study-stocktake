import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  FolderOpen,
  TrendingUp,
  Archive,
  Plus,
  AlertCircle
} from 'lucide-react';
import { listSubmissions, type SubmissionItem } from '@/lib/api';
import { STUDY_TYPE_OPTIONS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function MySubmissions() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['submissions', 'active'],
    queryFn: () => listSubmissions('active'),
    enabled: isAuthenticated,
  });

  const submissions = data?.submissions ?? [];
  const activeCount = submissions.length;

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
          title="Active Studies"
          value={activeCount}
          description="Currently active"
          icon={TrendingUp}
          isLoading={isLoading}
          accent
        />
        <StatCard
          title="Total Submissions"
          value={activeCount}
          description="All time submissions"
          icon={FileText}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions & Submissions List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/submit">
                <Plus className="mr-2 h-4 w-4" />
                Submit a New Study
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <Card className="lg:col-span-2">
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
                  <SubmissionRow key={sub.submissionId} submission={sub} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SubmissionRow({ submission }: { submission: SubmissionItem }) {
  const studyTypeLabel = STUDY_TYPE_OPTIONS.find(o => o.value === submission.studyType)?.label || submission.studyType;
  const dateStr = new Date(submission.createdAt).toLocaleDateString();

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{submission.studyTitle}</p>
        <p className="text-sm text-muted-foreground">
          {studyTypeLabel} &middot; {submission.leadCenter} &middot; {dateStr}
        </p>
      </div>
      <Badge variant="secondary" className="ml-2 shrink-0">
        v{submission.version}
      </Badge>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  isLoading?: boolean;
  accent?: boolean;
}

function StatCard({ title, value, description, icon: Icon, isLoading, accent }: StatCardProps) {
  return (
    <Card className={accent ? 'border-l-4 border-l-primary' : undefined}>
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
