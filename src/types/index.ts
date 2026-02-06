// User and Auth types - prepared for AWS Cognito integration
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Study submission types matching DynamoDB schema
export interface StudySubmission {
  // Partition key
  pk: string; // USER#<userId>
  // Sort key
  sk: string; // STUDY#<studyId>#v<version>
  
  // Section A - Basic Information
  studyId: string;
  studyTitle: string;
  leadCenter: string;
  contactName: string;
  contactEmail: string;
  otherCenters: string[];
  
  // Section B - Study Classification
  studyType: StudyType;
  timing: TimingType;
  analyticalScope: AnalyticalScopeType;
  geographicScope: GeographicScopeType;
  resultLevel: ResultLevelType;
  causalityMode: CausalityModeType;
  methodClass: MethodClassType;
  primaryIndicator: string;
  
  // Section C - Research Details (Conditional)
  keyResearchQuestions?: string;
  unitOfAnalysis?: string;
  treatmentIntervention?: string;
  sampleSize?: number;
  powerCalculation?: YesNoNA;
  dataCollectionMethods?: string[];
  studyIndicators?: string;
  preAnalysisPlan?: YesNoWithLink;
  dataCollectionRounds?: number;
  
  // Section D - Timeline & Status
  startDate: string;
  expectedEndDate: string;
  dataCollectionStatus: StatusType;
  analysisStatus: StatusType;
  
  // Section E - Funding & Resources
  funded?: FundedType;
  fundingSource?: string;
  totalCostUSD?: number;
  proposalAvailable?: YesNoWithLink;
  
  // Section F - Outputs & Users
  manuscriptDeveloped?: YesNoWithLink;
  policyBriefDeveloped?: YesNoWithLink;
  relatedToPastStudy?: YesNoWithLink;
  intendedPrimaryUser?: PrimaryUserType[];
  commissioningSource?: string;
  
  // Metadata
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Enums and option types
export type StudyType = 
  | 'ex_ante_impact'
  | 'foresight_futures'
  | 'baseline'
  | 'monitoring'
  | 'process_evaluation'
  | 'outcome_evaluation'
  | 'impact_evaluation'
  | 'synthesis_review'
  | 'meta_analysis'
  | 'other';

export type TimingType = 't0_ex_ante' | 't1_during' | 't2_endline' | 't3_ex_post';

export type AnalyticalScopeType = 
  | 'innovation_technology'
  | 'project_intervention'
  | 'program_accelerator'
  | 'portfolio_system';

export type GeographicScopeType = 
  | 'global'
  | 'regional'
  | 'national'
  | 'sub_national'
  | 'site_specific';

export type ResultLevelType = 'output' | 'outcome' | 'impact';

export type CausalityModeType = 'c0_descriptive' | 'c1_contribution' | 'c2_causal';

export type MethodClassType = 
  | 'qualitative'
  | 'quantitative'
  | 'mixed'
  | 'experimental'
  | 'quasi_experimental'
  | 'modeling'
  | 'simulation'
  | 'other';

export type StatusType = 'planned' | 'ongoing' | 'complete';

export type FundedType = 'yes' | 'no' | 'partial';

export type YesNoNA = 'yes' | 'no' | 'na';

export interface YesNoWithLink {
  answer: 'yes' | 'no';
  link?: string;
}

export type PrimaryUserType = 
  | 'iaes'
  | 'program'
  | 'donor'
  | 'board'
  | 'comms'
  | 'policy_makers'
  | 'researchers'
  | 'other';

export type SubmissionStatus = 'draft' | 'active' | 'archived';

// Form field options for dropdowns
export const STUDY_TYPE_OPTIONS: { value: StudyType; label: string }[] = [
  { value: 'ex_ante_impact', label: 'Ex-ante Impact Assessment' },
  { value: 'foresight_futures', label: 'Foresight & Futures Analysis' },
  { value: 'baseline', label: 'Baseline Study' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'process_evaluation', label: 'Process Evaluation' },
  { value: 'outcome_evaluation', label: 'Outcome Evaluation' },
  { value: 'impact_evaluation', label: 'Impact Evaluation' },
  { value: 'synthesis_review', label: 'Synthesis/Systematic Review' },
  { value: 'meta_analysis', label: 'Meta-Analysis' },
  { value: 'other', label: 'Other' },
];

export const TIMING_OPTIONS: { value: TimingType; label: string }[] = [
  { value: 't0_ex_ante', label: 'T0: Ex-Ante' },
  { value: 't1_during', label: 'T1: During Implementation' },
  { value: 't2_endline', label: 'T2: Endline' },
  { value: 't3_ex_post', label: 'T3: Ex-Post' },
];

export const ANALYTICAL_SCOPE_OPTIONS: { value: AnalyticalScopeType; label: string }[] = [
  { value: 'innovation_technology', label: 'Innovation/Technology' },
  { value: 'project_intervention', label: 'Project/Intervention' },
  { value: 'program_accelerator', label: 'Program/Accelerator' },
  { value: 'portfolio_system', label: 'Portfolio/System' },
];

export const GEOGRAPHIC_SCOPE_OPTIONS: { value: GeographicScopeType; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
  { value: 'sub_national', label: 'Sub-national' },
  { value: 'site_specific', label: 'Site-specific' },
];

export const RESULT_LEVEL_OPTIONS: { value: ResultLevelType; label: string }[] = [
  { value: 'output', label: 'Output' },
  { value: 'outcome', label: 'Outcome' },
  { value: 'impact', label: 'Impact' },
];

export const CAUSALITY_MODE_OPTIONS: { value: CausalityModeType; label: string }[] = [
  { value: 'c0_descriptive', label: 'C0: Descriptive' },
  { value: 'c1_contribution', label: 'C1: Contribution' },
  { value: 'c2_causal', label: 'C2: Causal' },
];

export const METHOD_CLASS_OPTIONS: { value: MethodClassType; label: string }[] = [
  { value: 'qualitative', label: 'Qualitative' },
  { value: 'quantitative', label: 'Quantitative' },
  { value: 'mixed', label: 'Mixed Methods' },
  { value: 'experimental', label: 'Experimental (RCT)' },
  { value: 'quasi_experimental', label: 'Quasi-Experimental' },
  { value: 'modeling', label: 'Modeling' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'other', label: 'Other' },
];

export const STATUS_OPTIONS: { value: StatusType; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'complete', label: 'Complete' },
];

export const FUNDED_OPTIONS: { value: FundedType; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'partial', label: 'Partial' },
];

export const YES_NO_NA_OPTIONS: { value: YesNoNA; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'na', label: 'N/A' },
];

export const PRIMARY_USER_OPTIONS: { value: PrimaryUserType; label: string }[] = [
  { value: 'iaes', label: 'IAES' },
  { value: 'program', label: 'Program' },
  { value: 'donor', label: 'Donor' },
  { value: 'board', label: 'Board' },
  { value: 'comms', label: 'Communications' },
  { value: 'policy_makers', label: 'Policy Makers' },
  { value: 'researchers', label: 'Researchers' },
  { value: 'other', label: 'Other' },
];
