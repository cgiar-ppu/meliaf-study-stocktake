# Study Form Data Model

Complete reference for the MELIAF study submission form. The form schema is defined in `src/lib/formSchema.ts` (Zod) with server-side validation mirrored in `backend/functions/shared/validator.py`.

## Section A — Basic Information

All fields mandatory.

| Field | Type | Max Length | Notes |
|-------|------|-----------|-------|
| `studyId` | string | 50 | Unique identifier |
| `studyTitle` | string | 500 | Study name |
| `leadCenter` | enum (string) | 200 | CGIAR center — see [Lead Centers](#lead-centers) |
| `w3Bilateral` | string | 500 | Optional — W3/Bilateral project reference |
| `contactName` | string | 100 | Contact person |
| `contactEmail` | string (email) | 255 | Validated email |
| `otherCenters` | string[] | min 1 | Multi-select array |

## Section B — Study Classification

All fields mandatory except geographic fields which are conditional on `geographicScope`.

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `studyType` | enum | 10 types | See [Study Types](#study-types) |
| `timing` | enum | 4 options | T0/T1/T2/T3 |
| `analyticalScope` | enum | 4 scopes | Innovation → Portfolio |
| `geographicScope` | enum | 5 scopes | Controls field visibility — see [Geographic Cascading](#geographic-scope-cascading) |
| `studyRegions` | string[] | Region codes | Conditional — see below |
| `studyCountries` | string[] | ISO 3166-1 alpha-2 | Conditional — see below |
| `studySubnational` | string[] | ISO 3166-2 codes | Conditional — see below |
| `resultLevel` | enum | 3 levels | Output / Outcome / Impact |
| `causalityMode` | enum | 3 modes | C0 / C1 / C2 |
| `methodClass` | enum | 8 classes | Qualitative → Participatory |
| `primaryIndicator` | enum | 12 indicators | Grouped: Impacts / Outcomes / Outputs |

### Geographic Scope Cascading

The geographic fields (`studyRegions`, `studyCountries`, `studySubnational`) show, hide, or auto-populate based on the selected `geographicScope`. This is implemented in `src/components/form/SectionB.tsx`.

| Scope | Province(s)/State(s) | Country(ies) | Region(s) |
|---|---|---|---|
| `global` | Hidden | Hidden | Hidden |
| `regional` | Hidden | Hidden | Editable multi-select |
| `national` | Hidden | Editable multi-select | Read-only (auto-derived from countries) |
| `sub_national` | Editable (search-first) | Read-only (auto-derived from provinces) | Read-only (auto-derived from countries) |
| `site_specific` | Hidden | Hidden | Hidden |

**Auto-population chain (sub_national):**
1. User selects subnational units (e.g., `KE-01` Baringo, `TZ-04` Iringa)
2. `countriesForSubnational()` extracts country codes from the ISO 3166-2 prefix → `['KE', 'TZ']`
3. `regionsForCountries()` maps country codes via `COUNTRY_TO_REGION` → `['ESA']`
4. Country and region badges display as read-only with "Auto-populated" helper text

**Switching scopes** clears irrelevant fields to prevent stale data.

**Data files:**
- `src/data/cgiarGeography.ts` — 8 CGIAR regions, 249 countries, `COUNTRY_TO_REGION` mapping
- `src/data/subnationalUnits.ts` — 5,020 ISO 3166-2 subnational entries with labels in "Name (Country)" format
- `src/components/form/FilteredMultiSelect.tsx` — search-first multi-select for the large subnational list (renders max 100 matches)

## Section C — Research Details (Conditional)

**Visible when:** `causalityMode === 'c2_causal'` OR `methodClass` is `'quantitative'` or `'experimental_quasi'`.

Logic in `src/lib/formSchema.ts` → `shouldShowResearchDetails()`.

All fields optional when section is visible; section is skipped entirely when hidden.

| Field | Type | Max Length | Notes |
|-------|------|-----------|-------|
| `keyResearchQuestions` | string | 2000 | Free text |
| `unitOfAnalysis` | string | 200 | What is being analyzed |
| `treatmentIntervention` | string | 500 | Treatment/intervention description |
| `sampleSize` | positive int | — | Optional number |
| `powerCalculation` | enum | yes/no/na | Power analysis performed? |
| `dataCollectionMethods` | string[] | — | Multi-select |
| `studyIndicators` | string | 2000 | Outcome indicators |
| `preAnalysisPlan` | YesNoWithLink | — | URL required when "yes" |
| `dataCollectionRounds` | positive int | — | Number of rounds |

## Section D — Timeline & Status

All fields mandatory. Cross-field validation: `expectedEndDate >= startDate`.

| Field | Type | Values |
|-------|------|--------|
| `startDate` | date | ISO date (YYYY-MM-DD) |
| `expectedEndDate` | date | Must be on/after startDate |
| `dataCollectionStatus` | enum | planned / ongoing / complete |
| `analysisStatus` | enum | planned / ongoing / complete |

## Section E — Funding & Resources

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `funded` | enum | Yes | yes / no / partial |
| `fundingSource` | string (200) | When funded=yes/partial | Conditional |
| `totalCostUSD` | positive number | Yes | USD amount |
| `proposalAvailable` | YesNoWithLink | Yes | URL required when "yes" |

## Section F — Outputs & Users

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `manuscriptDeveloped` | YesNoWithLink | Yes | URL required when "yes" |
| `policyBriefDeveloped` | YesNoWithLink | Yes | URL required when "yes" |
| `relatedToPastStudy` | YesNoWithLink | Yes | URL required when "yes" |
| `intendedPrimaryUser` | enum[] | Yes (min 1) | Multi-select — see [Primary Users](#primary-users) |
| `commissioningSource` | string (200) | Yes | Who commissioned the study |

## Shared Types

### YesNoWithLink

```typescript
{
  answer: 'yes' | 'no';
  link?: string;  // Required and validated as URL when answer is 'yes'
}
```

## Enum Reference

### Study Types

| Value | Label |
|-------|-------|
| `ex_ante_impact` | Ex-ante Impact Assessment |
| `foresight_futures` | Foresight & Futures Analysis |
| `process_performance` | Process & Performance Evaluation |
| `causal_impact` | Causal Impact Evaluation |
| `adoption_diffusion` | Adoption & Diffusion Study |
| `scaling_readiness` | Scaling Readiness Assessment |
| `scaling_policy_tracing` | Scaling & Policy Tracing Study |
| `institutional_policy_change` | Institutional & Policy Change Study |
| `synthesis_strategic_learning` | Synthesis & Strategic Learning Study |
| `meliaf_method` | MELIAF Method Study |

### Timing

| Value | Label |
|-------|-------|
| `t0_ex_ante` | T0 (Ex-Ante / before) |
| `t1_during` | T1 (During implementation/development) |
| `t2_endline` | T2 (Endline/immediate post) |
| `t3_ex_post` | T3 (Ex-post/lagged) |

### Analytical Scope

| Value | Label |
|-------|-------|
| `innovation_technology` | Innovation / Technology / Policy Option |
| `project_intervention` | Project / Intervention / Bundle / Package |
| `program_accelerator` | Program / Accelerator / Theme / Center / Function |
| `portfolio_system` | Portfolio / System / Network |

### Geographic Scope

| Value | Label |
|-------|-------|
| `global` | Global |
| `regional` | Regional |
| `national` | National |
| `sub_national` | Sub-national (national minus 1) |
| `site_specific` | Site-specific (landscapes/catchments/communities) |

### Result Level

| Value | Label |
|-------|-------|
| `output` | Output |
| `outcome` | Outcome |
| `impact` | Impact |

### Causality Mode

| Value | Label |
|-------|-------|
| `c0_descriptive` | C0 (Descriptive — What happened?) |
| `c1_contribution` | C1 (Contribution — Plausible influence) |
| `c2_causal` | C2 (Causal — Counterfactual attribution) |

### Method Class

| Value | Label |
|-------|-------|
| `qualitative` | Qualitative |
| `quantitative` | Quantitative |
| `mixed` | Mixed |
| `experimental_quasi` | Experimental / Quasi-Experimental |
| `modeling_simulation` | Modeling / Simulation |
| `observational` | Observational |
| `evidence_synthesis` | Evidence Synthesis |
| `participatory` | Participatory / Co-produced |

### Primary Indicator (grouped)

**Impacts:** Poverty Reduction, Livelihoods and Jobs | Nutrition, Health and Food Security | Gender Equality, Youth and Social Inclusion | Climate Adaptation and Mitigation | Environmental Health and Biodiversity

**Outcomes:** Innovation Use | Policy Change | Other Outcome

**Outputs:** Innovation Development | Capacity Sharing | Knowledge Products | Other Output

### Lead Centers

AfricaRice, Alliance of Bioversity International and CIAT, CIFOR-ICRAF, CIMMYT, CIP, IAES Evaluation, IAES IDC, IAES SPIA, ICARDA, ICRISAT, IFPRI, IITA, ILRI, IRRI, IWMI, OCS (Office of the Chief Scientist), WorldFish

### Primary Users

| Value | Label |
|-------|-------|
| `iaes` | IAES |
| `program` | Program |
| `donor` | Donor |
| `board` | Board |
| `comms` | Communications |
| `policy_makers` | Policy Makers |
| `researchers` | Researchers |
| `other` | Other |

## DynamoDB Submission Record

When a study is submitted, the backend stores it in DynamoDB with these additional metadata fields:

| Field | Type | Source |
|-------|------|--------|
| `submissionId` | string (UUID) | Generated by backend |
| `version` | number | Auto-incremented (1, 2, 3...) |
| `status` | string | `active` / `superseded` / `archived` |
| `userId` | string | From JWT `sub` claim |
| `modifiedBy` | string | From JWT `email` claim |
| `createdAt` | string (ISO 8601) | Server timestamp |
| `updatedAt` | string (ISO 8601) | Server timestamp |

All form fields from sections A–F are stored alongside these metadata fields. See [`infrastructure.md`](infrastructure.md) for the full DynamoDB table design.
