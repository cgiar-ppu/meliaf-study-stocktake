/**
 * Canned API responses matching the shapes in src/lib/api.ts.
 * Used by page.route() in E2E tests — no real backend calls.
 */

export const MOCK_SUBMISSION_1 = {
  submissionId: 'sub-001',
  version: 1,
  status: 'active',
  userId: 'dev-user-001',
  modifiedBy: 'dev-user-001',
  createdAt: '2025-06-15T10:30:00Z',
  updatedAt: '2025-06-15T10:30:00Z',
  studyId: 'MELIAF-2025-001',
  studyTitle: 'Impact of Drought-Tolerant Maize in East Africa',
  leadCenter: 'CIMMYT',
  contactName: 'Jane Smith',
  contactEmail: 'j.smith@cgiar.org',
  otherCenters: ['IITA', 'ILRI'],
  w3Bilateral: '',
  studyType: 'causal_impact',
  timing: 't2_endline',
  analyticalScope: 'project_intervention',
  geographicScope: 'national',
  studyRegions: ['ESA'],
  studyCountries: ['KE', 'TZ'],
  studySubnational: [],
  resultLevel: 'impact',
  causalityMode: 'c2_causal',
  methodClass: 'experimental_quasi',
  primaryIndicator: 'Poverty Reduction, Livelihoods and Jobs',
  studyIndicators: 'Yield improvement, income change, food security score',
  keyResearchQuestions: 'What is the causal impact of drought-tolerant maize adoption on smallholder income?',
  unitOfAnalysis: ['household'],
  treatmentIntervention: 'Drought-tolerant maize variety adoption',
  sampleSize: 2500,
  powerCalculation: 'yes',
  dataCollectionMethods: ['surveys'],
  preAnalysisPlan: { answer: 'yes', link: 'https://example.com/pap' },
  dataCollectionRounds: 3,
  startDate: '2024-01-15',
  expectedEndDate: '2026-12-31',
  dataCollectionStatus: 'ongoing',
  analysisStatus: 'planned',
  funded: 'yes',
  fundingSource: 'BMGF',
  totalCostUSD: 450000,
  proposalAvailable: { answer: 'yes', link: 'https://example.com/proposal' },
  manuscriptDeveloped: { answer: 'no' },
  policyBriefDeveloped: { answer: 'no' },
  relatedToPastStudy: { answer: 'no' },
  intendedPrimaryUser: ['program', 'donor'],
  commissioningSource: 'BMGF',
};

export const MOCK_SUBMISSION_2 = {
  submissionId: 'sub-002',
  version: 1,
  status: 'active',
  userId: 'dev-user-001',
  modifiedBy: 'dev-user-001',
  createdAt: '2025-07-20T14:00:00Z',
  updatedAt: '2025-07-20T14:00:00Z',
  studyId: 'MELIAF-2025-002',
  studyTitle: 'Scaling Readiness Assessment for Climate-Smart Agriculture',
  leadCenter: 'IRRI',
  contactName: 'John Doe',
  contactEmail: 'j.doe@cgiar.org',
  otherCenters: ['CIP'],
  w3Bilateral: '',
  studyType: 'scaling_readiness',
  timing: 't1_during',
  analyticalScope: 'innovation_technology',
  geographicScope: 'regional',
  studyRegions: ['SA'],
  studyCountries: [],
  studySubnational: [],
  resultLevel: 'outcome',
  causalityMode: 'c1_contribution',
  methodClass: 'mixed',
  primaryIndicator: 'Innovation Use',
  studyIndicators: 'Readiness score, partner engagement index',
  startDate: '2025-03-01',
  expectedEndDate: '2025-12-31',
  dataCollectionStatus: 'complete',
  analysisStatus: 'ongoing',
  funded: 'partial',
  fundingSource: 'W3 pooled',
  totalCostUSD: 120000,
  proposalAvailable: { answer: 'no' },
  manuscriptDeveloped: { answer: 'no' },
  policyBriefDeveloped: { answer: 'no' },
  relatedToPastStudy: { answer: 'no' },
  intendedPrimaryUser: ['iaes', 'researchers'],
  commissioningSource: 'System Council',
};

export const MOCK_ARCHIVED_SUBMISSION = {
  ...MOCK_SUBMISSION_1,
  submissionId: 'sub-003',
  version: 2,
  status: 'archived',
  studyId: 'MELIAF-2024-010',
  studyTitle: 'Archived Foresight Study',
  studyType: 'foresight_futures',
  createdAt: '2024-11-01T08:00:00Z',
  updatedAt: '2025-01-10T12:00:00Z',
};

// --- List responses ---

export const ACTIVE_SUBMISSIONS_RESPONSE = {
  submissions: [MOCK_SUBMISSION_1, MOCK_SUBMISSION_2],
  count: 2,
};

export const ARCHIVED_SUBMISSIONS_RESPONSE = {
  submissions: [MOCK_ARCHIVED_SUBMISSION],
  count: 1,
};

export const ALL_SUBMISSIONS_RESPONSE = {
  submissions: [MOCK_SUBMISSION_1, MOCK_SUBMISSION_2],
  count: 2,
};

// --- Mutation responses ---

export const CREATE_RESPONSE = {
  submissionId: 'sub-new-001',
  version: 1,
  message: 'Submission created successfully',
};

export const UPDATE_RESPONSE = {
  submissionId: 'sub-001',
  version: 2,
  message: 'Submission updated successfully',
};

export const DELETE_RESPONSE = {
  submissionId: 'sub-001',
  version: 2,
  message: 'Submission archived successfully',
};

export const RESTORE_RESPONSE = {
  submissionId: 'sub-003',
  version: 3,
  message: 'Submission restored successfully',
};

// --- History response ---

export const HISTORY_RESPONSE_ACTIVE = {
  submissionId: 'sub-001',
  versions: [MOCK_SUBMISSION_1],
  count: 1,
};

export const HISTORY_RESPONSE_ARCHIVED = {
  submissionId: 'sub-003',
  versions: [MOCK_ARCHIVED_SUBMISSION],
  count: 1,
};
