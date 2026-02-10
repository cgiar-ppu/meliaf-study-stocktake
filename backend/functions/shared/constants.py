"""Enum value sets and field constraints mirroring src/types/index.ts."""

VALID_STUDY_TYPES = {
    "ex_ante_impact", "foresight_futures", "process_performance",
    "causal_impact", "adoption_diffusion", "scaling_readiness",
    "scaling_policy_tracing", "institutional_policy_change",
    "synthesis_strategic_learning", "meliaf_method",
}

VALID_TIMINGS = {"t0_ex_ante", "t1_during", "t2_endline", "t3_ex_post"}

VALID_ANALYTICAL_SCOPES = {
    "innovation_technology", "project_intervention",
    "program_accelerator", "portfolio_system",
}

VALID_GEOGRAPHIC_SCOPES = {
    "global", "regional", "national", "sub_national", "site_specific",
}

VALID_RESULT_LEVELS = {"output", "outcome", "impact"}

VALID_CAUSALITY_MODES = {"c0_descriptive", "c1_contribution", "c2_causal"}

VALID_METHOD_CLASSES = {
    "qualitative", "quantitative", "mixed", "experimental_quasi",
    "modeling_simulation", "observational", "evidence_synthesis", "participatory",
}

VALID_STATUS_TYPES = {"planned", "ongoing", "complete"}

VALID_FUNDED_TYPES = {"yes", "no", "partial"}

VALID_YES_NO_NA = {"yes", "no", "na"}

VALID_PRIMARY_USER_TYPES = {
    "iaes", "program", "donor", "board", "comms",
    "policy_makers", "researchers", "other",
}

VALID_PRIMARY_INDICATORS = {
    "Poverty Reduction, Livelihoods and Jobs",
    "Nutrition, Health and Food Security",
    "Gender Equality, Youth and Social Inclusion",
    "Climate Adaptation and Mitigation",
    "Environmental Health and Biodiversity",
    "Innovation Use", "Policy Change", "Other Outcome",
    "Innovation Development", "Capacity Sharing", "Knowledge Products",
    "Other Output",
}

VALID_SUBMISSION_STATUSES = {"active", "superseded", "archived"}

# Section C is required when causalityMode or methodClass match these
SECTION_C_CAUSALITY_MODES = {"c2_causal"}
SECTION_C_METHOD_CLASSES = {"quantitative", "experimental_quasi"}

# Field length limits (matching Zod schema in src/lib/formSchema.ts)
MAX_STUDY_ID = 50
MAX_STUDY_TITLE = 500
MAX_LEAD_CENTER = 200
MAX_CONTACT_NAME = 100
MAX_RESEARCH_QUESTIONS = 2000
MAX_STUDY_INDICATORS = 2000
MAX_FUNDING_SOURCE = 200
MAX_COMMISSIONING_SOURCE = 200
