/**
 * Frontend-Backend API Contract Drift Tests
 *
 * Reads backend/functions/shared/constants.py as raw text and compares
 * enum values, field length limits, and conditional logic rules against
 * the frontend TypeScript definitions. Fails if either side drifts.
 */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

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
  PRIMARY_INDICATOR_GROUPS,
} from '@/types';
import { CGIAR_REGION_OPTIONS } from '@/data/cgiarGeography';
import { studyFormSchema, shouldShowResearchDetails } from '@/lib/formSchema';

// ---------------------------------------------------------------------------
// Helpers: parse Python constants.py as text
// ---------------------------------------------------------------------------

const CONSTANTS_PATH = path.resolve(__dirname, '../../backend/functions/shared/constants.py');
const constantsText = fs.readFileSync(CONSTANTS_PATH, 'utf-8');

/** Parse a Python set literal like `VALID_FOO = {"a", "b", "c"}` into a Set<string>. */
function parsePythonSet(varName: string): Set<string> {
  // Match across multiple lines — set may span several lines
  const re = new RegExp(`${varName}\\s*=\\s*\\{([^}]+)\\}`, 's');
  const match = constantsText.match(re);
  if (!match) throw new Error(`Could not find ${varName} in constants.py`);
  const raw = match[1];
  const values = [...raw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return new Set(values);
}

/** Parse a Python integer constant like `MAX_FOO = 50` → number. */
function parsePythonInt(varName: string): number {
  const re = new RegExp(`^${varName}\\s*=\\s*(\\d+)`, 'm');
  const match = constantsText.match(re);
  if (!match) throw new Error(`Could not find ${varName} in constants.py`);
  return parseInt(match[1], 10);
}

/** Extract option values from a frontend options array. */
function optionValues<T extends { value: string }>(options: T[]): Set<string> {
  return new Set(options.map((o) => o.value));
}

/** Flatten grouped options (PRIMARY_INDICATOR_GROUPS) into a flat set of values. */
function flatGroupValues(groups: { options: { value: string }[] }[]): Set<string> {
  return new Set(groups.flatMap((g) => g.options.map((o) => o.value)));
}

/** Pretty diff message for set comparisons. */
function setDiffMessage(backendSet: Set<string>, frontendSet: Set<string>): string {
  const onlyBackend = [...backendSet].filter((v) => !frontendSet.has(v));
  const onlyFrontend = [...frontendSet].filter((v) => !backendSet.has(v));
  const parts: string[] = [];
  if (onlyBackend.length) parts.push(`Only in backend: ${JSON.stringify(onlyBackend)}`);
  if (onlyFrontend.length) parts.push(`Only in frontend: ${JSON.stringify(onlyFrontend)}`);
  return parts.join('; ');
}

function expectSetsEqual(backendSet: Set<string>, frontendSet: Set<string>) {
  expect(backendSet, setDiffMessage(backendSet, frontendSet)).toEqual(frontendSet);
}

// ---------------------------------------------------------------------------
// Enum parity tests
// ---------------------------------------------------------------------------

describe('Contract sync: enum parity', () => {
  it('VALID_STUDY_TYPES matches STUDY_TYPE_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_STUDY_TYPES'), optionValues(STUDY_TYPE_OPTIONS));
  });

  it('VALID_TIMINGS matches TIMING_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_TIMINGS'), optionValues(TIMING_OPTIONS));
  });

  it('VALID_ANALYTICAL_SCOPES matches ANALYTICAL_SCOPE_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_ANALYTICAL_SCOPES'), optionValues(ANALYTICAL_SCOPE_OPTIONS));
  });

  it('VALID_GEOGRAPHIC_SCOPES matches GEOGRAPHIC_SCOPE_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_GEOGRAPHIC_SCOPES'), optionValues(GEOGRAPHIC_SCOPE_OPTIONS));
  });

  it('VALID_RESULT_LEVELS matches RESULT_LEVEL_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_RESULT_LEVELS'), optionValues(RESULT_LEVEL_OPTIONS));
  });

  it('VALID_CAUSALITY_MODES matches CAUSALITY_MODE_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_CAUSALITY_MODES'), optionValues(CAUSALITY_MODE_OPTIONS));
  });

  it('VALID_METHOD_CLASSES matches METHOD_CLASS_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_METHOD_CLASSES'), optionValues(METHOD_CLASS_OPTIONS));
  });

  it('VALID_STATUS_TYPES matches STATUS_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_STATUS_TYPES'), optionValues(STATUS_OPTIONS));
  });

  it('VALID_FUNDED_TYPES matches FUNDED_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_FUNDED_TYPES'), optionValues(FUNDED_OPTIONS));
  });

  it('VALID_YES_NO_NA matches YES_NO_NA_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_YES_NO_NA'), optionValues(YES_NO_NA_OPTIONS));
  });

  it('VALID_PRIMARY_USER_TYPES matches PRIMARY_USER_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_PRIMARY_USER_TYPES'), optionValues(PRIMARY_USER_OPTIONS));
  });

  it('VALID_PRIMARY_INDICATORS matches PRIMARY_INDICATOR_GROUPS', () => {
    expectSetsEqual(parsePythonSet('VALID_PRIMARY_INDICATORS'), flatGroupValues(PRIMARY_INDICATOR_GROUPS));
  });

  it('VALID_CGIAR_REGIONS matches CGIAR_REGION_OPTIONS', () => {
    expectSetsEqual(parsePythonSet('VALID_CGIAR_REGIONS'), optionValues(CGIAR_REGION_OPTIONS));
  });
});

