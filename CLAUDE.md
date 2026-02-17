# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MELIAF Study Stocktake — a CGIAR tool for cataloguing monitoring, evaluation, learning, and impact assessment (MELIA) studies. React/TypeScript SPA built with Vite, shadcn/ui, and Tailwind CSS.

## Commands

```sh
npm run dev          # Dev server on localhost:8080
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

Run a single test file: `npx vitest run src/path/to/file.test.ts`

## Architecture

### Routing & Pages

React Router with lazy-loaded pages. `ProtectedRoute` checks auth state (bypassed in dev mode). Authenticated pages use `AppLayout` wrapper (Header + main content area).

| Route | Page | Protected |
|-------|------|-----------|
| `/` | Introduction | Yes |
| `/submissions` | MySubmissions | Yes |
| `/dashboard` | Dashboard | Yes |
| `/submit` | SubmitStudy | Yes |
| `/submit/:submissionId` | EditSubmission | Yes |
| `/signin`, `/signup`, `/forgot-password`, `/confirm-email` | Auth pages | No |

### Multi-Section Study Form

The core feature is a multi-section form (`src/components/form/StudyForm.tsx`) for submitting research studies. It has 6 collapsible sections (A–F):

- **A**: Basic Information (lead center, contact)
- **B**: Study Classification (type, timing, scope, methodology, geographic fields)
- **C**: Research Details — **conditionally shown** only when `causalityMode === 'c2_causal'` or `methodClass` is quantitative/experimental/mixed
- **D**: Timeline & Status
- **E**: Funding & Resources
- **F**: Outputs & Users

Each section is a memoized component (`React.memo`). Form state is managed by React Hook Form with Zod validation (`src/lib/formSchema.ts`). Drafts auto-save to localStorage via `useAutoSave` hook (2-second debounce).

### Geographic Scope Cascading (Section B)

Geographic fields in Section B show/hide and auto-populate based on the selected `geographicScope`:

| Scope | Province(s)/State(s) | Country(ies) | Region(s) |
|---|---|---|---|
| Global | Hidden | Hidden | Hidden |
| Regional | Hidden | Hidden | Editable multi-select |
| National | Hidden | Editable multi-select | Read-only (auto from countries) |
| Sub-national | Editable search-first multi-select | Read-only (auto from provinces) | Read-only (auto from countries) |
| Site-specific | Hidden | Hidden | Hidden |

Key files: `SectionB.tsx`, `cgiarGeography.ts` (8 CGIAR regions, 249 countries, `COUNTRY_TO_REGION` mapping, `regionsForCountries()`), `subnationalUnits.ts` (5,020 ISO 3166-2 entries, `countriesForSubnational()`). The `FilteredMultiSelect` component is used for the large subnational list — it only renders options matching the search query (max 100) to avoid DOM performance issues.

### Type System

`src/types/index.ts` defines enum types, dropdown option arrays, and the `StudySubmission` interface. All enum values are co-located here and mirrored in `backend/functions/shared/constants.py`.

### Auth (Frontend)

`src/contexts/AuthContext.tsx` provides auth state via React Context backed by AWS Cognito (Amplify v6) with Azure AD SSO. Key methods: `signIn`, `signInWithSSO`, `signUp`, `signOut`, `resetPassword`, `confirmPasswordReset`, `getIdToken`. Dev mode (mock user `dev-user-001`) is gated behind `import.meta.env.DEV` and only activates when Cognito env vars are not set. `src/lib/amplify.ts` initialises Amplify from `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, and `VITE_COGNITO_DOMAIN` (required for SSO OAuth flow). `src/lib/api.ts` automatically injects `Authorization: Bearer <idToken>` on every request when Cognito is configured. `isSSOConfigured` (exported from `amplify.ts`) is true when `VITE_COGNITO_DOMAIN` is set, enabling the "Sign in with Azure AD" button on the sign-in page.

### Data Layer

`src/lib/api.ts` is the API client — typed fetch wrapper with error handling. Exports `submitStudy()`, `listSubmissions()`, `getSubmissionHistory()`. Base URL set via `VITE_API_URL` env var (see `.env.development`). TanStack React Query is used for data fetching (`useQuery` in `MySubmissions.tsx`).

### UI Components

`src/components/ui/` contains shadcn/ui components. Custom form components in `src/components/form/` include `TagInput` (array fields), `YesNoLinkField` (yes/no with conditional URL), `FormSection` (collapsible wrapper with completion indicators), `FormProgress`, `MultiSelect` (grouped multi-select for small option sets), and `FilteredMultiSelect` (search-first variant for large option sets like subnational units).

### Styling

Tailwind CSS with CGIAR brand colors defined in `tailwind.config.ts` (green, gold, blue with light variants). Dark/light mode via CSS class strategy with `ThemeProvider`. Path alias: `@/*` maps to `src/*`.

## Backend (SAM)

