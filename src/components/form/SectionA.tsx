import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { StudyFormData } from '@/lib/formSchema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from './MultiSelect';
import { SearchableSelect } from './SearchableSelect';
import { LEAD_CENTER_GROUPS, OTHER_CENTERS_GROUPS } from '@/types';
import { W3_BILATERAL_GROUPS } from '@/data/w3BilateralProjects';

interface SectionAProps {
  form: UseFormReturn<StudyFormData>;
}

export const SectionA = memo(function SectionA({ form }: SectionAProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Study ID */}
      <FormField
        control={form.control}
        name="studyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Study ID *</FormLabel>
            <FormControl>
              <Input placeholder="Enter the ID of the study" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Study Title */}
      <FormField
        control={form.control}
        name="studyTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Study Title *</FormLabel>
            <FormControl>
              <Input placeholder="Enter the full title of the study" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Lead Center / Entity */}
      <FormField
        control={form.control}
        name="leadCenter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lead Center / Entity *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead center" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {LEAD_CENTER_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* W3 / Bilateral Project */}
      <FormField
        control={form.control}
        name="w3Bilateral"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Window 3 / Bilateral</FormLabel>
            <FormControl>
              <SearchableSelect
                groups={W3_BILATERAL_GROUPS}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Select a project..."
                searchPlaceholder="Search projects..."
                emptyMessage="No projects found."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Contact Name */}
      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Name *</FormLabel>
            <FormControl>
              <Input placeholder="Primary contact person" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Contact Email */}
      <FormField
        control={form.control}
        name="contactEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Email *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="email@cgiar.org" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Other Centers */}
      <FormField
        control={form.control}
        name="otherCenters"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Other Centers/Programs/Accelerators Involved *</FormLabel>
            <FormControl>
              <MultiSelect
                groups={OTHER_CENTERS_GROUPS}
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Select centers, programs, or accelerators..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
