import { z } from 'zod';

// Reusable schema for Yes/No with optional link
const yesNoWithLinkSchema = z.object({
  answer: z.enum(['yes', 'no']),
  link: z.string().url().optional().or(z.literal('')),
});

// Form validation schema
export const studyFormSchema = z.object({
  // Section A - Basic Information (Mandatory)
  studyId: z.string().trim().min(1, 'Study ID is required').max(50, 'Study ID must be less than 50 characters'),
  studyTitle: z.string().trim().min(1, 'Study title is required').max(500, 'Title must be less than 500 characters'),
  leadCenter: z.string().trim().min(1, 'Lead center is required').max(200, 'Lead center must be less than 200 characters'),
  contactName: z.string().trim().min(1, 'Contact name is required').max(100, 'Name must be less than 100 characters'),
  contactEmail: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  otherCenters: z.array(z.string()).min(1, 'At least one other center is required'),

  // Section B - Study Classification (Mandatory)
  studyType: z.enum([
    'ex_ante_impact',
    'foresight_futures',
    'baseline',
    'monitoring',
    'process_evaluation',
    'outcome_evaluation',
    'impact_evaluation',
    'synthesis_review',
    'meta_analysis',
    'other',
  ], { required_error: 'Study type is required' }),
  timing: z.enum(['t0_ex_ante', 't1_during', 't2_endline', 't3_ex_post'], { required_error: 'Timing is required' }),
  analyticalScope: z.enum([
    'innovation_technology',
    'project_intervention',
    'program_accelerator',
    'portfolio_system',
  ], { required_error: 'Analytical scope is required' }),
  geographicScope: z.enum([
    'global',
    'regional',
    'national',
    'sub_national',
    'site_specific',
  ], { required_error: 'Geographic scope is required' }),
  resultLevel: z.enum(['output', 'outcome', 'impact'], { required_error: 'Result level is required' }),
  causalityMode: z.enum(['c0_descriptive', 'c1_contribution', 'c2_causal'], { required_error: 'Causality mode is required' }),
  methodClass: z.enum([
    'qualitative',
    'quantitative',
    'mixed',
    'experimental',
    'quasi_experimental',
    'modeling',
    'simulation',
    'other',
  ], { required_error: 'Method class is required' }),
  primaryIndicator: z.string().trim().max(500, 'Indicator must be less than 500 characters').optional(),

  // Section C - Research Details (Conditional)
  keyResearchQuestions: z.string().trim().max(2000, 'Research questions must be less than 2000 characters').optional(),
  unitOfAnalysis: z.string().trim().max(200, 'Unit of analysis must be less than 200 characters').optional(),
  treatmentIntervention: z.string().trim().max(500, 'Treatment must be less than 500 characters').optional(),
  sampleSize: z.number().int().positive().optional().or(z.literal('')),
  powerCalculation: z.enum(['yes', 'no', 'na']).optional(),
  dataCollectionMethods: z.array(z.string()).default([]),
  studyIndicators: z.string().trim().max(2000, 'Indicators must be less than 2000 characters').optional(),
  preAnalysisPlan: yesNoWithLinkSchema.optional(),
  dataCollectionRounds: z.number().int().positive().optional().or(z.literal('')),

  // Section D - Timeline & Status (Mandatory)
  startDate: z.date({ required_error: 'Start date is required' }),
  expectedEndDate: z.date({ required_error: 'Expected end date is required' }),
  dataCollectionStatus: z.enum(['planned', 'ongoing', 'complete'], { required_error: 'Data collection status is required' }),
  analysisStatus: z.enum(['planned', 'ongoing', 'complete'], { required_error: 'Analysis status is required' }),

  // Section E - Funding & Resources
  funded: z.enum(['yes', 'no', 'partial']).optional(),
  fundingSource: z.string().trim().max(200, 'Funding source must be less than 200 characters').optional(),
  totalCostUSD: z.number().positive().optional().or(z.literal('')),
  proposalAvailable: yesNoWithLinkSchema.optional(),

  // Section F - Outputs & Users
  manuscriptDeveloped: yesNoWithLinkSchema.optional(),
  policyBriefDeveloped: yesNoWithLinkSchema.optional(),
  relatedToPastStudy: yesNoWithLinkSchema.optional(),
  intendedPrimaryUser: z.array(z.enum([
    'iaes',
    'program',
    'donor',
    'board',
    'comms',
    'policy_makers',
    'researchers',
    'other',
  ])).default([]),
  commissioningSource: z.string().trim().max(200, 'Commissioning source must be less than 200 characters').optional(),
}).refine((data) => {
  // Validate end date is after start date
  if (data.startDate && data.expectedEndDate) {
    return data.expectedEndDate >= data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['expectedEndDate'],
});

export type StudyFormData = z.infer<typeof studyFormSchema>;

// Default form values
export const defaultFormValues: Partial<StudyFormData> = {
  studyId: '',
  studyTitle: '',
  leadCenter: '',
  contactName: '',
  contactEmail: '',
  otherCenters: [],
  primaryIndicator: '',
  keyResearchQuestions: '',
  unitOfAnalysis: '',
  treatmentIntervention: '',
  studyIndicators: '',
  dataCollectionMethods: [],
  fundingSource: '',
  commissioningSource: '',
  intendedPrimaryUser: [],
};

// Helper to check if Section C should be visible
export function shouldShowResearchDetails(causalityMode?: string, methodClass?: string): boolean {
  const isCausal = causalityMode === 'c2_causal';
  const isQuantitative = methodClass === 'quantitative' || methodClass === 'experimental' || methodClass === 'quasi_experimental';
  return isCausal || isQuantitative;
}
