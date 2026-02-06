import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  FolderOpen, 
  TrendingUp, 
  Archive,
  Plus
} from 'lucide-react';

// Placeholder data - will be replaced with API calls
const mockStats = {
  totalSubmissions: 24,
  activeStudies: 18,
  drafts: 3,
  archivedStudies: 3,
};

export default function MySubmissions() {
  const isLoading = false; // Will be connected to data fetching

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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Submissions"
          value={mockStats.totalSubmissions}
          description="All time submissions"
          icon={FileText}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Studies"
          value={mockStats.activeStudies}
          description="Currently in progress"
          icon={TrendingUp}
          isLoading={isLoading}
          accent
        />
        <StatCard
          title="Drafts"
          value={mockStats.drafts}
          description="Pending submission"
          icon={FolderOpen}
          isLoading={isLoading}
        />
        <StatCard
          title="Archived"
          value={mockStats.archivedStudies}
          description="Completed studies"
          icon={Archive}
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
            <Button asChild variant="outline" className="justify-start">
              <Link to="/submissions?status=draft">
                <FileText className="mr-2 h-4 w-4" />
                Continue Draft
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Submissions List Placeholder */}
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
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FolderOpen className="mb-2 h-10 w-10 opacity-50" />
                <p>No submissions yet</p>
                <p className="text-sm">Submit a study to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
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
