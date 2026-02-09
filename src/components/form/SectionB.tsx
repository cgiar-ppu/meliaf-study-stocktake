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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
} from '@/types';

interface SectionBProps {
  form: UseFormReturn<StudyFormData>;
}

export const SectionB = memo(function SectionB({ form }: SectionBProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Study Type */}
      <FormField
        control={form.control}
        name="studyType"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Study Type *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger className="text-left [&>span>div]:flex-row [&>span>div]:gap-0 [&>span_.select-description]:hidden">
                  <SelectValue placeholder="Select study type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)]">
                {STUDY_TYPE_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value} 
                    textValue={option.label}
                    className="py-3 whitespace-normal"
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="font-medium">{option.label}</span>
                      <span className="select-description text-xs text-muted-foreground leading-relaxed whitespace-normal">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="timing"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timing *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger className="text-left [&>span>div]:flex-row [&>span>div]:gap-0 [&>span_.select-description]:hidden">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {TIMING_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    textValue={option.label}
                    className="py-3 whitespace-normal"
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="font-medium">{option.label}</span>
                      <span className="select-description text-xs text-muted-foreground leading-relaxed whitespace-normal">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Analytical Scope */}
      <FormField
        control={form.control}
        name="analyticalScope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Analytical Scope *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ANALYTICAL_SCOPE_OPTIONS.map((option) => (
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

      {/* Geographic Scope */}
      <FormField
        control={form.control}
        name="geographicScope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Geographic Scope *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger className="text-left [&>span>div]:flex-row [&>span>div]:gap-0 [&>span_.select-description]:hidden">
                  <SelectValue placeholder="Select geographic scope" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {GEOGRAPHIC_SCOPE_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    textValue={option.label}
                    className={option.description ? "py-3 whitespace-normal" : ""}
                  >
                    {option.description ? (
                      <div className="flex flex-col gap-1 pr-2">
                        <span className="font-medium">{option.label}</span>
                        <span className="select-description text-xs text-muted-foreground leading-relaxed whitespace-normal">
                          {option.description}
                        </span>
                      </div>
                    ) : (
                      option.label
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Result Level */}
      <FormField
        control={form.control}
        name="resultLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Result Level *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger className="text-left [&>span>div]:flex-row [&>span>div]:gap-0 [&>span_.select-description]:hidden">
                  <SelectValue placeholder="Select result level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {RESULT_LEVEL_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    textValue={option.label}
                    className="py-3 whitespace-normal"
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="font-medium">{option.label}</span>
                      <span className="select-description text-xs text-muted-foreground leading-relaxed whitespace-normal">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Causality Mode */}
      <FormField
        control={form.control}
        name="causalityMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Causality Mode *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger className="text-left [&>span>div]:flex-row [&>span>div]:gap-0 [&>span_.select-description]:hidden">
                  <SelectValue placeholder="Select causality mode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {CAUSALITY_MODE_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    textValue={option.label}
                    className="py-3 whitespace-normal"
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="font-medium">{option.label}</span>
                      <span className="select-description text-xs text-muted-foreground leading-relaxed whitespace-normal">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Method Class */}
      <FormField
        control={form.control}
        name="methodClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Method Class *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select method class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {METHOD_CLASS_OPTIONS.map((option) => (
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

      {/* Primary Results Framework Indicator */}
      <FormField
        control={form.control}
        name="primaryIndicator"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Primary Results Framework Indicator *</FormLabel>
            <FormControl>
              <Input placeholder="Enter primary indicator" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
