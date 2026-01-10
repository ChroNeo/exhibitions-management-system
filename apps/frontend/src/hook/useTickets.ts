import { useCallback, useState, useEffect } from 'react';
import { useLiff } from './useLiff';
import { fetchQRToken } from '../api/tickets';

export interface TicketData {
  qrToken: string;
  expiresAt: Date;
  expiresIn: number;
}

interface UseTicketsOptions {
  exhibitionId?: string | null;
  autoRefresh?: boolean;
}

export function useTickets({ exhibitionId, autoRefresh = true }: UseTicketsOptions = {}) {
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (): Promise<TicketData> => {
    if (!exhibitionId) {
      throw new Error('No exhibition selected');
    }

    const { qr_token, expires_in } = await fetchQRToken(exhibitionId);
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    return {
      qrToken: qr_token,
      expiresAt,
      expiresIn: expires_in,
    };
  }, [exhibitionId]);

  const { state, refetch, initializeLiff } = useLiff({
    liffApp: 'TICKET',
    fetchData,
    dependencies: [exhibitionId],
  });

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && state.status === 'success') {
      const timeoutId = setTimeout(refetch, state.data.expiresIn * 1000);
      setRefreshTimeoutId(timeoutId);
      return () => clearTimeout(timeoutId);
    }
  }, [state, autoRefresh, refetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
    };
  }, [refreshTimeoutId]);

  return { state, refetch, initializeLiff };
}
