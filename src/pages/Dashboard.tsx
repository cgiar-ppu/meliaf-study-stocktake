import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Aggregate visualizations and analytics across all submissions
        </p>
      </div>

      {/* Coming Soon Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            Visualize trends and insights across all MELIAF studies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This dashboard will include visualizations such as studies by type, 
              geographic distribution, funding overview, and status comparisons 
              across all submitted studies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
