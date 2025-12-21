import { useState, useCallback, useEffect } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { fetchQRToken } from '../api/tickets';

// Configuration
const LIFF_CONFIG = {
  liffId: '2008498720-IgQ8sUzW',
  apiUrl: import.meta.env.VITE_API_BASE
};

export type TicketState =
  | { status: 'initializing' }
  | { status: 'not_logged_in' }
  | { status: 'loading' }
  | { status: 'success'; qrToken: string; expiresAt: Date; expiresIn: number }
  | { status: 'error'; message: string };

interface UseTicketsOptions {
  exhibitionId?: string | null;
  autoRefresh?: boolean;
}

export function useTickets(options: UseTicketsOptions = {}) {
  const { exhibitionId, autoRefresh = true } = options;
  const [state, setState] = useState<TicketState>({ status: 'initializing' });
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const fetchQRCode = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      if (!exhibitionId) {
        throw new Error(
          'No exhibition selected. Please select an exhibition from the list.'
        );
      }

      console.log(`Fetching QR code for Exhibition ID: ${exhibitionId}...`);

      const { qr_token, expires_in } = await fetchQRToken(exhibitionId);
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      console.log('QR code received successfully');

      setState({
        status: 'success',
        qrToken: qr_token,
        expiresAt,
        expiresIn: expires_in,
      });

      // Auto-refresh logic
      if (autoRefresh) {
        const timeoutId = setTimeout(() => {
          fetchQRCode();
        }, expires_in * 1000);
        setRefreshTimeoutId(timeoutId);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      let errorMessage = 'Failed to generate QR code';

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
  }, [exhibitionId, autoRefresh]);

  const initializeLiff = useCallback(async () => {
    try {
      console.log('Initializing LIFF...');

      // Check if LIFF is already initialized
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG.liffId });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: 'not_logged_in' });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetchQRCode();
    } catch (error) {
      console.error('LIFF init error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'LIFF Init Failed',
      });
    }
  }, [fetchQRCode]);

  // Initialize LIFF on mount
  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
    };
  }, [refreshTimeoutId]);

  return {
    state,
    refetch: fetchQRCode,
    initializeLiff,
  };
}
