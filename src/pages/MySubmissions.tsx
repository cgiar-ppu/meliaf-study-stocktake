import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

export default function MySubmissions() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
        <p className="text-muted-foreground">
          View and manage your study submissions
        </p>
      </div>

      {/* Table Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions List</CardTitle>
          <CardDescription>
            All your studies including drafts and archived entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <FolderOpen className="mb-4 h-16 w-16 opacity-50" />
            <p className="text-lg font-medium">No Submissions Yet</p>
            <p className="text-sm">
              Your submitted studies will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
