import { useState, useCallback, useEffect } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { getQuestionsByExhibitionLiff } from '../api/survey';
import type { QuestionWithSet } from '../types/survey';

// Configuration - placeholder LIFF ID, will be replaced by user
const LIFF_CONFIG = {
  liffId: '2008498720-Sd7gGdIL', // TODO: Replace with actual LIFF ID
  apiUrl: import.meta.env.VITE_API_BASE
};

export type SurveyState =
  | { status: 'initializing' }
  | { status: 'not_logged_in' }
  | { status: 'loading' }
  | { status: 'success'; questions: QuestionWithSet[] }
  | { status: 'error'; message: string };

interface UseSurveyLiffOptions {
  exhibitionId?: string | null;
}

export function useSurveyLiff(options: UseSurveyLiffOptions = {}) {
  const { exhibitionId } = options;
  const [state, setState] = useState<SurveyState>({ status: 'initializing' });

  const fetchQuestions = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      if (!exhibitionId) {
        throw new Error(
          'No exhibition selected. Please provide a valid exhibition ID.'
        );
      }

      const questions = await getQuestionsByExhibitionLiff({
        exhibition_id: exhibitionId,
        type: 'EXHIBITION',
      });

      setState({
        status: 'success',
        questions,
      });
    } catch (error) {
      // Handle 401 Unauthorized - token expired, logout and redirect to login
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setState({ status: 'not_logged_in' });
        // Logout first to clear the expired token, then login again
        if (liff.isLoggedIn()) {
          liff.logout();
        }
        liff.login({ redirectUri: window.location.href });
        return;
      }

      let errorMessage = 'Failed to load survey questions';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          errorMessage = 'Cannot reach server.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState({ status: 'error', message: errorMessage });
    }
  }, [exhibitionId]);

  const initializeLiff = useCallback(async () => {
    try {
      // Check if LIFF is already initialized
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG.liffId });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: 'not_logged_in' });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetchQuestions();
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'LIFF Init Failed',
      });
    }
  }, [fetchQuestions]);

  // Initialize LIFF on mount
  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return {
    state,
    refetch: fetchQuestions,
    initializeLiff,
  };
}
