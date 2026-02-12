# Authentication

MELIAF uses AWS Cognito as the identity provider, supporting both email/password sign-up and Azure AD single sign-on (SSO) via OIDC. Cognito acts as the identity broker — it issues its own JWTs regardless of the sign-in method, so the backend JWT authorizer works uniformly.

## Architecture Overview

```
                                  ┌──────────────┐
                          ┌──────>│   Azure AD   │
                          │ OIDC  │   (Entra ID) │
                          │       └──────────────┘
┌──────────┐    OAuth    ┌┴──────────────┐    JWT     ┌─────────────┐
│ Frontend │<──────────>│  AWS Cognito   │──────────>│ API Gateway │
│  (React) │  Amplify v6│  User Pool     │ Authorizer│  + Lambda   │
└──────────┘            └────────────────┘           └─────────────┘
                          │
                          │ Email/Password
                          └── Direct sign-up with domain validation
```

## Sign-In Methods

### 1. Email/Password

Standard Cognito sign-up flow with email verification:

1. User enters email + password on `/signup`
2. Pre Sign-Up Lambda validates email domain (must be `cgiar.org` or `synapsis-analytics.com`)
3. Custom Message Lambda sends branded HTML confirmation email with a verification link
4. User clicks the link → Confirm Sign-Up Lambda (`/confirm-email`) confirms the account and redirects to `/signin?confirmed=true`
5. Post Confirmation Lambda creates a user entity in the `meliaf-users-{env}` DynamoDB table
6. User signs in with email + password → Cognito returns ID token, access token, and refresh token

### 2. Azure AD SSO (OIDC)

Federated sign-in via Microsoft Entra ID (Azure AD):

1. User clicks "Sign in with Azure AD" on `/signin`
2. Frontend calls `signInWithRedirect({ provider: { custom: 'AzureAD' } })`
3. Browser redirects to Cognito Hosted UI → Azure AD login page
4. After Azure AD authentication, Cognito receives an OIDC token
5. Cognito maps Azure AD attributes (email, name, sub) to a Cognito user
6. Browser redirects back to the app with Cognito tokens
7. Post Confirmation Lambda creates a user entity (if first login)

## Token Flow

After successful authentication (either method):

1. Cognito issues three tokens:
   - **ID Token** — contains user claims (sub, email, name); used for API authorization
   - **Access Token** — used for Cognito API calls
   - **Refresh Token** — used to get new ID/access tokens without re-authentication
2. `AuthContext.getIdToken()` retrieves the current ID token (refreshes automatically via Amplify)
3. `src/lib/api.ts` injects `Authorization: Bearer <idToken>` on every API request
4. API Gateway `CognitoAuthorizer` validates the JWT and passes claims to Lambda via `event.requestContext.authorizer.claims`

## Backend Identity Extraction

`backend/functions/shared/identity.py` extracts user identity from JWT claims:

```python
def get_user_identity(event):
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    return {
        "userId": claims.get("sub", ""),
        "email": claims.get("email", ""),
    }
```

In dev/test environments (`ENVIRONMENT` != `prod`), when no JWT claims are present, it falls back to a dev user:
```python
{"userId": "dev-user-001", "email": "dev@meliaf.local"}
```

## Cognito Lambda Triggers

### Pre Sign-Up (`functions/cognito_triggers/pre_signup.py`)

- Validates that the email domain is in the allowed list
- Configured via `ALLOWED_EMAIL_DOMAINS` env var (default: `cgiar.org,synapsis-analytics.com`)
- Rejects sign-up with an error message if the domain is not allowed
- Case-insensitive domain matching

### Post Confirmation (`functions/cognito_triggers/post_confirmation.py`)

- Triggered after email verification or federated sign-in
- Creates a user entity in `meliaf-users-{env}` DynamoDB table
- Idempotent — uses `attribute_not_exists` condition to avoid overwriting existing users
- Skips `PostAuthentication_ForgotPassword` trigger source

