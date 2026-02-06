import { StudyForm } from '@/components/form/StudyForm';

export default function SubmitStudy() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submit a Study</h1>
        <p className="text-muted-foreground">
          Complete all required sections to register a new research study
        </p>
      </div>

      {/* Study Form */}
      <StudyForm />
    </div>
  );
}
