import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FormProgressProps {
  completedSections: number;
  totalSections: number;
  className?: string;
}

export function FormProgress({ completedSections, totalSections, className }: FormProgressProps) {
  const percentage = Math.round((completedSections / totalSections) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Form Completion
        </span>
        <span className="font-medium">
          {completedSections} of {totalSections} sections
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
