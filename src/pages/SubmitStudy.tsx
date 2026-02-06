import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function SubmitStudy() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submit a Study</h1>
        <p className="text-muted-foreground">
          Fill out the form below to register a new research study
        </p>
      </div>

      {/* Form Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Study Submission Form</CardTitle>
          <CardDescription>
            Complete all required sections to submit your study
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <FileText className="mb-4 h-16 w-16 opacity-50" />
            <p className="text-lg font-medium">Form Coming Soon</p>
            <p className="text-sm">
              The multi-section study submission form will be implemented in Phase 3
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
