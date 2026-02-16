import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock amplify before importing api module
vi.mock('@/lib/amplify', () => ({
  isCognitoConfigured: false,
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

// Must import after mocks are set up
import {
  submitStudy,
  listSubmissions,
  getSubmissionHistory,
  updateSubmission,
  deleteSubmission,
  restoreSubmission,
  listAllSubmissions,
  getSubmission,
  getUploadUrl,
  uploadFileToS3,
} from './api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();

function mockOkResponse(body: unknown) {
  return { ok: true, json: () => Promise.resolve(body) };
}

function mockErrorResponse(status: number, body: unknown) {
  return { ok: false, status, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
  // Set the API base URL via import.meta.env
  vi.stubEnv('VITE_API_URL', 'https://api.test.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// serializeDates — tested indirectly through submitStudy / updateSubmission
// ---------------------------------------------------------------------------
describe('date serialization', () => {
  it('converts Date fields to YYYY-MM-DD strings', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: '1', version: 1, message: 'ok' }));
    await submitStudy({ startDate: new Date('2025-06-15'), title: 'Test' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.startDate).toBe('2025-06-15');
    expect(body.title).toBe('Test');
  });

  it('passes through non-Date fields unchanged', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: '1', version: 1, message: 'ok' }));
    await submitStudy({ name: 'hello', count: 42, active: true });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ name: 'hello', count: 42, active: true });
  });
});

// ---------------------------------------------------------------------------
// API functions — request construction
// ---------------------------------------------------------------------------
describe('submitStudy()', () => {
  it('POSTs to /submissions', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: 'abc', version: 1, message: 'Created' }));
    const result = await submitStudy({ studyTitle: 'My Study' });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions');
    expect(opts.method).toBe('POST');
    expect(result.submissionId).toBe('abc');
  });
});

describe('listSubmissions()', () => {
  it('GETs /submissions with status param', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));
    await listSubmissions('active');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions?status=active');
  });

  it('defaults to active status', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));
    await listSubmissions();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('status=active');
  });
});

describe('updateSubmission()', () => {
  it('PUTs to /submissions/{id}', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: 'x', version: 2, message: 'Updated' }));
    await updateSubmission('x', { studyTitle: 'Updated Title' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/x');
    expect(opts.method).toBe('PUT');
  });
});

describe('deleteSubmission()', () => {
  it('DELETEs /submissions/{id}', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: 'x', version: 3, message: 'Deleted' }));
    await deleteSubmission('x');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/x');
    expect(opts.method).toBe('DELETE');
  });
});

describe('restoreSubmission()', () => {
  it('POSTs to /submissions/{id}/restore', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: 'x', version: 4, message: 'Restored' }));
    await restoreSubmission('x');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/x/restore');
    expect(opts.method).toBe('POST');
  });
});

describe('getSubmissionHistory()', () => {
  it('GETs /submissions/{id}/history', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissionId: 'x', versions: [], count: 0 }));
    await getSubmissionHistory('x');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/x/history');
  });
});

describe('listAllSubmissions()', () => {
  it('GETs /submissions/all with status param', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));
    await listAllSubmissions('active');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/all?status=active');
  });
});

describe('getSubmission()', () => {
  it('returns first active version from history', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        submissionId: 'x',
        versions: [
          { submissionId: 'x', version: 2, status: 'active', studyTitle: 'V2' },
          { submissionId: 'x', version: 1, status: 'superseded', studyTitle: 'V1' },
        ],
        count: 2,
      }),
    );
    const result = await getSubmission('x');
    expect(result.status).toBe('active');
    expect(result.version).toBe(2);
  });

  it('throws when no active version found', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        submissionId: 'x',
        versions: [{ submissionId: 'x', version: 1, status: 'archived' }],
        count: 1,
      }),
    );
    await expect(getSubmission('x')).rejects.toThrow('Submission not found');
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe('error handling', () => {
  it('throws with status and details on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(400, {
        error: 'Validation failed',
        details: [{ field: 'name', message: 'required' }],
      }),
    );
    try {
      await listSubmissions();
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      const error = err as Error & { status?: number; details?: unknown[] };
      expect(error.message).toBe('Validation failed');
      expect(error.status).toBe(400);
      expect(error.details).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// File upload API
// ---------------------------------------------------------------------------
describe('getUploadUrl()', () => {
  it('POSTs to /submissions/{id}/upload-url', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ uploadUrl: 'https://s3.example.com', key: 'k', filename: 'f.pdf' }),
    );
    const result = await getUploadUrl('sub-1', 'f.pdf', 'application/pdf');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/sub-1/upload-url');
    expect(opts.method).toBe('POST');
    expect(result.uploadUrl).toBe('https://s3.example.com');
  });
});

describe('uploadFileToS3()', () => {
  it('PUTs file to presigned URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    await uploadFileToS3('https://s3.example.com/upload', file);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://s3.example.com/upload');
    expect(opts.method).toBe('PUT');
    expect(opts.headers['Content-Type']).toBe('text/plain');
  });

  it('throws on upload failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: 'Forbidden' });
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    await expect(uploadFileToS3('https://s3.example.com/upload', file)).rejects.toThrow('Upload failed');
  });
});

// ---------------------------------------------------------------------------
// Auth headers (with Cognito configured)
// ---------------------------------------------------------------------------
describe('auth headers', () => {
  it('does not inject Authorization header when Cognito is not configured', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));
    await listSubmissions();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });
});
