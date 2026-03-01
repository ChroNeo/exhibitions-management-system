import { useEffect, useState } from "react";
import { fetchUnitDashboardMock } from "../mocks/mockUnitDashboard.service";
import type { UnitDashboardResponse } from "../mocks/mockUnitDashboard";

export function useUnitDashboard(unitId: number) {
  const [data, setData] = useState<UnitDashboardResponse | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchUnitDashboardMock(unitId)
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [unitId]);

  return { data, isLoading, error };
}
