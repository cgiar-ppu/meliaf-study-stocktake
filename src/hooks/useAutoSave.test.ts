import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// We need to mock the form's watch method
const mockUnsubscribe = vi.fn();
const mockWatch = vi.fn(() => ({ unsubscribe: mockUnsubscribe }));

function createMockForm() {
  return {
    watch: mockWatch,
    getValues: vi.fn(),
    setValue: vi.fn(),
    reset: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
  } as unknown as import('react-hook-form').UseFormReturn<import('@/lib/formSchema').StudyFormData>;
}

// Storage mock
let storage: Record<string, string> = {};
const mockStorage = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key];
  }),
  clear: vi.fn(() => {
    storage = {};
  }),
  get length() {
    return Object.keys(storage).length;
  },
  key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
};

beforeEach(() => {
  vi.useFakeTimers();
  storage = {};
  mockWatch.mockClear();
  mockUnsubscribe.mockClear();
  vi.stubGlobal('localStorage', mockStorage);
  mockStorage.getItem.mockClear();
  mockStorage.setItem.mockClear();
  mockStorage.removeItem.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Import after mocks are set up
import { useAutoSave } from './useAutoSave';

// ---------------------------------------------------------------------------
// loadDraft
// ---------------------------------------------------------------------------
describe('loadDraft()', () => {
  it('returns parsed draft from localStorage', () => {
    const data = { studyTitle: 'Test Study', leadCenter: 'CIAT' };
    storage['meliaf_study_draft'] = JSON.stringify(data);

    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const loaded = result.current.loadDraft();
    expect(loaded).toEqual(data);
  });

  it('converts date strings back to Date objects', () => {
    const data = { startDate: '2025-06-15T00:00:00.000Z', expectedEndDate: '2025-12-31T00:00:00.000Z' };
    storage['meliaf_study_draft'] = JSON.stringify(data);

    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const loaded = result.current.loadDraft();
    expect(loaded.startDate).toBeInstanceOf(Date);
    expect(loaded.expectedEndDate).toBeInstanceOf(Date);
  });

  it('returns null when no draft exists', () => {
    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const loaded = result.current.loadDraft();
    expect(loaded).toBeNull();
  });

  it('returns null when localStorage has invalid JSON', () => {
    storage['meliaf_study_draft'] = 'not-valid-json{{{';

    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const loaded = result.current.loadDraft();
    expect(loaded).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// saveDraft
// ---------------------------------------------------------------------------
describe('saveDraft()', () => {
  it('saves serialized data to localStorage', () => {
    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const data = { studyTitle: 'Saved Study' } as import('@/lib/formSchema').StudyFormData;

    act(() => {
      result.current.saveDraft(data);
    });

    expect(mockStorage.setItem).toHaveBeenCalledWith('meliaf_study_draft', JSON.stringify(data));
  });

  it('skips save when data has not changed', () => {
    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const data = { studyTitle: 'Same' } as import('@/lib/formSchema').StudyFormData;

    act(() => {
      result.current.saveDraft(data);
    });
    mockStorage.setItem.mockClear();

    act(() => {
      const saved = result.current.saveDraft(data);
      expect(saved).toBe(false);
    });
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('returns false when localStorage throws', () => {
    mockStorage.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const data = { studyTitle: 'Big Study' } as import('@/lib/formSchema').StudyFormData;

    let saved: boolean;
    act(() => {
      saved = result.current.saveDraft(data);
    });
    expect(saved!).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearDraft
// ---------------------------------------------------------------------------
describe('clearDraft()', () => {
  it('removes draft from localStorage', () => {
    storage['meliaf_study_draft'] = JSON.stringify({ title: 'old' });

    const { result } = renderHook(() => useAutoSave(createMockForm()));
    act(() => {
      result.current.clearDraft();
    });

    expect(mockStorage.removeItem).toHaveBeenCalledWith('meliaf_study_draft');
  });

  it('allows subsequent save to write after clear', () => {
    const { result } = renderHook(() => useAutoSave(createMockForm()));
    const data = { studyTitle: 'First' } as import('@/lib/formSchema').StudyFormData;

    act(() => {
      result.current.saveDraft(data);
    });

    act(() => {
      result.current.clearDraft();
    });
    mockStorage.setItem.mockClear();

    act(() => {
      const saved = result.current.saveDraft(data);
      expect(saved).toBe(true);
    });
    expect(mockStorage.setItem).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// hasDraft
// ---------------------------------------------------------------------------
describe('hasDraft()', () => {
  it('returns true when draft exists', () => {
    storage['meliaf_study_draft'] = JSON.stringify({ title: 'exists' });

    const { result } = renderHook(() => useAutoSave(createMockForm()));
    expect(result.current.hasDraft()).toBe(true);
  });

  it('returns false when no draft', () => {
    const { result } = renderHook(() => useAutoSave(createMockForm()));
    expect(result.current.hasDraft()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// auto-save effect
// ---------------------------------------------------------------------------
describe('auto-save effect', () => {
  it('subscribes to form.watch on mount', () => {
    renderHook(() => useAutoSave(createMockForm()));
    expect(mockWatch).toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAutoSave(createMockForm()));
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
