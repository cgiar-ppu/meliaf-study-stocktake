# REST API Reference

Base URL: `https://<api-id>.execute-api.eu-central-1.amazonaws.com/{stage}`

All endpoints except `/health` and `/hello` require a JWT `Authorization: Bearer <idToken>` header. The token is a Cognito ID token issued after sign-in (email/password or Azure AD SSO).

## Endpoints

### Health Check

```
GET /health
```

No authentication required. Returns `200` with `{ "status": "healthy" }`.

### Hello

```
GET /hello
```

No authentication required. Returns `200` with a greeting message.

### Create Submission

```
POST /submissions
```

Creates a new study submission (version 1, status `active`).

**Request body:** JSON object containing all study form fields (see [`data-model.md`](data-model.md)).

**Response** `201`:
```json
{
  "submissionId": "a1b2c3d4-...",
  "version": 1,
  "message": "Submission created"
}
```

**Error** `400` — validation errors:
```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "studyTitle", "message": "studyTitle is required" },
    { "field": "contactEmail", "message": "contactEmail must be a valid email" }
  ]
}
```

### List My Submissions

```
GET /submissions
GET /submissions?status=active
GET /submissions?status=archived
```

Lists the current user's submissions. Filters by status (defaults to `active`). Uses the `ByUser` GSI.

**Response** `200`:
```json
{
  "submissions": [
    {
      "submissionId": "a1b2c3d4-...",
      "version": 3,
      "status": "active",
      "userId": "abc-123",
      "modifiedBy": "user@cgiar.org",
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-02-01T14:00:00Z",
      "studyTitle": "Impact of drought-tolerant maize in Kenya",
      "leadCenter": "CIMMYT",
      ...
    }
  ],
  "count": 1
}
```

### List All Submissions (Dashboard)

```
GET /submissions/all
GET /submissions/all?status=active
```

Lists all submissions across all users. Used by the Dashboard page. Uses the `ByStatus` GSI.

**Response:** Same format as List My Submissions.

### Update Submission

```
PUT /submissions/{submissionId}
```

Creates a new version of an existing submission. The previous version's status is set to `superseded`. The new version gets `status: active` and an incremented version number.

**Request body:** Same as Create Submission.

**Response** `200`:
```json
{
  "submissionId": "a1b2c3d4-...",
  "version": 4,
  "message": "Submission updated"
}
```

**Error** `404` — submission not found:
```json
{
  "message": "Submission not found"
}
```

### Delete (Archive) Submission

```
DELETE /submissions/{submissionId}
```

Soft-deletes a submission by creating a new version with `status: archived`. The data is preserved and can be restored.

**Response** `200`:
```json
{
  "submissionId": "a1b2c3d4-...",
  "version": 5,
  "message": "Submission archived"
}
```

### Restore Submission

```
POST /submissions/{submissionId}/restore
```

Restores an archived submission by creating a new version with `status: active`.

**Response** `200`:
```json
{
  "submissionId": "a1b2c3d4-...",
  "version": 6,
  "message": "Submission restored"
}
```

**Error** `404` — no archived version found.

### Get Submission History

```
GET /submissions/{submissionId}/history
```

Returns all versions of a submission, ordered by version number.

**Response** `200`:
```json
{
  "submissionId": "a1b2c3d4-...",
  "versions": [
    { "version": 1, "status": "superseded", "createdAt": "...", ... },
    { "version": 2, "status": "superseded", "createdAt": "...", ... },
    { "version": 3, "status": "active", "createdAt": "...", ... }
  ],
  "count": 3
}
```

## Error Handling

All error responses follow this format:

```json
{
  "message": "Error description",
  "errors": []  // Optional, present for validation errors
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — invalid JSON or validation errors |
| `401` | Unauthorized — missing or invalid JWT |
| `404` | Submission not found |
| `500` | Internal server error |

## CORS

All responses include CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type,Authorization`

## Frontend API Client

The frontend uses `src/lib/api.ts` as a typed fetch wrapper. Key functions:

| Function | Endpoint | Notes |
|----------|----------|-------|
| `submitStudy(data)` | `POST /submissions` | Serializes dates to `YYYY-MM-DD` |
| `listSubmissions(status)` | `GET /submissions` | Defaults to `?status=active` |
| `listAllSubmissions(status)` | `GET /submissions/all` | Used by Dashboard |
| `updateSubmission(id, data)` | `PUT /submissions/{id}` | Creates new version |
| `deleteSubmission(id)` | `DELETE /submissions/{id}` | Soft delete (archive) |
| `restoreSubmission(id)` | `POST /submissions/{id}/restore` | Unarchive |
| `getSubmissionHistory(id)` | `GET /submissions/{id}/history` | All versions |

Auth headers are injected automatically when Cognito is configured (see [`authentication.md`](authentication.md)).

## Server-Side Validation

The backend validates all submissions in `backend/functions/shared/validator.py`, mirroring the Zod schema in `src/lib/formSchema.ts`. Validation includes:

- Required fields presence and non-empty strings
- Email format validation
- Enum value validation against allowed sets (from `backend/functions/shared/constants.py`)
- String length maximums
- Cross-field validation (end date after start date, funding source required when funded)
- Optional array fields type-checking (`studyRegions`, `studyCountries`, `studySubnational`)
- YesNoWithLink validation (URL required when answer is "yes")

If validation fails, a `400` response is returned with an array of error objects indicating the field and message.
