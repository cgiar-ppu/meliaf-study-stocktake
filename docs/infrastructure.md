# Infrastructure

All AWS resources are defined in `backend/template.yaml` (SAM/CloudFormation) and deployed to `eu-central-1` (Frankfurt).

## Resource Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│  AWS Amplify Hosting                                                │
│  meliaf-study-stocktake.synapsis-analytics.com                     │
│  (Auto-deploys from main branch)                                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API Gateway (REST, Regional)                                       │
│  meliaf-api-{env}                                                   │
│  CognitoAuthorizer (JWT validation on all /submissions/* routes)    │
├─────────────────────────────────────────────────────────────────────┤
│  Routes:                                                            │
│  GET  /health                    → HealthFunction (no auth)         │
│  GET  /hello                     → HelloFunction (no auth)          │
│  POST /submissions               → CreateSubmissionFunction         │
│  GET  /submissions               → ListSubmissionsFunction          │
│  GET  /submissions/all           → ListAllSubmissionsFunction       │
│  PUT  /submissions/{id}          → UpdateSubmissionFunction         │
│  DELETE /submissions/{id}        → DeleteSubmissionFunction         │
│  POST /submissions/{id}/restore  → RestoreSubmissionFunction        │
│  GET  /submissions/{id}/history  → GetSubmissionHistoryFunction     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Lambda Functions (Python 3.12, arm64, 256 MB, 30s timeout)         │
│  Shared code: functions/shared/ (db, validator, response, identity) │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DynamoDB (On-Demand, PITR enabled)                                 │
│                                                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │  meliaf-submissions-{env}               │                        │
│  │  PK: submissionId (S)                   │                        │
│  │  SK: version (N)                        │                        │
│  │  GSI ByUser: userId → createdAt         │                        │
│  │  GSI ByStatus: status → createdAt       │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │  meliaf-users-{env}                     │                        │
│  │  PK: userId (S)                         │                        │
│  └─────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Cognito User Pool (meliaf-users-{env})                             │
│  ├── Email/password sign-up (domain-restricted)                     │
│  ├── Azure AD OIDC identity provider                                │
│  ├── Lambda triggers: PreSignUp, PostConfirmation, CustomMessage    │
│  └── Hosted UI domain: meliaf-{env}.auth.{region}.amazoncognito.com │
│                                                                     │
│  Cognito User Pool Client (meliaf-web-{env})                        │
│  ├── Auth flows: SRP, Refresh Token                                 │
│  ├── OAuth: authorization_code                                      │
│  └── Providers: COGNITO, AzureAD                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Secrets Manager                                                    │
│  meliaf/azure-ad-client-secret → Azure AD OIDC client secret        │
└─────────────────────────────────────────────────────────────────────┘
```

## DynamoDB Design

### Submissions Table (`meliaf-submissions-{env}`)

**Append-only / event-sourced pattern.** Submissions are never updated in place. Every change (create, edit, delete, restore) creates a new item with an incremented version number.

| Key | Attribute | Type | Description |
|-----|-----------|------|-------------|
| PK | `submissionId` | String (UUID) | Partition key |
| SK | `version` | Number | Sort key — auto-incremented (1, 2, 3...) |
| — | `status` | String | `active` / `superseded` / `archived` |
| — | `userId` | String | Cognito `sub` claim |
| — | `modifiedBy` | String | User email |
| — | `createdAt` | String | ISO 8601 timestamp |
| — | `updatedAt` | String | ISO 8601 timestamp |
| — | `studyTitle`, `studyType`, ... | Various | All form fields from sections A–F |

**Version lifecycle:**

```
v1 (active)   → User creates submission
v2 (active)   → User edits; v1 becomes superseded
v3 (active)   → User edits again; v2 becomes superseded
v4 (archived) → User deletes; v3 becomes superseded
v5 (active)   → User restores; v4 becomes superseded
```

Only the latest version has `status=active` (or `archived` if deleted). All previous versions have `status=superseded`.

**Global Secondary Indexes:**

| GSI | Partition Key | Sort Key | Projection | Used By |
|-----|--------------|----------|------------|---------|
| `ByUser` | `userId` (S) | `createdAt` (S) | ALL | "My Submissions" page |
| `ByStatus` | `status` (S) | `createdAt` (S) | ALL | Dashboard (all submissions) |

### Users Table (`meliaf-users-{env}`)

Simple table for user entities created by the Post Confirmation Lambda.

| Key | Attribute | Type | Description |
|-----|-----------|------|-------------|
| PK | `userId` | String | Cognito `sub` claim |
| — | `email` | String | User email |
| — | `name` | String | Display name |
| — | `createdAt` | String | ISO 8601 timestamp |
| — | `signUpMethod` | String | `email` or `external_provider` |

## Lambda Functions

All functions use Python 3.12 on arm64 (Graviton) with 256 MB memory and 30s timeout. No external dependencies — pure Python + boto3 (provided by the Lambda runtime).

### Shared Modules (`functions/shared/`)

| Module | Purpose |
|--------|---------|
| `db.py` | DynamoDB client and table references (from env vars) |
| `validator.py` | Server-side validation mirroring the Zod schema |
| `response.py` | Standardized API response helpers with CORS headers |
| `identity.py` | Extract user identity from JWT claims (with dev fallback) |
| `constants.py` | Valid enum values, mirrored from `src/types/index.ts` |

### Cognito Trigger Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `PreSignUpValidationFunction` | Pre Sign-Up | Validate email domain |
| `PostConfirmationCreateUserFunction` | Post Confirmation | Create user entity in DynamoDB |
| `CustomMessageFunction` | Custom Message | Branded email templates |
| `ConfirmSignupFunction` | Lambda Function URL | Email verification redirect |

### Submission CRUD Functions

| Function | Route | Description |
|----------|-------|-------------|
| `CreateSubmissionFunction` | POST /submissions | Validate + create v1 |
| `ListSubmissionsFunction` | GET /submissions | Query ByUser GSI for current user |
| `ListAllSubmissionsFunction` | GET /submissions/all | Query ByStatus GSI |
| `UpdateSubmissionFunction` | PUT /submissions/{id} | Create new version, supersede previous |
| `DeleteSubmissionFunction` | DELETE /submissions/{id} | Create archived version |
| `RestoreSubmissionFunction` | POST /submissions/{id}/restore | Create active version from archived |
| `GetSubmissionHistoryFunction` | GET /submissions/{id}/history | Query all versions by submissionId |

## CI/CD

### Backend — GitHub Actions

**Workflow:** `.github/workflows/deploy-backend.yml`
**Trigger:** Push to `main` when `backend/` files change

Pipeline steps:
1. Validate SAM template (`sam validate`)
2. Run pytest unit tests (88 tests, moto for DynamoDB mocking)
3. Build (`sam build`)
4. Deploy to dev (`sam deploy`)
5. Smoke test on `/health` endpoint

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**IAM Policy:** `MeliafSamDeployPolicy` (managed externally) — includes CloudFormation, Lambda, API Gateway, DynamoDB, Cognito, Secrets Manager, IAM role management permissions.

### Frontend — AWS Amplify

**Trigger:** Auto-deploys from `main` branch on every push.
**Build:** `npm run build` (Vite production build)

**Required Amplify Environment Variables:**
- `VITE_API_URL` — API Gateway endpoint
- `VITE_COGNITO_USER_POOL_ID` — Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID` — Cognito App Client ID
- `VITE_COGNITO_DOMAIN` — Cognito Hosted UI domain (required for SSO)

These are **not** picked up from `.env.development` during production builds — they must be set in the Amplify console (App settings → Environment variables).

## Deployment Configuration

`backend/samconfig.toml` defines per-environment settings:

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| Stack name | `meliaf-backend-dev` | `meliaf-backend-staging` | `meliaf-backend-prod` |
| Region | `eu-central-1` | `eu-central-1` | `eu-central-1` |
| Log level | DEBUG | INFO | WARNING |
| Frontend URL | `https://meliaf-study-stocktake.synapsis-analytics.com` | `https://staging.meliaf.cgiar.org` | `https://meliaf.cgiar.org` |

Deploy commands:
```sh
cd backend
sam build && sam deploy                        # dev (default)
sam build && sam deploy --config-env staging    # staging
sam build && sam deploy --config-env prod       # production
```

## CloudFormation Outputs

After deploying, retrieve configuration values:

```sh
aws cloudformation describe-stacks \
  --stack-name meliaf-backend-dev \
  --query 'Stacks[0].Outputs'
```

| Output | Description |
|--------|-------------|
| `ApiUrl` | API Gateway endpoint URL |
| `UserPoolId` | Cognito User Pool ID |
| `UserPoolClientId` | Cognito App Client ID |
| `UserPoolDomain` | Cognito Hosted UI domain |
| `ConfirmSignupUrl` | Lambda Function URL for email verification |
| `SubmissionsTableName` | DynamoDB submissions table name |
| `SubmissionsTableArn` | DynamoDB submissions table ARN |
| `UsersTableName` | DynamoDB users table name |

## SAM Caveats

- `DefaultAuthorizer` in the API `Auth` block must be a **literal string** — SAM processes this before CloudFormation resolves intrinsic functions, so `!If` / `Fn::If` cannot be used
- `Authorizer: NONE` on individual function events is only valid when a `DefaultAuthorizer` is set on the API
- To disable auth entirely: remove `DefaultAuthorizer` from the API Auth block AND remove `Auth: Authorizer: NONE` from individual events
