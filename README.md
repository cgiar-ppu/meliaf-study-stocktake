# MELIAF Study Stocktake

A CGIAR tool for cataloguing and managing monitoring, evaluation, learning, and impact assessment (MELIA) studies. Built as a React/TypeScript single-page application with an AWS serverless backend.

**Live**: [meliaf-study-stocktake.synapsis-analytics.com](https://meliaf-study-stocktake.synapsis-analytics.com)

## Features

- **Multi-section study form** (A–F) with Zod validation, auto-save drafts, and conditional sections
- **Geographic scope cascading** — selecting provinces auto-populates countries and regions; selecting countries auto-populates regions
- **My Submissions** — list view with preview sheet, archive/unarchive with confirmation
- **Dashboard** — filterable data table with sorting, column reordering, export (Excel/CSV/JSON), portfolio charts, and glossary
- **Authentication** — AWS Cognito with email/password sign-up and Azure AD SSO (OIDC)
- **CI/CD** — GitHub Actions for backend (SAM), AWS Amplify auto-deploy for frontend

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | React Hook Form + Zod, TanStack React Query |
| Auth | AWS Cognito (Amplify v6), Azure AD OIDC |
| Backend | AWS SAM — API Gateway, Lambda (Python 3.12, arm64), DynamoDB |
| Hosting | AWS Amplify Hosting (frontend), API Gateway (backend) |
| Region | `eu-central-1` (Frankfurt) |

## Quick Start

### Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Python 3.11+ (for backend development)
- AWS SAM CLI (for backend deployment)

### Frontend

```sh
npm install
npm run dev          # Dev server on localhost:8080
```

Other commands:
```sh
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

### Backend

```sh
cd backend
pip install pytest moto boto3   # Test dependencies
pytest tests/ -v                # Run unit tests (88 tests)

sam build                       # Build Lambda functions
sam deploy                      # Deploy to dev (uses samconfig.toml)
```

### Environment Variables

Create `.env.development` in the project root (gitignored):

```sh
VITE_API_URL=https://<api-id>.execute-api.eu-central-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=eu-central-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=<cognito-client-id>
VITE_COGNITO_DOMAIN=meliaf-dev.auth.eu-central-1.amazoncognito.com
```

Get these values after deploying the backend:
```sh
aws cloudformation describe-stacks --stack-name meliaf-backend-dev --query 'Stacks[0].Outputs'
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── form/           # Study form sections (SectionA–F) and custom inputs
│   │   ├── submission/     # SubmissionPreview, SubmissionCard
│   │   ├── dashboard/      # DashboardCharts
│   │   ├── layout/         # AppLayout, Header
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # AuthContext (Cognito + dev mode)
│   ├── data/               # Static data (CGIAR geography, subnational units)
│   ├── hooks/              # useAutoSave, use-toast, use-mobile
│   ├── lib/                # api.ts, amplify.ts, formSchema.ts, utils.ts
│   ├── pages/              # Route pages (lazy-loaded)
│   └── types/              # TypeScript types, enum options
├── backend/
│   ├── template.yaml       # SAM/CloudFormation template
│   ├── samconfig.toml      # Deploy config (dev/staging/prod)
│   ├── functions/
│   │   ├── shared/         # db, validator, response, identity, constants
│   │   ├── cognito_triggers/ # pre_signup, post_confirmation, custom_message
│   │   └── <handler>/app.py  # Lambda handlers
│   └── tests/unit/         # pytest + moto
├── docs/                   # Detailed documentation
│   ├── data-model.md       # Study form schema reference
│   ├── api.md              # REST API reference
│   ├── authentication.md   # Auth flow documentation
│   └── infrastructure.md   # AWS resources and deployment
├── CLAUDE.md               # AI assistant guidance
└── README.md               # This file
```

## Documentation

| Document | Description |
|----------|-------------|
| [`CLAUDE.md`](CLAUDE.md) | AI assistant guidance — architecture overview, commands, caveats |
| [`docs/data-model.md`](docs/data-model.md) | Complete study form schema with all fields, types, and validation rules |
| [`docs/api.md`](docs/api.md) | REST API endpoints, request/response formats, error handling |
| [`docs/authentication.md`](docs/authentication.md) | Cognito + Azure AD SSO authentication flow and configuration |
| [`docs/infrastructure.md`](docs/infrastructure.md) | AWS resource topology, DynamoDB design, CI/CD pipelines |

## Study Form Sections

The core feature is a 6-section form for registering MELIA studies:

| Section | Name | Fields | Notes |
|---------|------|--------|-------|
| **A** | Basic Information | Study ID, title, lead center, W3/Bilateral, contact, other centers | All mandatory |
| **B** | Study Classification | Study type, timing, scope, geographic fields, result level, causality mode, method class, primary indicator | Geographic fields cascade based on scope |
| **C** | Research Details | Research questions, unit of analysis, sample size, methods, pre-analysis plan | **Conditional** — shown only for causal (C2) or quantitative studies |
| **D** | Timeline & Status | Start/end dates, data collection status, analysis status | End date must be after start |
| **E** | Funding & Resources | Funded status, source, total cost, proposal link | Funding source required when funded |
| **F** | Outputs & Users | Manuscript, policy brief, related studies, primary users, commissioning source | Links required for "Yes" answers |

See [`docs/data-model.md`](docs/data-model.md) for the complete field reference.

## Deployment

### Backend (SAM)

Deployed via GitHub Actions on push to `main` when `backend/` files change. Manual deploy:

```sh
cd backend
sam build && sam deploy                      # dev
sam build && sam deploy --config-env staging  # staging
```

### Frontend (Amplify)

Auto-deploys from `main` branch via AWS Amplify Hosting. Required environment variables in the Amplify console:

- `VITE_API_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_COGNITO_DOMAIN`

## License

Internal CGIAR tool. Not open-source.
