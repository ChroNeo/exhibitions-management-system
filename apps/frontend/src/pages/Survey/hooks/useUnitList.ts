import { useCallback } from 'react';
import { useLiff } from '../../../hooks';
import { getCheckedInUnits, type CheckedInUnit } from '../../../api/tickets';

interface UseUnitListOptions {
  exhibitionId?: string | null;
}

export function useUnitList({ exhibitionId }: UseUnitListOptions = {}) {
  const fetchData = useCallback(async (): Promise<CheckedInUnit[]> => {
    if (!exhibitionId) {
      return [];
    }

    return await getCheckedInUnits(exhibitionId);
  }, [exhibitionId]);

  return useLiff({
    liffApp: 'SURVEY',
    fetchData,
    dependencies: [exhibitionId],
  });
}