Serverless backend in `backend/` deployed via AWS SAM to `eu-central-1`. Python 3.12 on arm64 (Graviton). No external dependencies — pure Python + boto3 (in Lambda runtime).

### Commands

```sh
cd backend
sam build                    # Build Lambda functions
sam deploy                   # Deploy to dev (uses samconfig.toml defaults)
sam deploy --config-env staging  # Deploy to staging
sam local invoke HealthFunction  # Invoke locally
pip install pytest moto boto3   # Install test deps
pytest tests/ -v             # Run backend unit tests
```

### Structure

- `template.yaml` — SAM/CloudFormation template (API Gateway, Cognito, DynamoDB, Lambda functions, IAM)
- `samconfig.toml` — deploy config per environment (dev/staging/prod)
- `functions/shared/` — shared utilities (db, validator, response helpers, identity, constants)
- `functions/<name>/app.py` — Lambda handlers (one directory per function)
- `functions/cognito_triggers/` — Cognito Lambda triggers (pre_signup, post_confirmation)
- `tests/unit/` — pytest unit tests using moto for DynamoDB mocking

### API Endpoints

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | /health | health | Health check |
| GET | /hello | hello | Hello stub |
| POST | /submissions | create_submission | Create new submission (v1, status=active) |
| GET | /submissions | list_submissions | List user's submissions (filter by ?status=) |
| GET | /submissions/all | list_all_submissions | List all submissions across all users |
| PUT | /submissions/{id} | update_submission | New version, marks previous as superseded |
| DELETE | /submissions/{id} | delete_submission | Soft delete (new version with status=archived) |
| POST | /submissions/{id}/restore | restore_submission | Restore (unarchive) a submission |
| GET | /submissions/{id}/history | get_submission_history | All versions of a submission |

### DynamoDB Design

Append-only / event-sourced pattern — submissions are never updated in place. Edits create new versions; deletes create archived versions.

- **Table**: `meliaf-submissions-{env}` — PK: `submissionId` (S), SK: `version` (N)
- **GSI ByUser**: `userId` (S) + `createdAt` (S) — powers "My Submissions"
- **GSI ByStatus**: `status` (S) + `createdAt` (S) — powers dashboard queries
- **Table**: `meliaf-users-{env}` — PK: `userId` (S). Stores user entities created by Post Confirmation Lambda.

### Auth (Backend)

Cognito User Pool with email sign-up, code-based email confirmation, Azure AD SSO (OIDC), and a JWT authorizer on API Gateway. `functions/shared/identity.py` extracts `sub` and `email` from `event.requestContext.authorizer.claims`. Falls back to dev user in dev/test environments when no claims present. Pre Sign-Up Lambda (`functions/cognito_triggers/pre_signup.py`) validates email domains (configurable via `AllowedEmailDomains` parameter, default: `cgiar.org,synapsis-analytics.com`). Post Confirmation Lambda (`functions/cognito_triggers/post_confirmation.py`) writes user entities to `meliaf-users-{env}` DynamoDB table. Custom Message Lambda (`functions/cognito_triggers/custom_message.py`) provides branded email templates for sign-up confirmation and password reset.

**Azure AD SSO**: Configured as an OIDC identity provider on the Cognito User Pool (`AzureADIdentityProvider` in `template.yaml`). The client secret is stored in AWS Secrets Manager (`meliaf/azure-ad-client-secret`) and resolved via CloudFormation dynamic reference. Azure AD tenant/client IDs are template parameters. Cognito acts as the identity broker — it issues its own JWTs regardless of sign-in method, so the `CognitoAuthorizer` works for both email/password and SSO users.

### CI/CD

**Backend**: GitHub Actions (`.github/workflows/deploy-backend.yml`) deploys on push to `main` when `backend/` files change. The workflow validates the template, runs tests (with moto for DynamoDB mocking), then deploys to dev with a smoke test on `/health`. Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub secrets.

**Frontend**: AWS Amplify Hosting auto-deploys from the `main` branch on every push. The following `VITE_` environment variables must be set in the Amplify console (App settings → Environment variables): `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_DOMAIN`. These are **not** picked up from `.env.development` during production builds.

### Smoke Test Script

`backend/test-api.sh` — runs the full CRUD lifecycle against the deployed API (create → list → update → history → delete → verify). Usage: `./backend/test-api.sh`

## Current Status

All core functional features are implemented and deployed:

- **Auth**: Cognito User Pool with email/password sign-up, branded email confirmation, and Azure AD SSO (OIDC)
- **Study form**: Multi-section form (A–F) with auto-save, create and edit modes
- **My Submissions**: List view with preview sheet, archive/unarchive with confirmation dialog
- **Dashboard**: Full data table with filtering, sorting, column reordering, export (Excel/CSV/JSON), portfolio charts, and glossary
- **Frontend hosting**: Amplify Hosting on custom domain (`meliaf-study-stocktake.synapsis-analytics.com`)
- **CI/CD**: GitHub Actions for backend (SAM), Amplify auto-deploy for frontend

