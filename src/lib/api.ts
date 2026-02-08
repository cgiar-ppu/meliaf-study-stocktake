import { fetchAuthSession } from 'aws-amplify/auth';
import { isCognitoConfigured } from '@/lib/amplify';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!isCognitoConfigured) return {};
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // No valid session — proceed without auth header
  }
  return {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json();

  if (!response.ok) {
    const err = body as ApiError;
    const error = new Error(err.error || 'Request failed') as Error & { status?: number; details?: ApiError['details'] };
    error.status = response.status;
    error.details = err.details;
    throw error;
  }

  return body as T;
}

// --- Submissions API ---

export interface CreateSubmissionResponse {
  submissionId: string;
  version: number;
  message: string;
}

export interface ListSubmissionsResponse {
  submissions: SubmissionItem[];
  count: number;
}

export interface SubmissionItem {
  submissionId: string;
  version: number;
  status: string;
  userId: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
  studyTitle: string;
  studyType: string;
  leadCenter: string;
  contactName: string;
  contactEmail: string;
  [key: string]: unknown;
}

export interface SubmissionHistoryResponse {
  submissionId: string;
  versions: SubmissionItem[];
  count: number;
}

function serializeDates(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val instanceof Date) {
      result[key] = val.toISOString().split('T')[0];
    }
  }
  return result;
}

export function submitStudy(data: Record<string, unknown>): Promise<CreateSubmissionResponse> {
  return request<CreateSubmissionResponse>('/submissions', {
    method: 'POST',
    body: JSON.stringify(serializeDates(data)),
  });
}

export function listSubmissions(status = 'active'): Promise<ListSubmissionsResponse> {
  const params = new URLSearchParams({ status });
  return request<ListSubmissionsResponse>(`/submissions?${params}`);
}

export function getSubmissionHistory(id: string): Promise<SubmissionHistoryResponse> {
  return request<SubmissionHistoryResponse>(`/submissions/${id}/history`);
}
