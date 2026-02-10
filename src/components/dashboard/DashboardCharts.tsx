import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SubmissionItem } from '@/lib/api';
import type { ChartConfig } from '@/components/ui/chart';
import {
  STUDY_TYPE_OPTIONS,
  LEAD_CENTER_OPTIONS,
  TIMING_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  STATUS_OPTIONS,
} from '@/types';
import {
  studyTypeConfig,
  leadCenterConfig,
  timingConfig,
  resultLevelConfig,
  causalityModeConfig,
  methodClassConfig,
  pipelineStatusConfig,
  analysisStatusConfig,
} from './chartColors';
import { HorizontalBarChart, type ChartDataItem } from './charts/HorizontalBarChart';
import { DonutChart, type DonutDataItem } from './charts/DonutChart';
import { PipelineStatusChart } from './charts/PipelineStatusChart';

const STORAGE_KEY = 'meliaf-dashboard-charts-open';

function getInitialOpen(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

type OptionItem = { value: string; label: string };

function countByField(
  rows: SubmissionItem[],
  field: string,
  options: OptionItem[],
  config: ChartConfig,
): ChartDataItem[] {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = row[field];
    if (typeof val === 'string' && val) {
      counts[val] = (counts[val] ?? 0) + 1;
    }
  }
  return options
    .map((opt) => ({
      name: opt.label,
      value: counts[opt.value] ?? 0,
      key: opt.value,
      fill: config[opt.value]?.color ?? 'hsl(var(--muted))',
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

interface DashboardChartsProps {
  rows: SubmissionItem[];
}

export function DashboardCharts({ rows }: DashboardChartsProps) {
  const [open, setOpen] = useState(getInitialOpen);

  function handleOpenChange(value: boolean) {
    setOpen(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }

  const studyTypeData = useMemo(
    () => countByField(rows, 'studyType', STUDY_TYPE_OPTIONS, studyTypeConfig),
    [rows],
  );
  const leadCenterData = useMemo(
    () => countByField(rows, 'leadCenter', LEAD_CENTER_OPTIONS, leadCenterConfig),
    [rows],
  );
  const timingData = useMemo(
    () => countByField(rows, 'timing', TIMING_OPTIONS, timingConfig) as DonutDataItem[],
    [rows],
  );
  const resultLevelData = useMemo(
    () => countByField(rows, 'resultLevel', RESULT_LEVEL_OPTIONS, resultLevelConfig) as DonutDataItem[],
    [rows],
  );
  const causalityData = useMemo(
    () => countByField(rows, 'causalityMode', CAUSALITY_MODE_OPTIONS, causalityModeConfig) as DonutDataItem[],
    [rows],
  );
  const methodClassData = useMemo(
    () => countByField(rows, 'methodClass', METHOD_CLASS_OPTIONS, methodClassConfig),
    [rows],
  );

  const pipelineData = useMemo(() => {
    const counts: Record<string, number> = { planned: 0, ongoing: 0, complete: 0 };
    for (const row of rows) {
      const val = row.dataCollectionStatus;
      if (typeof val === 'string' && val in counts) {
        counts[val]++;
      }
    }
    return {
      planned: counts.planned,
      ongoing: counts.ongoing,
      complete: counts.complete,
      total: counts.planned + counts.ongoing + counts.complete,
    };
  }, [rows]);

  const analysisData = useMemo(() => {
    const counts: Record<string, number> = { planned: 0, ongoing: 0, complete: 0 };
    for (const row of rows) {
      const val = row.analysisStatus;
      if (typeof val === 'string' && val in counts) {
        counts[val]++;
      }
    }
    return {
      planned: counts.planned,
      ongoing: counts.ongoing,
      complete: counts.complete,
      total: counts.planned + counts.ongoing + counts.complete,
    };
  }, [rows]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="rounded-lg border bg-card text-card-foreground">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors rounded-t-lg">
            <h2 className="text-sm font-semibold">Portfolio Overview</h2>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-4 pb-4 space-y-4">
            {/* Row 1: Study Type, Lead Center, Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <HorizontalBarChart
                title="Study Type"
                data={studyTypeData}
                config={studyTypeConfig}
              />
              <HorizontalBarChart
                title="Lead Center"
                data={leadCenterData}
                config={leadCenterConfig}
              />
              <DonutChart
                title="Timing"
                data={timingData}
                config={timingConfig}
              />
            </div>

            {/* Row 2: Result Level, Causality Mode, Method Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DonutChart
                title="Result Level"
                data={resultLevelData}
                config={resultLevelConfig}
              />
              <DonutChart
                title="Causality Mode"
                data={causalityData}
                config={causalityModeConfig}
              />
              <HorizontalBarChart
                title="Method Class"
                data={methodClassData}
                config={methodClassConfig}
              />
            </div>

            {/* Row 3: Data Collection Status + Analysis Status (50/50) */}
            {(pipelineData.total > 0 || analysisData.total > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pipelineData.total > 0 && (
                  <PipelineStatusChart
                    title="Data Collection Status"
                    data={pipelineData}
                    config={pipelineStatusConfig}
                  />
                )}
                {analysisData.total > 0 && (
                  <PipelineStatusChart
                    title="Analysis Status"
                    data={analysisData}
                    config={analysisStatusConfig}
                  />
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
