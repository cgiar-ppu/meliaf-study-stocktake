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
  | 'process_performance'
  | 'causal_impact'
  | 'adoption_diffusion'
  | 'scaling_readiness'
  | 'scaling_policy_tracing'
  | 'institutional_policy_change'
  | 'synthesis_strategic_learning'
  | 'meliaf_method';

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
export const STUDY_TYPE_OPTIONS: { value: StudyType; label: string; description: string }[] = [
  { 
    value: 'ex_ante_impact', 
    label: 'Ex-ante Impact Assessment',
    description: 'Explores expected results (e.g. benefits and costs) stemming from alternative interventions typically compared against a business as usual scenario.'
  },
  { 
    value: 'foresight_futures', 
    label: 'Foresight & Futures Analysis',
    description: 'Explores implications of plausible long-term system futures to inform strategy, priority-setting, and risk-aware decision-making under uncertainty.'
  },
  { 
    value: 'process_performance', 
    label: 'Process & Performance Evaluation',
    description: 'Assesses how well an intervention (ranging from single innovations/approaches to more complex programs) is implemented and whether it is delivering results as planned, focusing on effectiveness, efficiency, and quality of delivery.'
  },
  { 
    value: 'causal_impact', 
    label: 'Causal Impact Evaluation',
    description: 'Uses counterfactual methods to determine whether observed outcome or impact changes can be attributed to the intervention. Includes studies conducted at earlier or mature stages of the intervention (e.g. pre or post scale up).'
  },
  { 
    value: 'adoption_diffusion', 
    label: 'Adoption & Diffusion Study',
    description: 'Examines whether, where, how, and by whom innovations are taken up, used, adapted, or rejected by intended users. This includes studies that measure adoption as well as those that attempt to understand factors explaining those patterns.'
  },
  { 
    value: 'scaling_readiness', 
    label: 'Scaling Readiness Assessment',
    description: 'Assesses whether an innovation is sufficiently mature and enabled for scaling, identifying bottlenecks, risks, and priority actions for scale-up.'
  },
  { 
    value: 'scaling_policy_tracing', 
    label: 'Scaling & Policy Tracing Study',
    description: 'Tracks how innovations, evidence, or policy advice move through next user/boundary partner institutions and systems to support scaling and long-term impact pathways.'
  },
  { 
    value: 'institutional_policy_change', 
    label: 'Institutional & Policy Change Study',
    description: 'Analyzes changes in decisions, rules, behaviors, investments, or norms among end user institutions and policy actors influenced by the intervention.'
  },
  { 
    value: 'synthesis_strategic_learning', 
    label: 'Synthesis & Strategic Learning Study',
    description: "Integrates evidence from multiple sources to identify system-level patterns, lessons, and strategic implications across projects, programs, or portfolios. In this case 'learning' is meant to capture learning from M, E, IA and F studies, and not more general learning that is fundamental to everything the CGIAR does. Includes ROI/VfM studies."
  },
  { 
    value: 'meliaf_method', 
    label: 'MELIAF Method Study',
    description: 'Development and testing of MELIAF methods (indicators, protocols etc).'
  },
];

export const TIMING_OPTIONS: { value: TimingType; label: string; description: string }[] = [
  { value: 't0_ex_ante', label: 'T0', description: 'Ex-Ante (before)' },
  { value: 't1_during', label: 'T1', description: 'During implementation/development (for innov/tech/policy option)' },
  { value: 't2_endline', label: 'T2', description: 'Endline/immediate post' },
  { value: 't3_ex_post', label: 'T3', description: 'Ex-post/lagged' },
];

export const ANALYTICAL_SCOPE_OPTIONS: { value: AnalyticalScopeType; label: string }[] = [
  { value: 'innovation_technology', label: 'Innovation / Technology / Policy Option' },
  { value: 'project_intervention', label: 'Project / Intervention / Bundle / Package' },
  { value: 'program_accelerator', label: 'Program / Accelerator / Theme / Center / Function' },
  { value: 'portfolio_system', label: 'Portfolio / System / Network' },
];

export const GEOGRAPHIC_SCOPE_OPTIONS: { value: GeographicScopeType; label: string; description?: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
  { value: 'sub_national', label: 'Sub-national', description: '(national minus 1)' },
  { value: 'site_specific', label: 'Site-specific', description: '(landscapes/catchments/communities etc)' },
];

export const RESULT_LEVEL_OPTIONS: { value: ResultLevelType; label: string; description: string }[] = [
  { 
    value: 'output', 
    label: 'Output',
    description: 'Knowledge, technical or institutional advancement produced by CGIAR research, engagement and/or capacity development activities'
  },
  { 
    value: 'outcome', 
    label: 'Outcome',
    description: 'A change in knowledge, skills, attitudes, or relationships, manifested as a change in behaviour, to which research outputs and related activities have contributed. CGIAR categorizes outcomes as related to innovation use, policy changes, or others.'
  },
  { 
    value: 'impact', 
    label: 'Impact',
    description: 'A durable change in the condition of people and their environment brought about by a chain of events or change in how a system functions, to which research, innovations, and related activities have contributed.'
  },
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
