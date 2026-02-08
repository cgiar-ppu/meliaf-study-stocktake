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
| `/signin`, `/signup`, `/forgot-password` | Auth pages | No |

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

### Auth

`src/contexts/AuthContext.tsx` provides auth state via React Context. `DEV_MODE` defaults to `true` with a mock user — toggled via `toggleDevMode()`. Prepared for AWS Cognito integration (not yet connected).

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

- `template.yaml` — SAM/CloudFormation template (API Gateway, DynamoDB, Lambda functions, IAM)
- `samconfig.toml` — deploy config per environment (dev/staging/prod)
- `functions/shared/` — shared utilities (db, validator, response helpers, identity, constants)
- `functions/<name>/app.py` — Lambda handlers (one directory per function)
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

### Auth

Currently uses hardcoded dev user (`dev-user-001`) via `functions/shared/identity.py`. Designed for easy swap to JWT/Cognito claims later.

### CI/CD

GitHub Actions (`.github/workflows/deploy-backend.yml`) deploys on push to `main` when `backend/` files change. The workflow validates the template, runs tests (with moto for DynamoDB mocking), then deploys to dev with a smoke test on `/health`. Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub secrets.
