import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

export function StudyForm() {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>(['a']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm<StudyFormData>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const { loadDraft, clearDraft, hasDraft } = useAutoSave(form);

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
        title: 'Draft loaded',
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

  // Toggle section open/closed
  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Calculate section completion
  const getSectionErrors = (sectionFields: string[]) => {
    return sectionFields.some((field) => form.formState.errors[field as keyof StudyFormData]);
  };

  const getSectionComplete = (sectionFields: string[], required: boolean = true) => {
    if (!required) return true;
    const values = form.getValues();
    return sectionFields.every((field) => {
      const value = values[field as keyof StudyFormData];
      if (Array.isArray(value)) return true; // Arrays are optional
      return value !== undefined && value !== '';
    });
  };

  // Calculate overall progress - tracks completed sections (all required fields filled)
  const calculateProgress = () => {
    const values = form.getValues();
    
    // Define completion criteria for each section (ALL listed fields must be filled)
    const sectionChecks = [
      // Section A - Basic Information (all required including otherCenters)
      () => !!(values.studyId && values.studyTitle && values.leadCenter && values.contactName && values.contactEmail && values.otherCenters?.length),
      // Section B - Study Classification (all required)
      () => !!(values.studyType && values.timing && values.analyticalScope && values.geographicScope && values.resultLevel && values.causalityMode && values.methodClass),
      // Section C - Research Details (conditional - at least key fields filled)
      () => showSectionC ? !!(values.keyResearchQuestions || values.unitOfAnalysis || values.treatmentIntervention) : false,
      // Section D - Timeline & Status (all required)
      () => !!(values.startDate && values.expectedEndDate && values.dataCollectionStatus && values.analysisStatus),
      // Section E - Funding & Resources (optional - any field counts)
      () => !!(values.funded || values.fundingSource || values.totalCostUSD),
      // Section F - Outputs & Users (optional - any field counts)
      () => !!(values.manuscriptDeveloped || values.policyBriefDeveloped || values.intendedPrimaryUser?.length),
    ];
    
    // Filter out Section C if not visible
    const activeSections = showSectionC ? sectionChecks : sectionChecks.filter((_, i) => i !== 2);
    const completed = activeSections.filter(check => check()).length;
    
    return { completed, total: activeSections.length };
  };

  const { completed, total } = calculateProgress();

  // Form submission
  const onSubmit = async (data: StudyFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call to AWS API Gateway
      console.log('Submitting study:', data);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      clearDraft();
      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your study. Please try again.',
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

  const handleNewSubmission = () => {
    form.reset(defaultFormValues);
    setOpenSections(['a']);
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
            isComplete={getSectionComplete(['studyId', 'studyTitle', 'leadCenter', 'contactName', 'contactEmail'])}
            hasErrors={getSectionErrors(['studyId', 'studyTitle', 'leadCenter', 'contactName', 'contactEmail'])}
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
            isComplete={getSectionComplete(['studyType', 'timing', 'analyticalScope', 'geographicScope', 'resultLevel', 'causalityMode', 'methodClass'])}
            hasErrors={getSectionErrors(['studyType', 'timing', 'analyticalScope', 'geographicScope', 'resultLevel', 'causalityMode', 'methodClass'])}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Study
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Continue with saved draft?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found a previously saved draft. Would you like to continue where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadDraft}>
              Continue Draft
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
              Study Submitted Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your study has been submitted and is now being processed. You can view it in My Submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleNewSubmission}>
              Submit Another Study
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
