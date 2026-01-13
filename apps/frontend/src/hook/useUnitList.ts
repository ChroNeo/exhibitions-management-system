import { useCallback } from 'react';
import { useLiff } from './useLiff';
import { getCheckedInUnits, type CheckedInUnit } from '../api/tickets';

interface UseUnitListOptions {
  exhibitionId?: string | null;
}

export function useUnitList({ exhibitionId }: UseUnitListOptions = {}) {
  const fetchData = useCallback(async (): Promise<CheckedInUnit[]> => {
    if (!exhibitionId) {
      throw new Error('Exhibition ID is required');
    }

    return await getCheckedInUnits(exhibitionId);
  }, [exhibitionId]);

  return useLiff({
    liffApp: 'SURVEY',
    fetchData,
    dependencies: [exhibitionId],
  });
}
