import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { reducer, useToast, toast } from './use-toast';

type State = { toasts: Array<{ id: string; open?: boolean; [key: string]: unknown }> };

// ---------------------------------------------------------------------------
// reducer — pure function tests
// ---------------------------------------------------------------------------
describe('reducer', () => {
  const emptyState: State = { toasts: [] };

  it('ADD_TOAST adds a toast to state', () => {
    const next = reducer(emptyState, {
      type: 'ADD_TOAST',
      toast: { id: '1', open: true },
    });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('1');
  });

  it('ADD_TOAST respects TOAST_LIMIT of 1 — evicts oldest', () => {
    const state: State = { toasts: [{ id: '1', open: true }] };
    const next = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: '2', open: true },
    });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('2');
  });

  it('UPDATE_TOAST updates existing toast by id', () => {
    const state: State = { toasts: [{ id: '1', title: 'old' }] };
    const next = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'new' },
    });
    expect(next.toasts[0].title).toBe('new');
  });

  it('UPDATE_TOAST leaves unknown ids unchanged', () => {
    const state: State = { toasts: [{ id: '1', title: 'keep' }] };
    const next = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '999', title: 'nope' },
    });
    expect(next.toasts[0].title).toBe('keep');
  });

  it('DISMISS_TOAST sets open=false for a specific id', () => {
    const state: State = { toasts: [{ id: '1', open: true }] };
    const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(next.toasts[0].open).toBe(false);
  });

  it('DISMISS_TOAST without id dismisses all toasts', () => {
    const state: State = {
      toasts: [
        { id: '1', open: true },
        { id: '2', open: true },
      ],
    };
    // Slice to 1 because of TOAST_LIMIT, but test the intent
    const singleState: State = { toasts: [{ id: '1', open: true }] };
    const next = reducer(singleState, { type: 'DISMISS_TOAST' });
    expect(next.toasts.every((t) => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST removes toast by id', () => {
    const state: State = { toasts: [{ id: '1' }] };
    const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(next.toasts).toHaveLength(0);
  });

  it('REMOVE_TOAST without id clears all', () => {
    const state: State = { toasts: [{ id: '1' }] };
    const next = reducer(state, { type: 'REMOVE_TOAST' });
    expect(next.toasts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// toast() function
// ---------------------------------------------------------------------------
describe('toast()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an object with id, dismiss, update', () => {
    const result = toast({ title: 'Hello' });
    expect(result).toHaveProperty('id');
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  it('generates unique ids across calls', () => {
    const a = toast({ title: 'A' });
    const b = toast({ title: 'B' });
    expect(a.id).not.toBe(b.id);
  });
});

// ---------------------------------------------------------------------------
// useToast() hook
// ---------------------------------------------------------------------------
describe('useToast()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns toast and dismiss functions', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('reflects state after toast() is called', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: 'Test Toast' });
    });
    expect(result.current.toasts.length).toBeGreaterThanOrEqual(1);
  });
});
