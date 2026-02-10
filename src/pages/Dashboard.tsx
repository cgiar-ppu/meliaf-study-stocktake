import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { listAllSubmissions, type SubmissionItem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowUpDown,
  Columns3,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  STATUS_OPTIONS,
  FUNDED_OPTIONS,
  LEAD_CENTER_OPTIONS,
  PRIMARY_INDICATOR_GROUPS,
  OTHER_CENTERS_GROUPS,
  YES_NO_NA_OPTIONS,
  PRIMARY_USER_OPTIONS,
} from '@/types';

// --- Lookup maps for enum → label ---

type OptionItem = { value: string; label: string };

function buildLookup(options: OptionItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const o of options) map[o.value] = o.label;
  return map;
}

const studyTypeLookup = buildLookup(STUDY_TYPE_OPTIONS);
const timingLookup = buildLookup(TIMING_OPTIONS);
const geoScopeLookup = buildLookup(GEOGRAPHIC_SCOPE_OPTIONS);
const resultLevelLookup = buildLookup(RESULT_LEVEL_OPTIONS);
const analyticalScopeLookup = buildLookup(ANALYTICAL_SCOPE_OPTIONS);
const causalityModeLookup = buildLookup(CAUSALITY_MODE_OPTIONS);
const methodClassLookup = buildLookup(METHOD_CLASS_OPTIONS);
const dataCollectionStatusLookup = buildLookup(STATUS_OPTIONS);
const analysisStatusLookup = buildLookup(STATUS_OPTIONS);
const fundedLookup = buildLookup(FUNDED_OPTIONS);
const leadCenterLookup = buildLookup(LEAD_CENTER_OPTIONS);
const primaryIndicatorLookup = buildLookup(
  PRIMARY_INDICATOR_GROUPS.flatMap((g) => g.options)
);

const otherCentersLookup = buildLookup(OTHER_CENTERS_GROUPS.flatMap((g) => g.options));
const primaryUserLookup = buildLookup(PRIMARY_USER_OPTIONS);
const yesNoNaLookup = buildLookup(YES_NO_NA_OPTIONS);

function labelFor(lookup: Record<string, string>, value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return lookup[value] ?? value;
}

// --- Truncated cell with tooltip ---

const TRUNCATE_LIMIT = 50;

function TruncatedCell({ text }: { text: string }) {
  if (!text || text.length <= TRUNCATE_LIMIT) return <>{text}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{text.slice(0, TRUNCATE_LIMIT)}…</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-normal">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// --- Column metadata ---

interface ColumnMeta {
  filterType?: 'text' | 'multi-select';
  filterOptions?: OptionItem[];
}

// --- Multi-select filter function ---

function multiSelectFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string[]
): boolean {
  if (!filterValue || filterValue.length === 0) return true;
  const cellValue = String(row.getValue(columnId) ?? '');
  return filterValue.includes(cellValue);
}

// --- Column definitions ---

