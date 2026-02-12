import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FilteredMultiSelectProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplayed?: number;
}

export function FilteredMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Type to search...',
  maxDisplayed = 100,
}: FilteredMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of options) map[o.value] = o.label;
    return map;
  }, [options]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const matches: { value: string; label: string }[] = [];
    for (const o of options) {
      if (o.label.toLowerCase().includes(q)) {
        matches.push(o);
        if (matches.length >= maxDisplayed + 1) break;
      }
    }
    return matches;
  }, [search, options, maxDisplayed]);

  const displayedOptions = filtered.slice(0, maxDisplayed);
  const totalMatches = filtered.length > maxDisplayed ? `${maxDisplayed}+` : String(filtered.length);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const remove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className="flex h-auto min-h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          tabIndex={0}
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {value.map((v) => (
              <Badge
                key={v}
                variant="secondary"
                className="mr-1 mb-0.5 mt-0.5"
              >
                {labelMap[v] ?? v}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => remove(v, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!search.trim() ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchPlaceholder}
              </div>
            ) : displayedOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {displayedOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value.includes(option.value) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {filtered.length > maxDisplayed && (
                  <div className="px-2 py-2 text-center text-xs text-muted-foreground">
                    Showing {maxDisplayed} of {totalMatches} matches — refine your search
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
