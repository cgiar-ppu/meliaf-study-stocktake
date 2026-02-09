import type { SubmissionItem } from '@/lib/api';
import type { StudyFormData } from '@/lib/formSchema';

const METADATA_KEYS = [
  'submissionId',
  'version',
  'status',
  'userId',
  'modifiedBy',
  'createdAt',
  'updatedAt',
] as const;

/**
 * Convert a SubmissionItem (API response with string dates and string numbers)
 * into StudyFormData (Date objects, proper number types) suitable for the form.
 */
export function transformSubmissionToFormData(item: SubmissionItem): Partial<StudyFormData> {
  // Start with a shallow copy, then strip metadata
  const raw: Record<string, unknown> = { ...item };
  for (const key of METADATA_KEYS) {
    delete raw[key];
  }

  // Parse date strings → Date objects (append T00:00:00 to avoid timezone shift)
  if (typeof raw.startDate === 'string' && raw.startDate) {
    raw.startDate = new Date(`${raw.startDate}T00:00:00`);
  }
  if (typeof raw.expectedEndDate === 'string' && raw.expectedEndDate) {
    raw.expectedEndDate = new Date(`${raw.expectedEndDate}T00:00:00`);
  }

  // Coerce numeric fields
  if (raw.sampleSize !== undefined && raw.sampleSize !== '' && raw.sampleSize !== null) {
    raw.sampleSize = Number(raw.sampleSize);
    if (isNaN(raw.sampleSize as number)) raw.sampleSize = '';
  } else {
    raw.sampleSize = '';
  }

  if (raw.totalCostUSD !== undefined && raw.totalCostUSD !== '' && raw.totalCostUSD !== null) {
    raw.totalCostUSD = Number(raw.totalCostUSD);
    if (isNaN(raw.totalCostUSD as number)) raw.totalCostUSD = undefined;
  }

  if (raw.dataCollectionRounds !== undefined && raw.dataCollectionRounds !== '' && raw.dataCollectionRounds !== null) {
    raw.dataCollectionRounds = Number(raw.dataCollectionRounds);
    if (isNaN(raw.dataCollectionRounds as number)) raw.dataCollectionRounds = '';
  } else {
    raw.dataCollectionRounds = '';
  }

  return raw as Partial<StudyFormData>;
}
