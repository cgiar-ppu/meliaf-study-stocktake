import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isComplete?: boolean;
  hasErrors?: boolean;
  isConditional?: boolean;
  isRequired?: boolean;
  sectionLabel?: string;
}

export function FormSection({
  title,
  description,
  children,
  isOpen,
  onToggle,
  isComplete = false,
  hasErrors = false,
  isConditional = false,
  isRequired = false,
  sectionLabel,
}: FormSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className={cn(
        'rounded-lg border bg-card transition-colors',
        isOpen && 'border-primary/30',
        hasErrors && 'border-destructive/50',
        isComplete && !hasErrors && 'border-success/30'
      )}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
          <div className="flex items-center gap-3">
            {sectionLabel && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {sectionLabel}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {title}
                  {isRequired && <span className="ml-0.5 text-destructive">*</span>}
                </h3>
                {isConditional && (
                  <Badge variant="outline" className="text-xs">
                    Conditional
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && !hasErrors && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                ✓ Complete
              </span>
            )}
            {hasErrors && (
              <span className="text-xs font-medium text-destructive">Has errors</span>
            )}
            <ChevronDown className={cn(
              'h-5 w-5 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border p-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
