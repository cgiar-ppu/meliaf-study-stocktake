import { memo, useEffect, useRef, type Ref } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { StudyFormData } from '@/lib/formSchema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload, type FileUploadHandle } from './FileUpload';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from './MultiSelect';
import { FilteredMultiSelect } from './FilteredMultiSelect';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  PRIMARY_INDICATOR_GROUPS,
} from '@/types';
import {
  CGIAR_REGION_OPTIONS,
  CGIAR_COUNTRY_OPTIONS,
  regionsForCountries,
} from '@/data/cgiarGeography';
import {
  SUBNATIONAL_OPTIONS,
  countriesForSubnational,
} from '@/data/subnationalUnits';

const REGION_GROUPS = [{ label: 'CGIAR Regions', options: CGIAR_REGION_OPTIONS }];
const COUNTRY_GROUPS = [{ label: 'Countries', options: CGIAR_COUNTRY_OPTIONS }];

const regionLabelMap: Record<string, string> = {};
for (const r of CGIAR_REGION_OPTIONS) regionLabelMap[r.value] = r.label;

const countryLabelMap: Record<string, string> = {};
for (const c of CGIAR_COUNTRY_OPTIONS) countryLabelMap[c.value] = c.label;

interface SectionBProps {
  form: UseFormReturn<StudyFormData>;
  submissionId?: string;
  fileUploadRef?: Ref<FileUploadHandle>;
  onFileChange?: () => void;
}

export const SectionB = memo(function SectionB({ form, submissionId, fileUploadRef, onFileChange }: SectionBProps) {
  const geographicScope = useWatch({ control: form.control, name: 'geographicScope' });
  const studyCountries = useWatch({ control: form.control, name: 'studyCountries' }) ?? [];
  const studyRegions = useWatch({ control: form.control, name: 'studyRegions' }) ?? [];
  const studySubnational = useWatch({ control: form.control, name: 'studySubnational' }) ?? [];
  const prevScopeRef = useRef(geographicScope);

  // Clear region/country/subnational fields when geographic scope changes
  useEffect(() => {
    const prev = prevScopeRef.current;
    prevScopeRef.current = geographicScope;
    if (prev === geographicScope) return;

    // Always clear subnational when leaving sub_national
    if (prev === 'sub_national') {
      form.setValue('studySubnational', [], { shouldDirty: true });
    }

    if (geographicScope === 'regional') {
      form.setValue('studyCountries', [], { shouldDirty: true });
      form.setValue('studySubnational', [], { shouldDirty: true });
    } else if (geographicScope === 'national') {
      form.setValue('studyRegions', [], { shouldDirty: true });
      form.setValue('studySubnational', [], { shouldDirty: true });
    } else if (geographicScope === 'sub_national') {
      form.setValue('studyRegions', [], { shouldDirty: true });
      form.setValue('studyCountries', [], { shouldDirty: true });
      form.setValue('studySubnational', [], { shouldDirty: true });
    } else {
      // global, site_specific — clear all
      form.setValue('studyRegions', [], { shouldDirty: true });
      form.setValue('studyCountries', [], { shouldDirty: true });
      form.setValue('studySubnational', [], { shouldDirty: true });
    }
  }, [geographicScope, form]);

  // Auto-populate regions from selected countries when scope is national
  useEffect(() => {
    if (geographicScope !== 'national') return;
    const derived = regionsForCountries(studyCountries);
    const current = form.getValues('studyRegions') ?? [];
    if (derived.join(',') !== current.join(',')) {
      form.setValue('studyRegions', derived, { shouldDirty: true });
    }
  }, [geographicScope, studyCountries, form]);

  // Auto-populate countries and regions from selected subnational units
  useEffect(() => {
    if (geographicScope !== 'sub_national') return;
    const derivedCountries = countriesForSubnational(studySubnational);
    const currentCountries = form.getValues('studyCountries') ?? [];
    if (derivedCountries.join(',') !== currentCountries.join(',')) {
      form.setValue('studyCountries', derivedCountries, { shouldDirty: true });
    }
    const derivedRegions = regionsForCountries(derivedCountries);
    const currentRegions = form.getValues('studyRegions') ?? [];
    if (derivedRegions.join(',') !== currentRegions.join(',')) {
      form.setValue('studyRegions', derivedRegions, { shouldDirty: true });
    }
  }, [geographicScope, studySubnational, form]);

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

      {/* Region(s) — editable when scope is regional */}
      {geographicScope === 'regional' && (
        <FormField
          control={form.control}
          name="studyRegions"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Region(s)</FormLabel>
              <FormControl>
                <MultiSelect
                  groups={REGION_GROUPS}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Select regions..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Country(ies) — editable when scope is national */}
      {geographicScope === 'national' && (
        <>
          <FormField
            control={form.control}
            name="studyCountries"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Country(ies)</FormLabel>
                <FormControl>
                  <MultiSelect
                    groups={COUNTRY_GROUPS}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Select countries..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Region(s) — read-only, auto-populated from countries */}
          {studyRegions.length > 0 && (
            <div className="sm:col-span-2 space-y-1.5">
              <span className="text-sm font-medium leading-none">Region(s)</span>
              <div className="flex flex-wrap gap-1">
                {studyRegions.map((r) => (
                  <Badge key={r} variant="secondary">
                    {regionLabelMap[r] ?? r}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Auto-populated from selected countries</p>
            </div>
          )}
        </>
      )}

      {/* Province(s)/State(s) — editable when scope is sub_national */}
      {geographicScope === 'sub_national' && (
        <>
          <FormField
            control={form.control}
            name="studySubnational"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Province(s)/State(s)</FormLabel>
                <FormControl>
                  <FilteredMultiSelect
                    options={SUBNATIONAL_OPTIONS}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Select provinces/states..."
                    searchPlaceholder="Type to search provinces/states..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Country(ies) — read-only, auto-populated from provinces */}
          {studyCountries.length > 0 && (
            <div className="sm:col-span-2 space-y-1.5">
              <span className="text-sm font-medium leading-none">Country(ies)</span>
              <div className="flex flex-wrap gap-1">
                {studyCountries.map((c) => (
                  <Badge key={c} variant="secondary">
                    {countryLabelMap[c] ?? c}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Auto-populated from selected provinces/states</p>
            </div>
          )}
          {/* Region(s) — read-only, auto-populated from countries */}
          {studyRegions.length > 0 && (
            <div className="sm:col-span-2 space-y-1.5">
              <span className="text-sm font-medium leading-none">Region(s)</span>
              <div className="flex flex-wrap gap-1">
                {studyRegions.map((r) => (
                  <Badge key={r} variant="secondary">
                    {regionLabelMap[r] ?? r}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Auto-populated from selected countries</p>
            </div>
          )}
        </>
      )}

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
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary indicator" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PRIMARY_INDICATOR_GROUPS.map((group) => (
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

      {/* Study-specific Indicators */}
      <FormField
        control={form.control}
        name="studyIndicators"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Study-specific Indicators *</FormLabel>
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

      {/* File Upload */}
      <div className="sm:col-span-2">
        <FileUpload ref={fileUploadRef} submissionId={submissionId} onFileChange={onFileChange} />
      </div>
    </div>
  );
});
