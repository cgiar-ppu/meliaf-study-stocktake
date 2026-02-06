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
import { TagInput } from './TagInput';

interface SectionAProps {
  form: UseFormReturn<StudyFormData>;
}

export function SectionA({ form }: SectionAProps) {
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

      {/* Lead Center / Entity - own row at 50% */}
      <FormField
        control={form.control}
        name="leadCenter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lead Center / Entity *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., IFPRI, CIMMYT" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Empty spacer to keep Lead Center at 50% on its own row */}
      <div className="hidden sm:block" />

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
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Type and press Enter to add..."
              />
            </FormControl>
            <FormDescription>
              Add other CGIAR centers or programs involved in this study. Type and press Enter to add.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