### Custom Message (`functions/cognito_triggers/custom_message.py`)

- Provides branded HTML email templates for:
  - **Sign-up confirmation** — CGIAR green header, verification button link
  - **Resend confirmation code** — same template as sign-up
  - **Forgot password** — gold-bordered template with reset code
- Confirmation link points to the Confirm Sign-Up Lambda Function URL
- 24-hour expiry note included in confirmation emails

### Confirm Sign-Up (`functions/confirm_signup/app.py`)

- Lambda Function URL (publicly accessible, no auth)
- Receives `email` and `code` as query parameters
- Calls `cognito-idp:ConfirmSignUp` to verify the account
- Handles edge cases: already confirmed, expired code, invalid code
- Redirects to frontend `/signin` with appropriate query parameters

## Frontend Auth Configuration

### Amplify Initialization (`src/lib/amplify.ts`)

```typescript
// Required env vars:
VITE_COGNITO_USER_POOL_ID  // e.g., eu-central-1_r2nUZaOlO
VITE_COGNITO_CLIENT_ID     // e.g., eulrrlks2au54ej5au3ceognj
VITE_COGNITO_DOMAIN        // e.g., meliaf-dev.auth.eu-central-1.amazoncognito.com
```

- `isCognitoConfigured` — true when User Pool ID and Client ID are set; controls whether auth headers are injected
- `isSSOConfigured` — true when `VITE_COGNITO_DOMAIN` is also set; enables the "Sign in with Azure AD" button

### AuthContext (`src/contexts/AuthContext.tsx`)

Provides auth state and methods via React Context:

| Method | Description |
|--------|-------------|
| `signIn(email, password)` | Email/password authentication |
| `signInWithSSO()` | Redirect to Azure AD via Cognito Hosted UI |
| `signUp(email, password, name)` | Create account with email verification |
| `signOut()` | Clear session and redirect to sign-in |
| `resetPassword(email)` | Send password reset code |
| `confirmPasswordReset(email, code, newPassword)` | Complete password reset |
| `getIdToken()` | Get current JWT ID token (auto-refreshes) |

### Dev Mode

When Cognito env vars are **not set** and `import.meta.env.DEV` is true (local dev server only):
- Auto-authenticates as `dev-user-001` / `dev@meliaf.local`
- No auth headers sent with API requests
- Backend falls back to dev user identity
- Completely stripped from production builds by Vite

## Azure AD Configuration

### Cognito Side (`backend/template.yaml`)

- **Identity Provider**: `AzureADIdentityProvider` (OIDC type)
- **Issuer URL**: `https://login.microsoftonline.com/{AzureADTenantId}/v2.0`
- **Client ID**: Passed as `AzureADClientId` parameter
- **Client Secret**: Stored in AWS Secrets Manager (`meliaf/azure-ad-client-secret`), resolved via CloudFormation dynamic reference
- **Attribute Mapping**: `email` → `email`, `name` → `name`, `username` → `sub`
- **Scopes**: `openid email profile`

### Azure AD Side (External)

The Azure AD app registration must be configured with:
- **Redirect URI**: `https://{cognito-domain}/oauth2/idpresponse`
- **Token configuration**: ID token with email, name, sub claims
- **API permissions**: `openid`, `email`, `profile`

### Template Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `AzureADClientId` | Azure AD application (client) ID | — |
| `AzureADTenantId` | Azure AD directory (tenant) ID | — |
| `AllowedEmailDomains` | Comma-separated domains for sign-up | `cgiar.org,synapsis-analytics.com` |

## Demo Mode (Inactive)

Demo mode exists but is not currently active. See `CLAUDE.md` for instructions on enabling/disabling it.

When active (`VITE_DEMO_MODE=true`):
- All visitors auto-authenticate as `demo-user` / `demo@cgiar.org`
- Works in production builds (not gated behind `import.meta.env.DEV`)
- Backend must have `DefaultAuthorizer` removed for unauthenticated access
