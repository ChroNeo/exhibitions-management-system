import { useQuery } from "@tanstack/react-query";
import { getOrgDashboard } from "../../../api/dashboardApi";

export function useOrgDashboard(exhibitionId: number) {
  return useQuery({
    queryKey: ["org", "dashboard", exhibitionId],
    queryFn: () => getOrgDashboard(exhibitionId),
    enabled: exhibitionId > 0,
  });
}
