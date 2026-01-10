import { useState, useCallback, useEffect } from 'react';
import liff from '@line/liff';
import { handleLiffError, performLogout } from '../utils/liffErrorHandler';
import { LIFF_CONFIG, type LiffAppType } from '../config/liff';

export type LiffState<T> =
  | { status: 'initializing' }
  | { status: 'not_logged_in' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

interface UseLiffOptions<T> {
  liffApp: LiffAppType;
  fetchData: () => Promise<T>;
  dependencies?: any[];
}

export function useLiff<T>({ liffApp, fetchData, dependencies = [] }: UseLiffOptions<T>) {
  const [state, setState] = useState<LiffState<T>>({ status: 'initializing' });

  const fetch = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const data = await fetchData();
      setState({ status: 'success', data });
    } catch (error) {
      console.error('Failed to fetch data:', error);

      const errorResult = handleLiffError(error, 'Failed to load data');

      if (errorResult.shouldLogout) {
        setState({ status: 'not_logged_in' });
        performLogout();
        return;
      }

      setState({ status: 'error', message: errorResult.message });
    }
  }, [fetchData]);

  const initializeLiff = useCallback(async () => {
    try {
      // Check if LIFF is already initialized
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG[liffApp] });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: 'not_logged_in' });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetch();
    } catch (error) {
      console.error('LIFF init error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'LIFF Init Failed',
      });
    }
  }, [liffApp, fetch]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return {
    state,
    refetch: fetch,
    initializeLiff,
  };
}
