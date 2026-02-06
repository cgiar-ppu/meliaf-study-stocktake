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
import { YesNoLinkField } from './YesNoLinkField';
import { FUNDED_OPTIONS } from '@/types';

interface SectionEProps {
  form: UseFormReturn<StudyFormData>;
}

export const SectionE = memo(function SectionE({ form }: SectionEProps) {
  const funded = form.watch('funded');
  const showFundingSource = funded === 'yes' || funded === 'partial';

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Funded */}
      <FormField
        control={form.control}
        name="funded"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Funded? *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select funding status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FUNDED_OPTIONS.map((option) => (
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

      {/* Funding Source - conditional, same row as Funded */}
      {showFundingSource ? (
        <FormField
          control={form.control}
          name="fundingSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Source *</FormLabel>
              <FormControl>
                <Input placeholder="Enter funding source" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="hidden sm:block" />
      )}

      {/* Total Cost USD - always visible, always starts new row */}
      <FormField
        control={form.control}
        name="totalCostUSD"
        render={({ field }) => {
          const formatNumber = (value: number | string | undefined) => {
            if (!value && value !== 0) return '';
            return Number(value).toLocaleString('en-US');
          };

          const parseNumber = (value: string) => {
            const cleaned = value.replace(/,/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? '' : parsed;
          };

          return (
            <FormItem>
              <FormLabel>Total Cost (USD) *</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  value={formatNumber(field.value)}
                  onChange={(e) => field.onChange(parseNumber(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* Proposal Available */}
      <FormField
        control={form.control}
        name="proposalAvailable"
        render={({ field, fieldState }) => {
          const linkError = fieldState.error?.message;
          
          return (
            <FormItem className="sm:col-span-2">
              <FormLabel>Proposal/Concept Note Available? *</FormLabel>
              <FormControl>
                <YesNoLinkField
                  value={field.value}
                  onChange={field.onChange}
                  linkPlaceholder="Link to proposal or concept note"
                  linkError={linkError}
                />
              </FormControl>
            </FormItem>
          );
        }}
      />
    </div>
  );
});
