import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle } from 'lucide-react';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
} from '@/types/index';
import { generateDefinitionsPDF } from '@/lib/definitionsPdf';

interface DefinitionOption {
  value: string;
  label: string;
  description?: string;
}

interface DefinitionSectionData {
  title: string;
  intro?: string;
  options: DefinitionOption[];
}

const SECTIONS: DefinitionSectionData[] = [
  {
    title: 'Study Types',
    intro:
      'MELIAF recognises ten study types that span the full cycle of research impact — from forward-looking assessments through to synthesis and learning.',
    options: STUDY_TYPE_OPTIONS,
  },
  {
    title: 'Causality Modes',
    intro:
      'Each study is classified by its level of causal ambition, from descriptive accounts to rigorous counterfactual attribution.',
    options: CAUSALITY_MODE_OPTIONS,
  },
  {
    title: 'Timing',
    intro:
      'Timing captures when the study takes place relative to the intervention being studied.',
    options: TIMING_OPTIONS,
  },
  {
    title: 'Result Levels',
    intro:
      'Result levels follow the CGIAR impact pathway hierarchy, from outputs through outcomes to long-term impact.',
    options: RESULT_LEVEL_OPTIONS,
  },
  {
    title: 'Method Classes',
    intro:
      'The methodological approach used in the study. This classification also determines whether Section C (Research Details) is required in the submission form.',
    options: METHOD_CLASS_OPTIONS,
  },
  {
    title: 'Analytical Scope',
    intro:
      'The level of analysis at which the study operates — from a single innovation to an entire portfolio.',
    options: ANALYTICAL_SCOPE_OPTIONS,
  },
  {
    title: 'Geographic Scope',
    intro:
      'The spatial scale of the study. This determines which geographic detail fields appear in the submission form.',
    options: GEOGRAPHIC_SCOPE_OPTIONS,
  },
];

function DefinitionCard({ section }: { section: DefinitionSectionData }) {
  const hasDescriptions = section.options.some((o) => o.description);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{section.title}</CardTitle>
        {section.intro && (
          <p className="text-sm text-muted-foreground">{section.intro}</p>
        )}
      </CardHeader>
      <CardContent>
        {hasDescriptions ? (
          <dl className="space-y-3">
            {section.options.map((opt) => (
              <div key={opt.value}>
                <dt className="text-sm font-semibold">{opt.label}</dt>
                {opt.description && (
                  <dd className="mt-0.5 text-sm text-muted-foreground">
                    {opt.description}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {section.options.map((opt) => (
              <li key={opt.value}>{opt.label}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function Definitions() {
  return (
    <div className="container max-w-4xl py-8">
      {/* Header row */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Study Classifications &amp; Definitions
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Reference guide for the study types, classification dimensions, and
            conditional logic used in the MELIAF Study Stocktake.
          </p>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => generateDefinitionsPDF()}
        >
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Definition sections */}
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <DefinitionCard key={section.title} section={section} />
        ))}

        {/* Conditional Logic card */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              Conditional Logic: Section C (Research Details)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Section C of the study submission form collects detailed research
              design information. It is <strong>conditionally displayed</strong>{' '}
              — it only appears when the study&apos;s classification warrants
              additional methodological detail.
            </p>
            <p className="font-medium">
              Section C appears when any of the following conditions are met:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Causality Mode</strong> is set to{' '}
                <em>C2 — Causal (Counterfactual attribution)</em>
              </li>
              <li>
                <strong>Method Class</strong> is set to <em>Quantitative</em>
              </li>
              <li>
                <strong>Method Class</strong> is set to{' '}
                <em>Experimental / Quasi-Experimental</em>
              </li>
            </ul>
            <p className="text-muted-foreground">
              For all other combinations (e.g. C0 Descriptive + Qualitative, C1
              Contribution + Mixed), Section C is hidden and its fields are not
              required.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
