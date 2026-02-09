import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Send, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { studyFormSchema, StudyFormData, defaultFormValues, shouldShowResearchDetails } from '@/lib/formSchema';
import { FormSection } from './FormSection';
import { FormProgress } from './FormProgress';
import { SectionA } from './SectionA';
import { SectionB } from './SectionB';
import { SectionC } from './SectionC';
import { SectionD } from './SectionD';
import { SectionE } from './SectionE';
import { SectionF } from './SectionF';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';
import { submitStudy, updateSubmission } from '@/lib/api';

interface StudyFormProps {
  mode?: 'create' | 'edit';
  submissionId?: string;
  initialData?: Partial<StudyFormData>;
}

export function StudyForm({ mode = 'create', submissionId, initialData }: StudyFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';

  const [openSections, setOpenSections] = useState<string[]>(['a']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm<StudyFormData>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: isEdit && initialData ? initialData : defaultFormValues,
    mode: 'onChange',
  });

  const autoSaveKey = isEdit && submissionId
    ? `meliaf_study_edit_${submissionId}`
    : undefined;
  const { loadDraft, clearDraft, hasDraft } = useAutoSave(form, autoSaveKey);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft()) {
      setShowDraftDialog(true);
    }
  }, [hasDraft]);

  const handleLoadDraft = () => {
    const draft = loadDraft();
    if (draft) {
      form.reset(draft);
      toast({
        title: isEdit ? 'Unsaved edits loaded' : 'Draft loaded',
        description: 'Your previous work has been restored.',
      });
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftDialog(false);
  };

  // Watch for conditional section visibility
  const causalityMode = form.watch('causalityMode');
  const methodClass = form.watch('methodClass');
  const showSectionC = shouldShowResearchDetails(causalityMode, methodClass);

  // Toggle section open/closed - memoized to prevent child re-renders
  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  }, []);

  // Calculate section errors - memoized
  const getSectionErrors = useCallback((sectionFields: string[]) => {
    return sectionFields.some((field) => form.formState.errors[field as keyof StudyFormData]);
  }, [form.formState.errors]);

  // Calculate section completion - memoized
  const getSectionComplete = useCallback((sectionFields: string[], required: boolean = true) => {
    if (!required) return true;
    const values = form.getValues();
    return sectionFields.every((field) => {
      const value = values[field as keyof StudyFormData];
      if (Array.isArray(value)) return value.length > 0; // Arrays need at least one item
      return value !== undefined && value !== '';
    });
  }, [form]);

  // Watch form values for progress calculation
  const formValues = form.watch();

  // Calculate overall progress - memoized to prevent recalculation on every render
  const { completed, total } = useMemo(() => {
    // Define completion criteria for each section (ALL listed fields must be filled)
    const sectionChecks = [
      // Section A - Basic Information (all required including otherCenters)
      () => !!(formValues.studyId && formValues.studyTitle && formValues.leadCenter && formValues.contactName && formValues.contactEmail && formValues.otherCenters?.length),
      // Section B - Study Classification (all required including primaryIndicator)
      () => !!(formValues.studyType && formValues.timing && formValues.analyticalScope && formValues.geographicScope && formValues.resultLevel && formValues.causalityMode && formValues.methodClass && formValues.primaryIndicator),
      // Section C - Research Details (conditional - at least key fields filled)
      () => showSectionC ? !!(formValues.keyResearchQuestions || formValues.unitOfAnalysis || formValues.treatmentIntervention) : false,
      // Section D - Timeline & Status (all required)
      () => !!(formValues.startDate && formValues.expectedEndDate && formValues.dataCollectionStatus && formValues.analysisStatus),
      // Section E - Funding & Resources (all required - funded, totalCostUSD, proposalAvailable)
      () => !!(formValues.funded && formValues.totalCostUSD && formValues.proposalAvailable?.answer),
      // Section F - Outputs & Users (all required)
      () => !!(formValues.manuscriptDeveloped?.answer && formValues.policyBriefDeveloped?.answer && formValues.relatedToPastStudy?.answer && formValues.intendedPrimaryUser?.length && formValues.commissioningSource),
    ];

    // Filter out Section C if not visible
    const activeSections = showSectionC ? sectionChecks : sectionChecks.filter((_, i) => i !== 2);
    const completedCount = activeSections.filter(check => check()).length;

    return { completed: completedCount, total: activeSections.length };
  }, [formValues, showSectionC]);

  const isFormComplete = completed === total;

  // Form submission
  const onSubmit = async (data: StudyFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit && submissionId) {
        await updateSubmission(submissionId, data as unknown as Record<string, unknown>);
        clearDraft();
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
        queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      } else {
        await submitStudy(data as unknown as Record<string, unknown>);
        clearDraft();
      }
      setShowSuccessDialog(true);
    } catch (err) {
      const error = err as Error & { details?: { field: string; message: string }[] };
      const description = error.details
        ? error.details.map(d => `${d.field}: ${d.message}`).join(', ')
        : error.message || `There was an error ${isEdit ? 'updating' : 'submitting'} your study. Please try again.`;
      toast({
        title: isEdit ? 'Update failed' : 'Submission failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: 'Draft saved',
      description: 'Your progress has been saved locally.',
    });
  };

  const handleSuccessAction = () => {
    if (isEdit) {
      navigate('/');
    } else {
      form.reset(defaultFormValues);
      setOpenSections(['a']);
    }
    setShowSuccessDialog(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Progress Indicator */}
          <Card>
            <CardContent className="py-4">
              <FormProgress completedSections={completed} totalSections={total} />
            </CardContent>
          </Card>

          {/* Form validation errors summary */}
          {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                Please fix the errors in the form before submitting.
              </AlertDescription>
            </Alert>
          )}

          {/* Section A - Basic Information */}
          <FormSection
            title="Basic Information"
            description="Study identification and contact details"
            sectionLabel="A"
            isOpen={openSections.includes('a')}
            onToggle={() => toggleSection('a')}
            isRequired
            isComplete={getSectionComplete(['studyId', 'studyTitle', 'leadCenter', 'contactName', 'contactEmail', 'otherCenters'])}
            hasErrors={getSectionErrors(['studyId', 'studyTitle', 'leadCenter', 'contactName', 'contactEmail', 'otherCenters'])}
          >
            <SectionA form={form} />
          </FormSection>

          {/* Section B - Study Classification */}
          <FormSection
            title="Study Classification"
            description="Type, scope, and methodology"
            sectionLabel="B"
            isOpen={openSections.includes('b')}
            onToggle={() => toggleSection('b')}
            isRequired
            isComplete={getSectionComplete(['studyType', 'timing', 'analyticalScope', 'geographicScope', 'resultLevel', 'causalityMode', 'methodClass', 'primaryIndicator'])}
            hasErrors={getSectionErrors(['studyType', 'timing', 'analyticalScope', 'geographicScope', 'resultLevel', 'causalityMode', 'methodClass', 'primaryIndicator'])}
          >
            <SectionB form={form} />
          </FormSection>

          {/* Section C - Research Details (Conditional) */}
          {showSectionC && (
            <FormSection
              title="Research Details"
              description="Detailed research methodology and data collection"
              sectionLabel="C"
              isOpen={openSections.includes('c')}
              onToggle={() => toggleSection('c')}
              isConditional
            >
              <SectionC form={form} />
            </FormSection>
          )}

          {/* Section D - Timeline & Status */}
          <FormSection
            title="Timeline & Status"
            description="Project dates and current progress"
            sectionLabel="D"
            isOpen={openSections.includes('d')}
            onToggle={() => toggleSection('d')}
            isRequired
            isComplete={getSectionComplete(['startDate', 'expectedEndDate', 'dataCollectionStatus', 'analysisStatus'])}
            hasErrors={getSectionErrors(['startDate', 'expectedEndDate', 'dataCollectionStatus', 'analysisStatus'])}
          >
            <SectionD form={form} />
          </FormSection>

          {/* Section E - Funding & Resources */}
          <FormSection
            title="Funding & Resources"
            description="Financial support and documentation"
            sectionLabel="E"
            isOpen={openSections.includes('e')}
            onToggle={() => toggleSection('e')}
            isRequired
            isComplete={getSectionComplete(['funded', 'totalCostUSD'])}
            hasErrors={getSectionErrors(['funded', 'fundingSource', 'totalCostUSD', 'proposalAvailable'])}
          >
            <SectionE form={form} />
          </FormSection>

          {/* Section F - Outputs & Users */}
          <FormSection
            title="Outputs & Users"
            description="Deliverables and target audience"
            sectionLabel="F"
            isOpen={openSections.includes('f')}
            onToggle={() => toggleSection('f')}
            isRequired
            isComplete={getSectionComplete(['manuscriptDeveloped', 'policyBriefDeveloped', 'relatedToPastStudy', 'intendedPrimaryUser', 'commissioningSource'])}
            hasErrors={getSectionErrors(['manuscriptDeveloped', 'policyBriefDeveloped', 'relatedToPastStudy', 'intendedPrimaryUser', 'commissioningSource'])}
          >
            <SectionF form={form} />
          </FormSection>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormComplete}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Study' : 'Submit Study'}
                </>
              )}
            </Button>
            {!isFormComplete && (
              <p className="text-sm text-muted-foreground sm:text-right">
                Complete all required sections to submit
              </p>
            )}
          </div>
        </form>
      </Form>

      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isEdit ? 'Continue with unsaved edits?' : 'Continue with saved draft?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? 'We found unsaved edits for this submission. Would you like to continue where you left off?'
                : 'We found a previously saved draft. Would you like to continue where you left off?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              {isEdit ? 'Discard Edits' : 'Start Fresh'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadDraft}>
              {isEdit ? 'Continue Editing' : 'Continue Draft'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              {isEdit ? 'Study Updated Successfully!' : 'Study Submitted Successfully!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? 'Your study has been updated. The changes are now saved.'
                : 'Your study has been submitted and is now being processed. You can view it in My Submissions.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessAction}>
              {isEdit ? 'Back to Submissions' : 'Submit Another Study'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
