import { useCallback } from 'react';
import { useLiff } from '../../../hooks';
import { getStaffDashboardLiff, getStaffUnitMe } from '../../../api/dashboardApi';
import type { StaffDashboardData } from '../../../api/dashboardApi';

interface UseUnitDashboardLiffOptions {
  exId?: string | null;
  unitId?: string | null;
}

export function useUnitDashboardLiff({ exId, unitId }: UseUnitDashboardLiffOptions = {}) {
  const fetchData = useCallback(async (): Promise<StaffDashboardData> => {
    let resolvedExId = exId ? Number(exId) : null;
    let resolvedUnitId = unitId ? Number(unitId) : null;

    // Auto-resolve from LIFF user if URL params are missing
    if (!resolvedExId || !resolvedUnitId) {
      const ids = await getStaffUnitMe();
      resolvedExId = ids.ex_id;
      resolvedUnitId = ids.unit_id;
    }

    return await getStaffDashboardLiff(resolvedExId, resolvedUnitId);
  }, [exId, unitId]);

  return useLiff({
    liffApp: 'STAFF_DASHBOARD',
    fetchData,
    dependencies: [exId, unitId],
  });
}
