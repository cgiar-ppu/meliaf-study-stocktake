import { describe, it, expect } from 'vitest';
import { studyFormSchema, shouldShowResearchDetails } from './formSchema';

// ---------------------------------------------------------------------------
// Helpers — build a valid base input so we can override individual fields
// ---------------------------------------------------------------------------
function validInput(overrides: Record<string, unknown> = {}) {
  return {
    studyId: 'S001',
    studyTitle: 'Test Study',
    leadCenter: 'CIAT',
    contactName: 'Jane Doe',
    contactEmail: 'jane@cgiar.org',
    otherCenters: ['IFPRI'],
    studyType: 'causal_impact',
    timing: 't2_endline',
    analyticalScope: 'project_intervention',
    geographicScope: 'national',
    resultLevel: 'outcome',
    causalityMode: 'c2_causal',
    methodClass: 'quantitative',
    primaryIndicator: 'Innovation Use',
    studyIndicators: 'Yield improvement',
    startDate: new Date('2025-01-01'),
    expectedEndDate: new Date('2025-12-31'),
    dataCollectionStatus: 'ongoing',
    analysisStatus: 'planned',
    funded: 'yes',
    fundingSource: 'BMGF',
    totalCostUSD: 50000,
    proposalAvailable: { answer: 'no' },
    manuscriptDeveloped: { answer: 'no' },
    policyBriefDeveloped: { answer: 'no' },
    relatedToPastStudy: { answer: 'no' },
    intendedPrimaryUser: ['program'],
    commissioningSource: 'IAES',
    ...overrides,
  };
}

function parseErrors(input: Record<string, unknown>) {
  const result = studyFormSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues;
}

function fieldError(input: Record<string, unknown>, path: string) {
  return parseErrors(input).find(
    (i) => i.path.join('.') === path,
  );
}