const columns: ColumnDef<SubmissionItem, unknown>[] = [
  {
    accessorKey: 'studyTitle',
    header: 'Study Title',
    meta: { filterType: 'text' } satisfies ColumnMeta,
  },
  {
    accessorKey: 'leadCenter',
    header: 'Lead Center',
    cell: ({ getValue }) => labelFor(leadCenterLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: LEAD_CENTER_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'studyType',
    header: 'Study Type',
    cell: ({ getValue }) => labelFor(studyTypeLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: STUDY_TYPE_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'timing',
    header: 'Timing',
    cell: ({ getValue }) => labelFor(timingLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: TIMING_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'geographicScope',
    header: 'Geographic Scope',
    cell: ({ getValue }) => labelFor(geoScopeLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: GEOGRAPHIC_SCOPE_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'resultLevel',
    header: 'Result Level',
    cell: ({ getValue }) => labelFor(resultLevelLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: RESULT_LEVEL_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
  },
  {
    accessorKey: 'contactName',
    header: 'Contact Name',
    meta: { filterType: 'text' } satisfies ColumnMeta,
  },
  {
    accessorKey: 'contactEmail',
    header: 'Contact Email',
  },
  {
    accessorKey: 'analyticalScope',
    header: 'Analytical Scope',
    cell: ({ getValue }) => labelFor(analyticalScopeLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: ANALYTICAL_SCOPE_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'causalityMode',
    header: 'Causality Mode',
    cell: ({ getValue }) => labelFor(causalityModeLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: CAUSALITY_MODE_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'methodClass',
    header: 'Method Class',
    cell: ({ getValue }) => labelFor(methodClassLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: METHOD_CLASS_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'primaryIndicator',
    header: 'Primary Indicator',
    cell: ({ getValue }) => labelFor(primaryIndicatorLookup, getValue()),
    meta: {
      filterType: 'multi-select',
      filterOptions: PRIMARY_INDICATOR_GROUPS.flatMap((g) => g.options),
    } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'expectedEndDate',
    header: 'Expected End Date',
  },
  {
    accessorKey: 'dataCollectionStatus',
    header: 'Data Collection Status',
    cell: ({ getValue }) => labelFor(dataCollectionStatusLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: STATUS_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'analysisStatus',
    header: 'Analysis Status',
    cell: ({ getValue }) => labelFor(analysisStatusLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: STATUS_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'funded',
    header: 'Funded',
    cell: ({ getValue }) => labelFor(fundedLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: FUNDED_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  // --- New columns (hidden by default) ---
  {
    accessorKey: 'studyId',
    header: 'Study ID',
    meta: { filterType: 'text' } satisfies ColumnMeta,
  },
  {
    accessorKey: 'otherCenters',
    header: 'Other Centers',
    cell: ({ getValue }) => {
      const v = getValue();
      if (!Array.isArray(v) || v.length === 0) return '';
      const text = v.map((c: string) => otherCentersLookup[c] ?? c).join(', ');
      return <TruncatedCell text={text} />;
    },
  },
  {
    accessorKey: 'keyResearchQuestions',
    header: 'Key Questions',
    cell: ({ getValue }) => <TruncatedCell text={String(getValue() ?? '')} />,
  },
  {
    accessorKey: 'unitOfAnalysis',
    header: 'Unit of Analysis',
    cell: ({ getValue }) => <TruncatedCell text={String(getValue() ?? '')} />,
  },
  {
    accessorKey: 'treatmentIntervention',
    header: 'Treatment/Intervention',
    cell: ({ getValue }) => <TruncatedCell text={String(getValue() ?? '')} />,
  },
  {
    accessorKey: 'sampleSize',
    header: 'Sample Size',
    cell: ({ getValue }) => {
      const v = getValue();
      return v != null ? String(v) : '';
    },
  },
  {
    accessorKey: 'powerCalculation',
    header: 'Power Calculation',
    cell: ({ getValue }) => labelFor(yesNoNaLookup, getValue()),
    meta: { filterType: 'multi-select', filterOptions: YES_NO_NA_OPTIONS } satisfies ColumnMeta,
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'dataCollectionMethods',
    header: 'Data Collection Methods',
    cell: ({ getValue }) => {
      const v = getValue();
      if (!Array.isArray(v) || v.length === 0) return '';
      const text = v.join(', ');
      return <TruncatedCell text={text} />;
    },
  },
  {
    accessorKey: 'studyIndicators',
    header: 'Study Indicators',
    cell: ({ getValue }) => <TruncatedCell text={String(getValue() ?? '')} />,
  },
  {
    accessorKey: 'preAnalysisPlan',
    header: 'Pre-Analysis Plan',
    cell: ({ getValue }) => {
      const v = getValue() as { answer?: string } | null | undefined;
      return v?.answer === 'yes' ? 'Yes' : v?.answer === 'no' ? 'No' : '';
    },
  },
  {
    accessorKey: 'dataCollectionRounds',
    header: 'Data Collection Rounds',
    cell: ({ getValue }) => {
      const v = getValue();
      return v != null ? String(v) : '';
    },
  },
  {
    accessorKey: 'fundingSource',
    header: 'Funding Source',
    cell: ({ getValue }) => <TruncatedCell text={String(getValue() ?? '')} />,
    meta: { filterType: 'text' } satisfies ColumnMeta,
  },
  {
    accessorKey: 'totalCostUSD',
    header: 'Total Cost (USD)',
    cell: ({ getValue }) => {
      const v = getValue();
      if (v == null) return '';
      return Number(v).toLocaleString();
    },
  },
  {
    accessorKey: 'proposalAvailable',
    header: 'Proposal Available',
    cell: ({ getValue }) => {
      const v = getValue() as { answer?: string } | null | undefined;
      return v?.answer === 'yes' ? 'Yes' : v?.answer === 'no' ? 'No' : '';
    },
  },
  {
    accessorKey: 'manuscriptDeveloped',
    header: 'Manuscript Developed',
    cell: ({ getValue }) => {
      const v = getValue() as { answer?: string } | null | undefined;
      return v?.answer === 'yes' ? 'Yes' : v?.answer === 'no' ? 'No' : '';
    },
  },
  {
    accessorKey: 'policyBriefDeveloped',
    header: 'Policy Brief Developed',
    cell: ({ getValue }) => {
      const v = getValue() as { answer?: string } | null | undefined;
      return v?.answer === 'yes' ? 'Yes' : v?.answer === 'no' ? 'No' : '';
    },
  },
  {
    accessorKey: 'relatedToPastStudy',
    header: 'Related to Past Study',
    cell: ({ getValue }) => {
      const v = getValue() as { answer?: string } | null | undefined;
      return v?.answer === 'yes' ? 'Yes' : v?.answer === 'no' ? 'No' : '';
    },
  },
  {
    accessorKey: 'intendedPrimaryUser',
    header: 'Intended Primary Users',
    cell: ({ getValue }) => {
      const v = getValue();
      if (!Array.isArray(v) || v.length === 0) return '';
      const text = v.map((u: string) => primaryUserLookup[u] ?? u).join(', ');
      return <TruncatedCell text={text} />;
    },
  },
  {
    accessorKey: 'commissioningSource',
    header: 'Commissioning Source',
    cell: ({ getValue }) => <TruncatedCell text={String(getValue() ?? '')} />,
    meta: { filterType: 'text' } satisfies ColumnMeta,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ getValue }) => {
      const v = getValue();
      if (typeof v !== 'string') return '';
      return new Date(v).toLocaleDateString();
    },
  },
];

const DEFAULT_VISIBLE: Record<string, boolean> = {
  studyTitle: true,
  leadCenter: true,
  studyType: true,
  timing: true,
  geographicScope: true,
  resultLevel: true,
  startDate: true,
  contactName: false,
  contactEmail: false,
  analyticalScope: false,
  causalityMode: false,
  methodClass: false,
  primaryIndicator: false,
  expectedEndDate: false,
  dataCollectionStatus: false,
  analysisStatus: false,
  funded: false,
  studyId: false,
  otherCenters: false,
  keyResearchQuestions: false,
  unitOfAnalysis: false,
  treatmentIntervention: false,
  sampleSize: false,
  powerCalculation: false,
  dataCollectionMethods: false,
  studyIndicators: false,
  preAnalysisPlan: false,
  dataCollectionRounds: false,
  fundingSource: false,
  totalCostUSD: false,
  proposalAvailable: false,
  manuscriptDeveloped: false,
  policyBriefDeveloped: false,
  relatedToPastStudy: false,
  intendedPrimaryUser: false,
  commissioningSource: false,
  createdAt: false,
};

const COLUMN_SECTIONS: { label: string; columns: string[] }[] = [
  { label: 'A — Basic Information',    columns: ['studyId', 'studyTitle', 'leadCenter', 'contactName', 'contactEmail', 'otherCenters'] },
  { label: 'B — Study Classification', columns: ['studyType', 'timing', 'analyticalScope', 'geographicScope', 'resultLevel', 'causalityMode', 'methodClass', 'primaryIndicator'] },
  { label: 'C — Research Details',     columns: ['keyResearchQuestions', 'unitOfAnalysis', 'treatmentIntervention', 'sampleSize', 'powerCalculation', 'dataCollectionMethods', 'studyIndicators', 'preAnalysisPlan', 'dataCollectionRounds'] },
  { label: 'D — Timeline & Status',    columns: ['startDate', 'expectedEndDate', 'dataCollectionStatus', 'analysisStatus'] },
  { label: 'E — Funding & Resources',  columns: ['funded', 'fundingSource', 'totalCostUSD', 'proposalAvailable'] },
  { label: 'F — Outputs & Users',      columns: ['manuscriptDeveloped', 'policyBriefDeveloped', 'relatedToPastStudy', 'intendedPrimaryUser', 'commissioningSource'] },
  { label: 'Metadata',                 columns: ['createdAt'] },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const hidden: VisibilityState = {};
      for (const [key, visible] of Object.entries(DEFAULT_VISIBLE)) {
        if (!visible) hidden[key] = false;
      }
      return hidden;
    }
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => listAllSubmissions(),
    enabled: isAuthenticated,
  });

  const submissions = useMemo(() => data?.submissions ?? [], [data]);

  const table = useReactTable({
    data: submissions,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const visibleFilterColumns = table
    .getAllColumns()
    .filter((col) => col.getIsVisible() && (col.columnDef.meta as ColumnMeta | undefined)?.filterType);

  const hasActiveFilters = columnFilters.length > 0;

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Browse and filter all study submissions across all users
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load submissions. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar: column picker + count */}
      <div className="flex items-center gap-3">
        <ColumnPicker table={table} />
        <Badge variant="secondary" className="text-xs">
          {table.getFilteredRowModel().rows.length} submission{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </Badge>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColumnFilters([])}
            className="h-8 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filters bar */}
      {visibleFilterColumns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleFilterColumns.map((column) => {
            const meta = column.columnDef.meta as ColumnMeta;
            if (meta.filterType === 'text') {
              return (
                <TextFilter
                  key={column.id}
                  label={typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  value={(column.getFilterValue() as string) ?? ''}
                  onChange={(v) => column.setFilterValue(v || undefined)}
                />
              );
            }
            if (meta.filterType === 'multi-select' && meta.filterOptions) {
              return (
                <MultiSelectFilter
                  key={column.id}
                  label={typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  options={meta.filterOptions}
                  value={(column.getFilterValue() as string[]) ?? []}
                  onChange={(v) => column.setFilterValue(v.length > 0 ? v : undefined)}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Data table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <FolderOpen className="mb-2 h-10 w-10 opacity-50" />
          <p>No submissions found</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 text-xs font-medium"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleFlatColumns().length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
    </TooltipProvider>
  );
}

// --- Column picker ---

function ColumnPicker({ table }: { table: ReturnType<typeof useReactTable<SubmissionItem>> }) {
  const allColumns = table.getAllLeafColumns();
  const columnById = new Map(allColumns.map((col) => [col.id, col]));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Columns3 className="mr-2 h-3.5 w-3.5" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="max-h-80 overflow-y-auto">
          {COLUMN_SECTIONS.map((section) => {
            const sectionColumns = section.columns
              .map((id) => columnById.get(id))
              .filter((col): col is NonNullable<typeof col> => col != null);
            if (sectionColumns.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="px-2 pt-3 pb-1 text-xs font-semibold text-muted-foreground first:pt-1">
                  {section.label}
                </div>
                {sectionColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                    />
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Text filter ---

function TextFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      placeholder={`Filter ${label}...`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-40 text-xs"
    />
  );
}

// --- Multi-select filter ---

function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: OptionItem[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
          {label}
          {value.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 px-1 text-[10px]">
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={value.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 w-full text-xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
