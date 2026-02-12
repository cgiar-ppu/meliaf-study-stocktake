import { Badge } from '@/components/ui/badge';
import type { SubmissionItem } from '@/lib/api';
import { shouldShowResearchDetails } from '@/lib/formSchema';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  STATUS_OPTIONS,
  FUNDED_OPTIONS,
  YES_NO_NA_OPTIONS,
  PRIMARY_USER_OPTIONS,
} from '@/types';
import { CGIAR_REGION_OPTIONS, CGIAR_COUNTRY_OPTIONS } from '@/data/cgiarGeography';
import { SUBNATIONAL_LOOKUP } from '@/data/subnationalUnits';

const regionLookup: Record<string, string> = {};
for (const r of CGIAR_REGION_OPTIONS) regionLookup[r.value] = r.label;
const countryLookup: Record<string, string> = {};
for (const c of CGIAR_COUNTRY_OPTIONS) countryLookup[c.value] = c.label;

function resolveLabel(
  options: { value: string; label: string; description?: string }[],
  value: unknown,
): string {
  if (!value) return '—';
  const opt = options.find((o) => o.value === value);
  return opt ? opt.label : String(value);
}

function PreviewSection({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-b border-border/50 pb-5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {label}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <dl className="grid gap-3">{children}</dl>
    </div>
  );
}

function PreviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-2">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="text-sm">{children || '—'}</dd>
    </div>
  );
}

