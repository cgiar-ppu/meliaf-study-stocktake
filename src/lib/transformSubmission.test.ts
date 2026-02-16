import { describe, it, expect } from 'vitest';
import { transformSubmissionToFormData } from './transformSubmission';
import type { SubmissionItem } from '@/lib/api';

function makeSubmission(overrides: Record<string, unknown> = {}): SubmissionItem {
  return {
    submissionId: 'sub-001',
    version: 3,
    status: 'active',
    userId: 'user-001',
    modifiedBy: 'user-001',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-03-20T14:30:00Z',
    studyTitle: 'Impact of seeds',
    studyType: 'causal_impact',
    leadCenter: 'CIAT',
    contactName: 'Jane Doe',
    contactEmail: 'jane@cgiar.org',
    ...overrides,
  } as SubmissionItem;
}

// ---------------------------------------------------------------------------
// Metadata stripping
// ---------------------------------------------------------------------------
describe('transformSubmissionToFormData — metadata stripping', () => {
  it('removes all metadata keys', () => {
    const result = transformSubmissionToFormData(makeSubmission());
    expect(result).not.toHaveProperty('submissionId');
    expect(result).not.toHaveProperty('version');
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('userId');
    expect(result).not.toHaveProperty('modifiedBy');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('updatedAt');
  });

  it('preserves form data fields', () => {
    const result = transformSubmissionToFormData(makeSubmission());
    expect(result.studyTitle).toBe('Impact of seeds');
    expect(result.leadCenter).toBe('CIAT');
  });
});

// ---------------------------------------------------------------------------
// Date conversion
// ---------------------------------------------------------------------------
describe('transformSubmissionToFormData — date conversion', () => {
  it('converts startDate string to Date object', () => {
    const result = transformSubmissionToFormData(
      makeSubmission({ startDate: '2025-03-15' }),
    );
    expect(result.startDate).toBeInstanceOf(Date);
    const d = result.startDate as Date;
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2); // 0-indexed: March = 2
    expect(d.getDate()).toBe(15);
  });

  it('converts expectedEndDate string to Date object', () => {
    const result = transformSubmissionToFormData(
      makeSubmission({ expectedEndDate: '2025-12-01' }),
    );
    expect(result.expectedEndDate).toBeInstanceOf(Date);
    const d = result.expectedEndDate as Date;
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11); // 0-indexed: December = 11
    expect(d.getDate()).toBe(1);
  });

  it('leaves empty startDate as-is', () => {
    const result = transformSubmissionToFormData(
      makeSubmission({ startDate: '' }),
    );
    expect(result.startDate).toBe('');
  });

  it('leaves missing date as-is', () => {
    const result = transformSubmissionToFormData(makeSubmission());
    expect(result.startDate).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Numeric coercion — sampleSize
// ---------------------------------------------------------------------------
describe('transformSubmissionToFormData — sampleSize coercion', () => {
  it('converts string number to number', () => {
    const result = transformSubmissionToFormData(makeSubmission({ sampleSize: '100' }));
    expect(result.sampleSize).toBe(100);
  });

  it('converts empty string to empty string', () => {
    const result = transformSubmissionToFormData(makeSubmission({ sampleSize: '' }));
    expect(result.sampleSize).toBe('');
  });

  it('converts undefined to empty string', () => {
    const result = transformSubmissionToFormData(makeSubmission({ sampleSize: undefined }));
    expect(result.sampleSize).toBe('');
  });

  it('converts non-numeric string to empty string', () => {
    const result = transformSubmissionToFormData(makeSubmission({ sampleSize: 'abc' }));
    expect(result.sampleSize).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Numeric coercion — totalCostUSD
// ---------------------------------------------------------------------------
describe('transformSubmissionToFormData — totalCostUSD coercion', () => {
  it('converts string number to number', () => {
    const result = transformSubmissionToFormData(makeSubmission({ totalCostUSD: '50000' }));
    expect(result.totalCostUSD).toBe(50000);
  });

  it('leaves empty string as-is', () => {
    const result = transformSubmissionToFormData(makeSubmission({ totalCostUSD: '' }));
    expect(result.totalCostUSD).toBe('');
  });

  it('converts non-numeric string to undefined', () => {
    const result = transformSubmissionToFormData(makeSubmission({ totalCostUSD: 'abc' }));
    expect(result.totalCostUSD).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Numeric coercion — dataCollectionRounds
// ---------------------------------------------------------------------------
describe('transformSubmissionToFormData — dataCollectionRounds coercion', () => {
  it('converts string number to number', () => {
    const result = transformSubmissionToFormData(makeSubmission({ dataCollectionRounds: '3' }));
    expect(result.dataCollectionRounds).toBe(3);
  });

  it('converts empty string to empty string', () => {
    const result = transformSubmissionToFormData(makeSubmission({ dataCollectionRounds: '' }));
    expect(result.dataCollectionRounds).toBe('');
  });

  it('converts undefined to empty string', () => {
    const result = transformSubmissionToFormData(makeSubmission({ dataCollectionRounds: undefined }));
    expect(result.dataCollectionRounds).toBe('');
  });

  it('converts non-numeric string to empty string', () => {
    const result = transformSubmissionToFormData(makeSubmission({ dataCollectionRounds: 'abc' }));
    expect(result.dataCollectionRounds).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Pass-through
// ---------------------------------------------------------------------------
describe('transformSubmissionToFormData — pass-through', () => {
  it('passes string fields through unchanged', () => {
    const result = transformSubmissionToFormData(
      makeSubmission({ contactEmail: 'test@example.org' }),
    );
    expect(result.contactEmail).toBe('test@example.org');
  });

  it('passes array fields through unchanged', () => {
    const result = transformSubmissionToFormData(
      makeSubmission({ otherCenters: ['IRRI', 'IFPRI'] }),
    );
    expect((result as Record<string, unknown>).otherCenters).toEqual(['IRRI', 'IFPRI']);
  });
});