// ---------------------------------------------------------------------------
// Sanity: valid input passes
// ---------------------------------------------------------------------------
describe('studyFormSchema — valid baseline', () => {
  it('accepts a fully valid input', () => {
    const result = studyFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Section A — field constraints
// ---------------------------------------------------------------------------
describe('Section A — Basic Information', () => {
  it('rejects empty studyId', () => {
    expect(fieldError(validInput({ studyId: '' }), 'studyId')).toBeDefined();
  });

  it('rejects studyId > 50 chars', () => {
    expect(fieldError(validInput({ studyId: 'x'.repeat(51) }), 'studyId')).toBeDefined();
  });

  it('rejects empty studyTitle', () => {
    expect(fieldError(validInput({ studyTitle: '' }), 'studyTitle')).toBeDefined();
  });

  it('rejects studyTitle > 500 chars', () => {
    expect(fieldError(validInput({ studyTitle: 'x'.repeat(501) }), 'studyTitle')).toBeDefined();
  });

  it('rejects empty leadCenter', () => {
    expect(fieldError(validInput({ leadCenter: '' }), 'leadCenter')).toBeDefined();
  });

  it('rejects leadCenter > 200 chars', () => {
    expect(fieldError(validInput({ leadCenter: 'x'.repeat(201) }), 'leadCenter')).toBeDefined();
  });

  it('rejects empty contactEmail', () => {
    expect(fieldError(validInput({ contactEmail: '' }), 'contactEmail')).toBeDefined();
  });

  it('rejects invalid contactEmail', () => {
    expect(fieldError(validInput({ contactEmail: 'not-an-email' }), 'contactEmail')).toBeDefined();
  });

  it('rejects contactEmail > 255 chars', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    expect(fieldError(validInput({ contactEmail: longEmail }), 'contactEmail')).toBeDefined();
  });

  it('rejects empty otherCenters array', () => {
    expect(fieldError(validInput({ otherCenters: [] }), 'otherCenters')).toBeDefined();
  });

  it('accepts otherCenters with at least 1 element', () => {
    expect(fieldError(validInput({ otherCenters: ['IRRI'] }), 'otherCenters')).toBeUndefined();
  });

  it('accepts optional w3Bilateral', () => {
    const result = studyFormSchema.safeParse(validInput({ w3Bilateral: undefined }));
    expect(result.success).toBe(true);
  });

  it('rejects w3Bilateral > 500 chars', () => {
    expect(fieldError(validInput({ w3Bilateral: 'x'.repeat(501) }), 'w3Bilateral')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Section B — enum validation
// ---------------------------------------------------------------------------
describe('Section B — enum fields', () => {
  const enumFields = [
    { name: 'studyType', valid: 'ex_ante_impact' },
    { name: 'timing', valid: 't0_ex_ante' },
    { name: 'analyticalScope', valid: 'portfolio_system' },
    { name: 'geographicScope', valid: 'global' },
    { name: 'resultLevel', valid: 'impact' },
    { name: 'causalityMode', valid: 'c0_descriptive' },
    { name: 'methodClass', valid: 'qualitative' },
    { name: 'primaryIndicator', valid: 'Policy Change' },
  ];

  for (const { name, valid } of enumFields) {
    it(`accepts valid ${name} value "${valid}"`, () => {
      expect(fieldError(validInput({ [name]: valid }), name)).toBeUndefined();
    });

    it(`rejects invalid ${name} value`, () => {
      expect(fieldError(validInput({ [name]: 'INVALID_ENUM' }), name)).toBeDefined();
    });
  }

  it('defaults studyRegions to []', () => {
    const result = studyFormSchema.safeParse(validInput({ studyRegions: undefined }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.studyRegions).toEqual([]);
  });

  it('defaults studyCountries to []', () => {
    const result = studyFormSchema.safeParse(validInput({ studyCountries: undefined }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.studyCountries).toEqual([]);
  });

  it('defaults studySubnational to []', () => {
    const result = studyFormSchema.safeParse(validInput({ studySubnational: undefined }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.studySubnational).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Section C — optional numeric fields
// ---------------------------------------------------------------------------
describe('Section C — optional fields', () => {
  it('accepts positive sampleSize', () => {
    expect(fieldError(validInput({ sampleSize: 100 }), 'sampleSize')).toBeUndefined();
  });

  it('accepts empty string sampleSize', () => {
    expect(fieldError(validInput({ sampleSize: '' }), 'sampleSize')).toBeUndefined();
  });

  it('rejects negative sampleSize', () => {
    expect(fieldError(validInput({ sampleSize: -5 }), 'sampleSize')).toBeDefined();
  });

  it('rejects zero sampleSize', () => {
    expect(fieldError(validInput({ sampleSize: 0 }), 'sampleSize')).toBeDefined();
  });

  it('accepts positive dataCollectionRounds', () => {
    expect(fieldError(validInput({ dataCollectionRounds: 3 }), 'dataCollectionRounds')).toBeUndefined();
  });

  it('accepts empty string dataCollectionRounds', () => {
    expect(fieldError(validInput({ dataCollectionRounds: '' }), 'dataCollectionRounds')).toBeUndefined();
  });

  it('rejects negative dataCollectionRounds', () => {
    expect(fieldError(validInput({ dataCollectionRounds: -1 }), 'dataCollectionRounds')).toBeDefined();
  });

  it('requires studyIndicators (min 1 char)', () => {
    expect(fieldError(validInput({ studyIndicators: '' }), 'studyIndicators')).toBeDefined();
  });

  it('rejects studyIndicators > 2000 chars', () => {
    expect(fieldError(validInput({ studyIndicators: 'x'.repeat(2001) }), 'studyIndicators')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Section D — cross-field date validation
// ---------------------------------------------------------------------------
describe('Section D — date validation', () => {
  it('accepts endDate >= startDate', () => {
    const result = studyFormSchema.safeParse(
      validInput({
        startDate: new Date('2025-01-01'),
        expectedEndDate: new Date('2025-06-01'),
      }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts same start and end date', () => {
    const d = new Date('2025-06-01');
    const result = studyFormSchema.safeParse(
      validInput({ startDate: d, expectedEndDate: d }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects endDate < startDate', () => {
    const issues = parseErrors(
      validInput({
        startDate: new Date('2025-06-01'),
        expectedEndDate: new Date('2025-01-01'),
      }),
    );
    const dateIssue = issues.find((i) => i.path.join('.') === 'expectedEndDate');
    expect(dateIssue).toBeDefined();
    expect(dateIssue?.message).toBe('End date must be after start date');
  });
});

// ---------------------------------------------------------------------------
// Section E — conditional funding source
// ---------------------------------------------------------------------------
describe('Section E — funding source validation', () => {
  it('requires fundingSource when funded=yes', () => {
    const err = fieldError(
      validInput({ funded: 'yes', fundingSource: '' }),
      'fundingSource',
    );
    expect(err).toBeDefined();
  });

  it('requires fundingSource when funded=partial', () => {
    const err = fieldError(
      validInput({ funded: 'partial', fundingSource: '' }),
      'fundingSource',
    );
    expect(err).toBeDefined();
  });

  it('does not require fundingSource when funded=no', () => {
    const result = studyFormSchema.safeParse(
      validInput({ funded: 'no', fundingSource: '' }),
    );
    expect(result.success).toBe(true);
  });

  it('passes when funded=yes with fundingSource', () => {
    const result = studyFormSchema.safeParse(
      validInput({ funded: 'yes', fundingSource: 'BMGF' }),
    );
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// yesNoWithRequiredLink schema (tested via proposalAvailable)
// ---------------------------------------------------------------------------
describe('yesNoWithRequiredLink — via proposalAvailable', () => {
  it('fails when answer=yes and no link', () => {
    const err = fieldError(
      validInput({ proposalAvailable: { answer: 'yes' } }),
      'proposalAvailable.link',
    );
    expect(err).toBeDefined();
    expect(err?.message).toContain('Link is required');
  });

  it('fails when answer=yes with invalid URL', () => {
    const err = fieldError(
      validInput({ proposalAvailable: { answer: 'yes', link: 'not-a-url' } }),
      'proposalAvailable.link',
    );
    expect(err).toBeDefined();
    expect(err?.message).toContain('valid URL');
  });

  it('passes when answer=yes with valid URL', () => {
    const result = studyFormSchema.safeParse(
      validInput({
        proposalAvailable: { answer: 'yes', link: 'https://example.com/proposal.pdf' },
      }),
    );
    expect(result.success).toBe(true);
  });

  it('passes when answer=no without link', () => {
    const result = studyFormSchema.safeParse(
      validInput({ proposalAvailable: { answer: 'no' } }),
    );
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// shouldShowResearchDetails()
// ---------------------------------------------------------------------------
describe('shouldShowResearchDetails()', () => {
  it('returns true when causalityMode is c2_causal', () => {
    expect(shouldShowResearchDetails('c2_causal', 'qualitative')).toBe(true);
  });

  it('returns true when methodClass is quantitative', () => {
    expect(shouldShowResearchDetails('c0_descriptive', 'quantitative')).toBe(true);
  });

  it('returns true when methodClass is experimental_quasi', () => {
    expect(shouldShowResearchDetails('c0_descriptive', 'experimental_quasi')).toBe(true);
  });

  it('returns false for descriptive + qualitative', () => {
    expect(shouldShowResearchDetails('c0_descriptive', 'qualitative')).toBe(false);
  });

  it('returns false when both undefined', () => {
    expect(shouldShowResearchDetails(undefined, undefined)).toBe(false);
  });

  it('returns true when causalityMode is c2_causal regardless of methodClass', () => {
    expect(shouldShowResearchDetails('c2_causal', undefined)).toBe(true);
  });

  it('returns false for mixed method without causal', () => {
    expect(shouldShowResearchDetails('c1_contribution', 'mixed')).toBe(false);
  });
});