// ---------------------------------------------------------------------------
// Field length limit tests
// ---------------------------------------------------------------------------

/** Build minimal valid form data for Zod parsing. */
function validFormBase(): Record<string, unknown> {
  return {
    studyId: 'TEST-001',
    studyTitle: 'Test Study',
    leadCenter: 'IFPRI',
    contactName: 'Test User',
    contactEmail: 'test@cgiar.org',
    otherCenters: ['CIP'],
    studyType: 'causal_impact',
    timing: 't0_ex_ante',
    analyticalScope: 'innovation_technology',
    geographicScope: 'global',
    resultLevel: 'impact',
    causalityMode: 'c0_descriptive',
    methodClass: 'qualitative',
    primaryIndicator: 'Innovation Use',
    studyIndicators: 'Indicator text',
    startDate: new Date('2025-01-01'),
    expectedEndDate: new Date('2025-12-31'),
    dataCollectionStatus: 'planned',
    analysisStatus: 'planned',
    funded: 'no',
    totalCostUSD: 10000,
    proposalAvailable: { answer: 'no' },
    manuscriptDeveloped: { answer: 'no' },
    policyBriefDeveloped: { answer: 'no' },
    relatedToPastStudy: { answer: 'no' },
    intendedPrimaryUser: ['iaes'],
    commissioningSource: 'CGIAR',
  };
}

describe('Contract sync: field length limits', () => {
  const limits: [string, string, number][] = [
    ['MAX_STUDY_ID', 'studyId', 50],
    ['MAX_STUDY_TITLE', 'studyTitle', 500],
    ['MAX_LEAD_CENTER', 'leadCenter', 200],
    ['MAX_CONTACT_NAME', 'contactName', 100],
    ['MAX_RESEARCH_QUESTIONS', 'keyResearchQuestions', 2000],
    ['MAX_STUDY_INDICATORS', 'studyIndicators', 2000],
    ['MAX_FUNDING_SOURCE', 'fundingSource', 200],
    ['MAX_COMMISSIONING_SOURCE', 'commissioningSource', 200],
    ['MAX_W3_BILATERAL', 'w3Bilateral', 500],
  ];

  for (const [pyConst, field, expectedMax] of limits) {
    it(`${pyConst} (${expectedMax}) matches Zod max on ${field}`, () => {
      const backendMax = parsePythonInt(pyConst);
      expect(backendMax).toBe(expectedMax);

      // Verify Zod rejects max+1 chars
      const tooLong = 'a'.repeat(backendMax + 1);
      const base = validFormBase();
      base[field] = tooLong;
      const result = studyFormSchema.safeParse(base);
      expect(result.success).toBe(false);

      // Verify Zod accepts exactly max chars
      const exactMax = 'a'.repeat(backendMax);
      base[field] = exactMax;
      const result2 = studyFormSchema.safeParse(base);
      // If it fails, it should NOT be because of this field's max length
      if (!result2.success) {
        const fieldErrors = result2.error.issues.filter(
          (i) => i.path[0] === field && i.message.toLowerCase().includes('less than')
        );
        expect(fieldErrors, `${field} at exactly ${backendMax} chars should not trigger max-length error`).toHaveLength(0);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Conditional logic tests
// ---------------------------------------------------------------------------

describe('Contract sync: Section C conditional logic', () => {
  it('SECTION_C_CAUSALITY_MODES matches shouldShowResearchDetails causality check', () => {
    const backendModes = parsePythonSet('SECTION_C_CAUSALITY_MODES');
    const allModes = optionValues(CAUSALITY_MODE_OPTIONS);

    for (const mode of allModes) {
      const showsBecauseOfCausality = shouldShowResearchDetails(mode, undefined);
      const backendSays = backendModes.has(mode);
      expect(showsBecauseOfCausality, `causality mode "${mode}"`).toBe(backendSays);
    }
  });

  it('SECTION_C_METHOD_CLASSES matches shouldShowResearchDetails method class check', () => {
    const backendClasses = parsePythonSet('SECTION_C_METHOD_CLASSES');
    const allClasses = optionValues(METHOD_CLASS_OPTIONS);

    for (const cls of allClasses) {
      const showsBecauseOfMethod = shouldShowResearchDetails(undefined, cls);
      const backendSays = backendClasses.has(cls);
      expect(showsBecauseOfMethod, `method class "${cls}"`).toBe(backendSays);
    }
  });
});
