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

`src/types/index.ts` defines the `StudySubmission` interface matching a planned DynamoDB schema (pk: `USER#<userId>`, sk: `STUDY#<studyId>#v<version>`). All enum types and dropdown option arrays are co-located here.

### Auth

`src/contexts/AuthContext.tsx` provides auth state via React Context. `DEV_MODE` defaults to `true` with a mock user — toggled via `toggleDevMode()`. Prepared for AWS Cognito integration (not yet connected).

### Data Layer

TanStack React Query is configured as a provider but not yet used for API calls. No backend integration exists yet — form submission is simulated with a delay. The codebase is prepared for AWS Amplify/API Gateway/DynamoDB.

### UI Components

`src/components/ui/` contains shadcn/ui components. Custom form components in `src/components/form/` include `TagInput` (array fields), `YesNoLinkField` (yes/no with conditional URL), `FormSection` (collapsible wrapper with completion indicators), and `FormProgress`.

### Styling

Tailwind CSS with CGIAR brand colors defined in `tailwind.config.ts` (green, gold, blue with light variants). Dark/light mode via CSS class strategy with `ThemeProvider`. Path alias: `@/*` maps to `src/*`.

## Backend (SAM)

Serverless backend in `backend/` deployed via AWS SAM to `eu-central-1`.

### Commands

```sh
cd backend
sam build                    # Build Lambda functions
sam deploy                   # Deploy to dev (uses samconfig.toml defaults)
sam deploy --config-env staging  # Deploy to staging
sam local invoke HealthFunction  # Invoke locally
pytest tests/ -v             # Run backend unit tests
```

### Structure

- `template.yaml` — SAM/CloudFormation template (API Gateway, Lambda functions)
- `samconfig.toml` — deploy config per environment (dev/staging/prod)
- `functions/<name>/app.py` — Lambda handlers (one directory per function)
- `tests/unit/` — pytest unit tests

### CI/CD

GitHub Actions (`.github/workflows/deploy-backend.yml`) deploys on push to `main` when `backend/` files change. The workflow validates the template, runs tests, then deploys to dev with a smoke test on `/health`. Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub secrets.
