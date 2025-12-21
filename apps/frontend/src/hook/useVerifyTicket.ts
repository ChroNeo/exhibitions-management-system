import { useState, useCallback } from 'react';
import { verifyTicket as verifyTicketApi, type ScanResult } from '../api/tickets';

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
