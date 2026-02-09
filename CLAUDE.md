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
| `/` | MySubmissions | Yes |
| `/dashboard` | Dashboard | Yes |
| `/submit` | SubmitStudy | Yes |
| `/signin`, `/signup`, `/forgot-password`, `/confirm-email` | Auth pages | No |

### Multi-Section Study Form

The core feature is a multi-section form (`src/components/form/StudyForm.tsx`) for submitting research studies. It has 6 collapsible sections (A–F):

- **A**: Basic Information (lead center, contact)
- **B**: Study Classification (type, timing, scope, methodology)
- **C**: Research Details — **conditionally shown** only when `causalityMode === 'c2_causal'` or `methodClass` is quantitative/experimental/mixed
- **D**: Timeline & Status
- **E**: Funding & Resources
- **F**: Outputs & Users

Each section is a memoized component (`React.memo`). Form state is managed by React Hook Form with Zod validation (`src/lib/formSchema.ts`). Drafts auto-save to localStorage via `useAutoSave` hook (2-second debounce).

### Type System

`src/types/index.ts` defines enum types, dropdown option arrays, and the `StudySubmission` interface. All enum values are co-located here and mirrored in `backend/functions/shared/constants.py`.

### Auth (Frontend)

`src/contexts/AuthContext.tsx` provides auth state via React Context backed by AWS Cognito (Amplify v6). Key methods: `signIn`, `signUp`, `signOut`, `resetPassword`, `confirmPasswordReset`, `getIdToken`. Dev mode (mock user `dev-user-001`) is gated behind `import.meta.env.DEV` and only activates when Cognito env vars are not set. `src/lib/amplify.ts` initialises Amplify from `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID`. `src/lib/api.ts` automatically injects `Authorization: Bearer <idToken>` on every request when Cognito is configured.

### Data Layer

`src/lib/api.ts` is the API client — typed fetch wrapper with error handling. Exports `submitStudy()`, `listSubmissions()`, `getSubmissionHistory()`. Base URL set via `VITE_API_URL` env var (see `.env.development`). TanStack React Query is used for data fetching (`useQuery` in `MySubmissions.tsx`).

### UI Components

`src/components/ui/` contains shadcn/ui components. Custom form components in `src/components/form/` include `TagInput` (array fields), `YesNoLinkField` (yes/no with conditional URL), `FormSection` (collapsible wrapper with completion indicators), and `FormProgress`.

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
| PUT | /submissions/{id} | update_submission | New version, marks previous as superseded |
| DELETE | /submissions/{id} | delete_submission | Soft delete (new version with status=archived) |
| GET | /submissions/{id}/history | get_submission_history | All versions of a submission |

### DynamoDB Design

Append-only / event-sourced pattern — submissions are never updated in place. Edits create new versions; deletes create archived versions.

- **Table**: `meliaf-submissions-{env}` — PK: `submissionId` (S), SK: `version` (N)
- **GSI ByUser**: `userId` (S) + `createdAt` (S) — powers "My Submissions"
- **GSI ByStatus**: `status` (S) + `createdAt` (S) — powers dashboard queries
- **Table**: `meliaf-users-{env}` — PK: `userId` (S). Stores user entities created by Post Confirmation Lambda.

### Auth (Backend)

Cognito User Pool with email sign-up, link-based email confirmation, and a JWT authorizer on API Gateway. `functions/shared/identity.py` extracts `sub` and `email` from `event.requestContext.authorizer.claims`. Falls back to dev user in dev/test environments when no claims present. Pre Sign-Up Lambda (`functions/cognito_triggers/pre_signup.py`) validates email domains (configurable via `AllowedEmailDomains` parameter, default: `cgiar.org,synapsis-analytics.com`). Post Confirmation Lambda (`functions/cognito_triggers/post_confirmation.py`) writes user entities to `meliaf-users-{env}` DynamoDB table. `/health` and `/hello` endpoints have `Auth: NONE` (no JWT required).

### CI/CD

**Backend**: GitHub Actions (`.github/workflows/deploy-backend.yml`) deploys on push to `main` when `backend/` files change. The workflow validates the template, runs tests (with moto for DynamoDB mocking), then deploys to dev with a smoke test on `/health`. Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub secrets.

**Frontend**: AWS Amplify Hosting auto-deploys from the `main` branch on every push. The following `VITE_` environment variables must be set in the Amplify console (App settings → Environment variables): `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`. These are **not** picked up from `.env.development` during production builds.

### Smoke Test Script

`backend/test-api.sh` — runs the full CRUD lifecycle against the deployed API (create → list → update → history → delete → verify). Usage: `./backend/test-api.sh`

## Remaining Work

### Functional (in priority order)

1. ~~**Cognito auth**~~ — Done. User pool, JWT authorizer, Pre Sign-Up domain validation, Post Confirmation user entity, Amplify v6 frontend, email confirmation flow.
2. **Dashboard page** — Replace placeholder with real data from ByStatus GSI (counts by status, study type, center)
3. **View/Edit submission** — Detail page for a submission, route PUT endpoint through the form for editing
4. **Delete from UI** — Delete button in MySubmissions triggering the DELETE endpoint

### Infrastructure / production hardening

5. ~~**Frontend hosting**~~ — Done. Amplify Hosting auto-deploys from `main` branch.
6. ~~**Custom domain**~~ — Done. `meliaf-study-stocktake.synapsis-analytics.com` for frontend.
7. **WAF** — Web Application Firewall on API Gateway
8. **Monitoring** — CloudWatch dashboards, alarms, error alerting
9. **Multi-environment** — Staging/prod deployments (CI/CD ready, needs env config + promotion workflow)
10. **API throttling** — Rate limiting on API Gateway
