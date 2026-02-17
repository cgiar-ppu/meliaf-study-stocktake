import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock amplify with Cognito ENABLED (the main api.test.ts uses false)
vi.mock('@/lib/amplify', () => ({
  isCognitoConfigured: true,
}));

const mockFetchAuthSession = vi.fn();
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
}));

// Must import after mocks are set up
import { listSubmissions, listFiles, deleteFile } from './api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();

function mockOkResponse(body: unknown) {
  return { ok: true, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
  mockFetchAuthSession.mockReset();
  vi.stubEnv('VITE_API_URL', 'https://api.test.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Auth header injection (Cognito enabled)
// ---------------------------------------------------------------------------
describe('auth headers with Cognito enabled', () => {
  it('injects Authorization header when session has id token', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: { idToken: { toString: () => 'tok123' } },
    });
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));

    await listSubmissions();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tok123');
  });

  it('omits Authorization header when fetchAuthSession throws', async () => {
    mockFetchAuthSession.mockRejectedValue(new Error('session expired'));
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));

    await listSubmissions();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it('omits Authorization header when tokens is null', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: null });
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));

    await listSubmissions();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it('omits Authorization header when idToken is missing', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: { idToken: undefined } });
    mockFetch.mockResolvedValueOnce(mockOkResponse({ submissions: [], count: 0 }));

    await listSubmissions();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// listFiles / deleteFile
// ---------------------------------------------------------------------------
describe('listFiles()', () => {
  it('GETs /submissions/{id}/files', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: null });
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ files: [{ key: 'k', filename: 'f.pdf', size: 100, downloadUrl: 'https://s3.example.com' }] }),
    );

    const result = await listFiles('sub-1');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/sub-1/files');
    expect(result.files).toHaveLength(1);
  });
});

describe('deleteFile()', () => {
  it('DELETEs /submissions/{id}/files/{filename}', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: null });
    mockFetch.mockResolvedValueOnce(mockOkResponse({ message: 'Deleted' }));

    await deleteFile('sub-1', 'report.pdf');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/sub-1/files/report.pdf');
    expect(opts.method).toBe('DELETE');
  });

  it('URL-encodes special characters in filename', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: null });
    mockFetch.mockResolvedValueOnce(mockOkResponse({ message: 'Deleted' }));

    await deleteFile('sub-1', 'my file (1).pdf');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/submissions/sub-1/files/my%20file%20(1).pdf');
  });
});