### Testing

- **Backend**: 88 unit tests (pytest + moto) covering all Lambda handlers, validators, Cognito triggers, and shared utilities. Run via `pytest tests/ -v` in `backend/`.
- **Frontend**: 405 tests (Vitest + React Testing Library) across 46 test files covering components, pages, hooks, utilities, and data modules. Run via `npm run test`.
- **Accessibility**: 18 axe-core tests (`vitest-axe`) across 10 `.a11y.test.tsx` files scanning custom form components (MultiSelect, FilteredMultiSelect, CreatableMultiSelect, SearchableSelect, TagInput, YesNoLinkField), auth pages (SignIn, SignUp, ForgotPassword), and Header. Run as part of `npm run test`.
- **Frontend-backend contract sync**: `src/lib/contractSync.test.ts` (24 tests) reads `backend/functions/shared/constants.py` as raw text and verifies enum values, field length limits, and Section C conditional logic match the frontend TypeScript definitions. The frontend CI workflow also triggers on changes to `constants.py` to catch drift immediately.
- **Smoke test**: `backend/test-api.sh` runs the full CRUD lifecycle against the deployed API.
- **CI**: Backend tests run in GitHub Actions on push/PR to `main` (when `backend/` changes). Frontend tests run in GitHub Actions on push/PR to `main` (when `src/`, config files, or `backend/functions/shared/constants.py` change).

## Remaining Work

### Testing gaps

1. **E2E tests (Playwright)** — the biggest gap. No end-to-end tests exist. Unit tests mock away the real multi-step form submission flow, geographic cascading in a browser, auth redirects, and dashboard loading real data. Even 5–10 happy-path scenarios (sign in → submit study → view in dashboard → archive → restore) would catch bugs that unit tests structurally cannot.
2. **Remaining frontend unit tests** — High-value untested files:
   - `amplify.ts` — auth config, feature flags (`isCognitoConfigured`, `isSSOConfigured`)
   - `App.tsx` — route tree integrity, QueryClient config
   - Chart components (`DonutChart.tsx`, `HorizontalBarChart.tsx`, `PipelineStatusChart.tsx`) and `chartColors.ts` are low-priority — they are purely presentational Recharts wrappers with no business logic. Visual regressions in charts are better caught by E2E/visual regression tests than unit tests.

### Infrastructure / production hardening

1. **WAF** — Add AWS WAF to API Gateway to protect against common web exploits (SQL injection, XSS, bot traffic, rate-based rules)
2. **Monitoring** — CloudWatch dashboards for Lambda errors/latency, DynamoDB throttling, API Gateway 4xx/5xx rates; CloudWatch Alarms with SNS alerting
3. **Multi-environment** — Staging and prod deployments; CI/CD already supports `--config-env staging` but needs env-specific config, Amplify branches, and a promotion workflow (dev → staging → prod)
4. **API throttling** — Usage plans and throttling settings on API Gateway (requests per second, burst limits) to prevent abuse

## Demo Mode (available but inactive)

Demo mode exists in the codebase but is **not currently active**. Auth is handled by Cognito + Azure AD SSO.

**How it works:** `VITE_DEMO_MODE=true` env var auto-authenticates all visitors as `demo-user` / `demo@cgiar.org` without Cognito. Works in production builds — not gated behind `import.meta.env.DEV`. When active, `getIdToken()` returns null; backend `identity.py` falls back to `dev-user-001`.

**To re-enable demo mode:**
1. Set `VITE_DEMO_MODE=true` in Amplify console env vars
2. In `backend/template.yaml`, remove `DefaultAuthorizer: CognitoAuthorizer` from the API `Auth` block, and remove `Auth: Authorizer: NONE` from HealthFunction/HelloFunction events
3. Deploy both frontend (push to main) and backend (`sam build && sam deploy`)

**To disable demo mode** (current state):
1. Remove `VITE_DEMO_MODE` (or set to `false`) in Amplify console; ensure `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, and `VITE_COGNITO_DOMAIN` are set
2. Ensure `DefaultAuthorizer: CognitoAuthorizer` is present in `template.yaml` API Auth block
3. Deploy both frontend and backend

**SAM caveat:** `DefaultAuthorizer` must be a literal string — SAM processes the Auth block before CloudFormation resolves intrinsic functions, so `!If` / `Fn::If` cannot be used there. `Authorizer: NONE` on individual events is only valid when a `DefaultAuthorizer` is set.

## Additional Documentation

See `docs/` for detailed reference documentation:

- [`docs/data-model.md`](docs/data-model.md) — Complete study form schema with all fields, types, and validation rules
- [`docs/api.md`](docs/api.md) — REST API endpoints, request/response formats, and error handling
- [`docs/authentication.md`](docs/authentication.md) — Cognito + Azure AD SSO auth flow, tokens, and configuration
- [`docs/infrastructure.md`](docs/infrastructure.md) — AWS resource topology, DynamoDB design, and deployment