function YesNoLinkDisplay({ value }: { value?: { answer?: string; link?: string } }) {
  if (!value?.answer) return <span>—</span>;
  if (value.answer === 'yes' && value.link) {
    return (
      <span>
        Yes —{' '}
        <a href={value.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          Link
        </a>
      </span>
    );
  }
  return <span>{value.answer === 'yes' ? 'Yes' : 'No'}</span>;
}

interface SubmissionPreviewProps {
  submission: SubmissionItem;
}

export function SubmissionPreview({ submission }: SubmissionPreviewProps) {
  const s = submission;
  const showSectionC = shouldShowResearchDetails(
    s.causalityMode as string,
    s.methodClass as string,
  );

  return (
    <div className="space-y-6">
      {/* Section A */}
      <PreviewSection label="A" title="Basic Information">
        <PreviewField label="Study ID">{s.studyId as string}</PreviewField>
        <PreviewField label="Study Title">{s.studyTitle}</PreviewField>
        <PreviewField label="Lead Center">{s.leadCenter}</PreviewField>
        <PreviewField label="Contact Name">{s.contactName}</PreviewField>
        <PreviewField label="Contact Email">{s.contactEmail}</PreviewField>
        <PreviewField label="Other Centers">
          {Array.isArray(s.otherCenters) && (s.otherCenters as string[]).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {(s.otherCenters as string[]).map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
          ) : (
            '—'
          )}
        </PreviewField>
      </PreviewSection>

      {/* Section B */}
      <PreviewSection label="B" title="Study Classification">
        <PreviewField label="Study Type">
          {resolveLabel(STUDY_TYPE_OPTIONS, s.studyType)}
        </PreviewField>
        <PreviewField label="Timing">
          {(() => {
            const opt = TIMING_OPTIONS.find((o) => o.value === s.timing);
            return opt ? `${opt.label} — ${opt.description}` : String(s.timing || '—');
          })()}
        </PreviewField>
        <PreviewField label="Analytical Scope">
          {resolveLabel(ANALYTICAL_SCOPE_OPTIONS, s.analyticalScope)}
        </PreviewField>
        <PreviewField label="Geographic Scope">
          {resolveLabel(GEOGRAPHIC_SCOPE_OPTIONS, s.geographicScope)}
        </PreviewField>
        {Array.isArray(s.studyRegions) && (s.studyRegions as string[]).length > 0 && (
          <PreviewField label="Region(s)">
            <div className="flex flex-wrap gap-1">
              {(s.studyRegions as string[]).map((r) => (
                <Badge key={r} variant="secondary">{regionLookup[r] ?? r}</Badge>
              ))}
            </div>
          </PreviewField>
        )}
        {Array.isArray(s.studyCountries) && (s.studyCountries as string[]).length > 0 && (
          <PreviewField label="Country(ies)">
            <div className="flex flex-wrap gap-1">
              {(s.studyCountries as string[]).map((c) => (
                <Badge key={c} variant="secondary">{countryLookup[c] ?? c}</Badge>
              ))}
            </div>
          </PreviewField>
        )}
        {Array.isArray(s.studySubnational) && (s.studySubnational as string[]).length > 0 && (
          <PreviewField label="Province(s)/State(s)">
            <div className="flex flex-wrap gap-1">
              {(s.studySubnational as string[]).map((code) => (
                <Badge key={code} variant="secondary">{SUBNATIONAL_LOOKUP[code] ?? code}</Badge>
              ))}
            </div>
          </PreviewField>
        )}
        <PreviewField label="Result Level">
          {resolveLabel(RESULT_LEVEL_OPTIONS, s.resultLevel)}
        </PreviewField>
        <PreviewField label="Causality Mode">
          {(() => {
            const opt = CAUSALITY_MODE_OPTIONS.find((o) => o.value === s.causalityMode);
            return opt ? `${opt.label} — ${opt.description}` : String(s.causalityMode || '—');
          })()}
        </PreviewField>
        <PreviewField label="Method Class">
          {resolveLabel(METHOD_CLASS_OPTIONS, s.methodClass)}
        </PreviewField>
        <PreviewField label="Primary Indicator">{s.primaryIndicator as string}</PreviewField>
      </PreviewSection>

      {/* Section C (conditional) */}
      {showSectionC && (
        <PreviewSection label="C" title="Research Details">
          <PreviewField label="Key Research Questions">
            {s.keyResearchQuestions as string}
          </PreviewField>
          <PreviewField label="Unit of Analysis">{s.unitOfAnalysis as string}</PreviewField>
          <PreviewField label="Treatment / Intervention">
            {s.treatmentIntervention as string}
          </PreviewField>
          <PreviewField label="Sample Size">
            {s.sampleSize ? String(s.sampleSize) : '—'}
          </PreviewField>
          <PreviewField label="Power Calculation">
            {resolveLabel(YES_NO_NA_OPTIONS, s.powerCalculation)}
          </PreviewField>
          <PreviewField label="Data Collection Methods">
            {Array.isArray(s.dataCollectionMethods) && (s.dataCollectionMethods as string[]).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(s.dataCollectionMethods as string[]).map((m) => (
                  <Badge key={m} variant="secondary">{m}</Badge>
                ))}
              </div>
            ) : (
              '—'
            )}
          </PreviewField>
          <PreviewField label="Study Indicators">{s.studyIndicators as string}</PreviewField>
          <PreviewField label="Pre-Analysis Plan">
            <YesNoLinkDisplay value={s.preAnalysisPlan as { answer?: string; link?: string }} />
          </PreviewField>
          <PreviewField label="Data Collection Rounds">
            {s.dataCollectionRounds ? String(s.dataCollectionRounds) : '—'}
          </PreviewField>
        </PreviewSection>
      )}

      {/* Section D */}
      <PreviewSection label="D" title="Timeline & Status">
        <PreviewField label="Start Date">
          {s.startDate ? new Date(`${s.startDate}T00:00:00`).toLocaleDateString() : '—'}
        </PreviewField>
        <PreviewField label="Expected End Date">
          {s.expectedEndDate
            ? new Date(`${String(s.expectedEndDate)}T00:00:00`).toLocaleDateString()
            : '—'}
        </PreviewField>
        <PreviewField label="Data Collection Status">
          {resolveLabel(STATUS_OPTIONS, s.dataCollectionStatus)}
        </PreviewField>
        <PreviewField label="Analysis Status">
          {resolveLabel(STATUS_OPTIONS, s.analysisStatus)}
        </PreviewField>
      </PreviewSection>

      {/* Section E */}
      <PreviewSection label="E" title="Funding & Resources">
        <PreviewField label="Funded">
          {resolveLabel(FUNDED_OPTIONS, s.funded)}
        </PreviewField>
        <PreviewField label="Funding Source">{s.fundingSource as string}</PreviewField>
        <PreviewField label="Total Cost (USD)">
          {s.totalCostUSD
            ? `$${Number(s.totalCostUSD).toLocaleString()}`
            : '—'}
        </PreviewField>
        <PreviewField label="Proposal Available">
          <YesNoLinkDisplay value={s.proposalAvailable as { answer?: string; link?: string }} />
        </PreviewField>
      </PreviewSection>

      {/* Section F */}
      <PreviewSection label="F" title="Outputs & Users">
        <PreviewField label="Manuscript Developed">
          <YesNoLinkDisplay value={s.manuscriptDeveloped as { answer?: string; link?: string }} />
        </PreviewField>
        <PreviewField label="Policy Brief Developed">
          <YesNoLinkDisplay value={s.policyBriefDeveloped as { answer?: string; link?: string }} />
        </PreviewField>
        <PreviewField label="Related to Past Study">
          <YesNoLinkDisplay value={s.relatedToPastStudy as { answer?: string; link?: string }} />
        </PreviewField>
        <PreviewField label="Intended Primary Users">
          {Array.isArray(s.intendedPrimaryUser) && (s.intendedPrimaryUser as string[]).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {(s.intendedPrimaryUser as string[]).map((u) => (
                <Badge key={u} variant="secondary">
                  {resolveLabel(PRIMARY_USER_OPTIONS, u)}
                </Badge>
              ))}
            </div>
          ) : (
            '—'
          )}
        </PreviewField>
        <PreviewField label="Commissioning Source">
          {s.commissioningSource as string}
        </PreviewField>
      </PreviewSection>
    </div>
  );
}
