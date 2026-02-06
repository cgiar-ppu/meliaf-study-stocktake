import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { StudyFormData } from '@/lib/formSchema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from './TagInput';
import { YesNoLinkField } from './YesNoLinkField';
import { YES_NO_NA_OPTIONS } from '@/types';

interface SectionCProps {
  form: UseFormReturn<StudyFormData>;
}

export const SectionC = memo(function SectionC({ form }: SectionCProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Key Research Questions */}
      <FormField
        control={form.control}
        name="keyResearchQuestions"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Key Research Question(s)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter the main research questions this study aims to answer..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Unit of Analysis */}
      <FormField
        control={form.control}
        name="unitOfAnalysis"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unit of Analysis</FormLabel>
            <FormControl>
              <Input placeholder="Enter unit of analysis" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Treatment/Intervention */}
      <FormField
        control={form.control}
        name="treatmentIntervention"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Treatment/Intervention</FormLabel>
            <FormControl>
              <Input placeholder="Describe the intervention" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Sample Size */}
      <FormField
        control={form.control}
        name="sampleSize"
        render={({ field }) => {
          const formatNumber = (value: number | string | undefined) => {
            if (!value && value !== 0) return '';
            return Number(value).toLocaleString('en-US');
          };

          const parseNumber = (value: string) => {
            const cleaned = value.replace(/,/g, '');
            const parsed = parseInt(cleaned, 10);
            return isNaN(parsed) ? '' : parsed;
          };

          return (
            <FormItem>
              <FormLabel>Sample Size</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter sample size"
                  value={formatNumber(field.value)}
                  onChange={(e) => field.onChange(parseNumber(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* Power Calculation */}
      <FormField
        control={form.control}
        name="powerCalculation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Power Calculation Conducted?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {YES_NO_NA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Data Collection Methods */}
      <FormField
        control={form.control}
        name="dataCollectionMethods"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Data Collection Method(s)</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Type method and press Enter..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Study-specific Indicators */}
      <FormField
        control={form.control}
        name="studyIndicators"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Study-specific Indicators</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List the key indicators this study will measure..."
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pre-Analysis Plan */}
      <FormField
        control={form.control}
        name="preAnalysisPlan"
        render={({ field, fieldState }) => {
          // Extract link error from field state if it exists
          const linkError = fieldState.error?.message;
          
          return (
            <FormItem className="sm:col-span-2">
              <FormLabel>Pre-Analysis Plan Available?</FormLabel>
              <FormControl>
                <YesNoLinkField
                  value={field.value}
                  onChange={field.onChange}
                  linkPlaceholder="Link to pre-analysis plan"
                  linkError={linkError}
                />
              </FormControl>
            </FormItem>
          );
        }}
      />

      {/* Number of Data Collection Rounds */}
      <FormField
        control={form.control}
        name="dataCollectionRounds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Data Collection Rounds</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g., 1, 2, 3"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
