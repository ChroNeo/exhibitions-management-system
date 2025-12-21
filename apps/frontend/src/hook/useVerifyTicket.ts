import { useState, useCallback, useEffect } from 'react';
import liff from '@line/liff';
import { verifyTicket as verifyTicketApi, type ScanResult } from '../api/tickets';

// Configuration
const LIFF_CONFIG = {
  liffId: '2008498720-ohfO7MNd',
};

export type VerifyTicketState =
  | { status: 'initializing' }
  | { status: 'not_logged_in' }
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: ScanResult }
  | { status: 'error'; message: string };

interface UseVerifyTicketOptions {
  enableLiff?: boolean;
}

export function useVerifyTicket(options: UseVerifyTicketOptions = {}) {
  const { enableLiff = false } = options;
  const [state, setState] = useState<VerifyTicketState>(
    enableLiff ? { status: 'initializing' } : { status: 'idle' }
  );

  const verifyTicket = useCallback(async (token: string) => {
    setState({ status: 'loading' });

    try {
      const data = await verifyTicketApi(token);

      setState({
        status: 'success',
        result: data
      });

      return data;
    } catch {
      const errorMessage = 'Connection Error - Cannot connect to server';

      setState({
        status: 'error',
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const initializeLiff = useCallback(async () => {
    if (!enableLiff) return;

    try {
      console.log('Initializing LIFF for verification...');

      // Check if LIFF is already initialized
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG.liffId });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: 'not_logged_in' });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      setState({ status: 'idle' });
      console.log('LIFF initialized successfully');
    } catch (error) {
      console.error('LIFF init error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'LIFF Init Failed',
      });
    }
  }, [enableLiff]);

  // Initialize LIFF on mount if enabled
  useEffect(() => {
    if (enableLiff) {
      initializeLiff();
    }
  }, [enableLiff, initializeLiff]);

  return {
    state,
    verifyTicket,
    reset,
    initializeLiff,
    isLoading: state.status === 'loading',
    isIdle: state.status === 'idle',
    isError: state.status === 'error',
    result: state.status === 'success' ? state.result : null,
    error: state.status === 'error' ? state.message : null
  };
}
