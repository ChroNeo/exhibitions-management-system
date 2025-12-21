import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE;

interface VisitorInfo {
  full_name: string;
  picture_url: string | null;
  checkin_at: Date;
}

interface ScanResult {
  success: boolean;
  message: string;
  visitor?: VisitorInfo;
  code?: string;
}

export type VerifyTicketState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: ScanResult }
  | { status: 'error'; message: string };

export function useVerifyTicket() {
  const [state, setState] = useState<VerifyTicketState>({ status: 'idle' });

  const verifyTicket = useCallback(async (token: string) => {
    setState({ status: 'loading' });

    try {
      const response = await axios.post<ScanResult>(`${API_URL}/ticket/verify`, {
        token: token
      });

      setState({
        status: 'success',
        result: response.data
      });

      return response.data;
    } catch (err: any) {
      let errorMessage = 'Connection Error - Cannot connect to server';
      let scanResult: ScanResult | null = null;

      if (err.response?.data) {
        scanResult = err.response.data;
        setState({
          status: 'success',
          result: scanResult
        });
        return scanResult;
      } else {
        setState({
          status: 'error',
          message: errorMessage
        });
        throw new Error(errorMessage);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    verifyTicket,
    reset,
    isLoading: state.status === 'loading',
    isIdle: state.status === 'idle',
    isError: state.status === 'error',
    result: state.status === 'success' ? state.result : null,
    error: state.status === 'error' ? state.message : null
  };
}
