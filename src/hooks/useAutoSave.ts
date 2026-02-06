import { useEffect, useRef, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { StudyFormData } from '@/lib/formSchema';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'meliaf_study_draft';
const AUTOSAVE_DELAY = 2000; // 2 seconds

export function useAutoSave(form: UseFormReturn<StudyFormData>) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.expectedEndDate) parsed.expectedEndDate = new Date(parsed.expectedEndDate);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback((data: StudyFormData) => {
    try {
      const serialized = JSON.stringify(data);
      // Only save if data has changed
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(STORAGE_KEY, serialized);
        lastSavedRef.current = serialized;
        return true;
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
    return false;
  }, []);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      lastSavedRef.current = '';
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (saveDraft(value as StudyFormData)) {
          // Optionally show a subtle toast
          // toast({ title: 'Draft saved', duration: 1000 });
        }
      }, AUTOSAVE_DELAY);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [form, saveDraft]);

  // Check for existing draft on mount
  const hasDraft = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}
