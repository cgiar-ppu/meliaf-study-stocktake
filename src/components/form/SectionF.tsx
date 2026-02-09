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
import { Checkbox } from '@/components/ui/checkbox';
import { YesNoLinkField } from './YesNoLinkField';
import { PRIMARY_USER_OPTIONS } from '@/types';

interface SectionFProps {
  form: UseFormReturn<StudyFormData>;
}

export const SectionF = memo(function SectionF({ form }: SectionFProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Manuscript Developed */}
      <FormField
        control={form.control}
        name="manuscriptDeveloped"
        render={({ field, fieldState }) => {
          const linkError = fieldState.error?.message;
          
          return (
            <FormItem className="sm:col-span-2">
              <FormLabel>Manuscript/Report Developed? *</FormLabel>
              <FormControl>
                <YesNoLinkField
                  value={field.value}
                  onChange={field.onChange}
                  linkPlaceholder="Link to manuscript or report"
                  linkError={linkError}
                />
              </FormControl>
            </FormItem>
          );
        }}
      />

      {/* Policy Brief Developed */}
      <FormField
        control={form.control}
        name="policyBriefDeveloped"
        render={({ field, fieldState }) => {
          const linkError = fieldState.error?.message;
          
          return (
            <FormItem className="sm:col-span-2">
              <FormLabel>Policy Brief/Comms Product Developed? *</FormLabel>
              <FormControl>
                <YesNoLinkField
                  value={field.value}
                  onChange={field.onChange}
                  linkPlaceholder="Link to policy brief or communications product"
                  linkError={linkError}
                />
              </FormControl>
            </FormItem>
          );
        }}
      />

      {/* Related to Past Study */}
      <FormField
        control={form.control}
        name="relatedToPastStudy"
        render={({ field, fieldState }) => {
          const linkError = fieldState.error?.message;
          
          return (
            <FormItem className="sm:col-span-2">
              <FormLabel>Related to Past MELIAF Study? *</FormLabel>
              <FormControl>
                <YesNoLinkField
                  value={field.value}
                  onChange={field.onChange}
                  linkPlaceholder="Link to related study or study ID"
                  linkError={linkError}
                />
              </FormControl>
            </FormItem>
          );
        }}
      />

      {/* Intended Primary User */}
      <FormField
        control={form.control}
        name="intendedPrimaryUser"
        render={() => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Intended Primary User(s) *</FormLabel>
            <FormDescription>
              Select all that apply
            </FormDescription>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRIMARY_USER_OPTIONS.map((option) => (
                <FormField
                  key={option.value}
                  control={form.control}
                  name="intendedPrimaryUser"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, option.value]);
                            } else {
                              field.onChange(current.filter((v) => v !== option.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Commissioning Source */}
      <FormField
        control={form.control}
        name="commissioningSource"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Commissioning Source *</FormLabel>
            <FormControl>
              <Input placeholder="Who commissioned this study? (Funder, Board, System Council, etc)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
