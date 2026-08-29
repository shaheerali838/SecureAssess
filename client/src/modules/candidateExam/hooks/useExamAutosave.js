import { useState, useRef, useCallback } from 'react';
import examService from '../services/exam.service';

export const useExamAutosave = (attemptId, debounceMs = 800) => {
  const [savingStatus, setSavingStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const debounceTimers = useRef({});

  const saveAnswer = useCallback(
    (questionId, answer, immediate = false) => {
      if (!attemptId || !questionId) return;

      if (debounceTimers.current[questionId]) {
        clearTimeout(debounceTimers.current[questionId]);
      }

      const executeSave = async () => {
        setSavingStatus('saving');
        try {
          await examService.saveAnswer(attemptId, questionId, answer);
          setSavingStatus('saved');
          setTimeout(() => setSavingStatus('idle'), 2000);
        } catch (err) {
          console.error('Failed to autosave answer:', err);
          setSavingStatus('error');
        }
      };

      if (immediate) {
        executeSave();
      } else {
        setSavingStatus('saving');
        debounceTimers.current[questionId] = setTimeout(executeSave, debounceMs);
      }
    },
    [attemptId, debounceMs]
  );

  return {
    saveAnswer,
    savingStatus,
  };
};

export default useExamAutosave;
