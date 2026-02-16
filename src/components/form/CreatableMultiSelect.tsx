import { useState, KeyboardEvent, useMemo } from 'react';
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

interface CreatableMultiSelectProps {
  suggestions: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function CreatableMultiSelect({
  suggestions,
  value,
  onChange,
  placeholder = 'Select or type options...',
}: CreatableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const suggestionMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of suggestions) map[s.value] = s.label;
    return map;
  }, [suggestions]);

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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const trimmed = search.trim();
    if (!trimmed) return;

    // Check if it matches an existing suggestion (case-insensitive)
    const match = suggestions.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      if (!value.includes(match.value)) {
        onChange([...value, match.value]);
      }
    } else if (!value.includes(trimmed)) {
      // Add as custom value
      onChange([...value, trimmed]);
    }
    setSearch('');
    e.preventDefault();
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
                {suggestionMap[v] ?? v}
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
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search or type custom value..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <span className="text-xs">
                  Press <kbd className="rounded border px-1">Enter</kbd> to add "{search.trim()}"
                </span>
              ) : (
                'No results found.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
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
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
