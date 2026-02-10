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

// --- Categorical palette (13 colors for fields with many categories) ---

const CATEGORICAL_COLORS = [
  'hsl(161, 100%, 20%)', // cgiar-green
  'hsl(41, 65%, 55%)',   // cgiar-gold
  'hsl(210, 80%, 45%)',  // cgiar-blue
  'hsl(161, 50%, 40%)',  // lighter green
  'hsl(41, 55%, 70%)',   // lighter gold
  'hsl(210, 60%, 65%)',  // lighter blue
  'hsl(270, 50%, 55%)',  // purple
  'hsl(350, 55%, 55%)',  // rose
  'hsl(175, 50%, 40%)',  // teal
  'hsl(25, 70%, 55%)',   // orange
  'hsl(140, 25%, 55%)',  // sage
  'hsl(215, 35%, 55%)',  // steel-blue
  'hsl(290, 30%, 60%)',  // mauve
];

function buildCategoricalConfig(
  options: { value: string; label: string }[],
): ChartConfig {
  const config: ChartConfig = {};
  options.forEach((opt, i) => {
    config[opt.value] = {
      label: opt.label,
      color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
    };
  });
  return config;
}

// --- Ordinal / semantic color scales ---

const TIMING_COLORS: Record<string, string> = {
  t0_ex_ante: 'hsl(161, 40%, 75%)',
  t1_during: 'hsl(161, 55%, 55%)',
  t2_endline: 'hsl(161, 70%, 35%)',
  t3_ex_post: 'hsl(161, 100%, 20%)',
};

const RESULT_LEVEL_COLORS: Record<string, string> = {
  output: 'hsl(210, 80%, 45%)',  // blue
  outcome: 'hsl(41, 65%, 55%)', // gold
  impact: 'hsl(161, 100%, 20%)', // green
};

const CAUSALITY_COLORS: Record<string, string> = {
  c0_descriptive: 'hsl(210, 40%, 75%)',
  c1_contribution: 'hsl(210, 60%, 55%)',
  c2_causal: 'hsl(210, 80%, 35%)',
};

const PIPELINE_COLORS: Record<string, string> = {
  planned: 'hsl(41, 65%, 55%)',   // gold
  ongoing: 'hsl(210, 80%, 45%)',  // blue
  complete: 'hsl(161, 100%, 20%)', // green
};

function buildOrdinalConfig(
  options: { value: string; label: string }[],
  colorMap: Record<string, string>,
): ChartConfig {
  const config: ChartConfig = {};
  for (const opt of options) {
    config[opt.value] = {
      label: opt.label,
      color: colorMap[opt.value],
    };
  }
  return config;
}

// --- Exported configs ---

export const studyTypeConfig = buildCategoricalConfig(STUDY_TYPE_OPTIONS);
export const leadCenterConfig = buildCategoricalConfig(LEAD_CENTER_OPTIONS);
export const methodClassConfig = buildCategoricalConfig(METHOD_CLASS_OPTIONS);

export const timingConfig = buildOrdinalConfig(TIMING_OPTIONS, TIMING_COLORS);
export const resultLevelConfig = buildOrdinalConfig(RESULT_LEVEL_OPTIONS, RESULT_LEVEL_COLORS);
export const causalityModeConfig = buildOrdinalConfig(CAUSALITY_MODE_OPTIONS, CAUSALITY_COLORS);
export const pipelineStatusConfig = buildOrdinalConfig(STATUS_OPTIONS, PIPELINE_COLORS);
export const analysisStatusConfig = pipelineStatusConfig;
