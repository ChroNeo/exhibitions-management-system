import { useQuery } from "@tanstack/react-query";
import { getStaffDashboard } from "../../../api/dashboardApi";

export function useStaffDashboard(exId: number, unitId: number) {
  return useQuery({
    queryKey: ["staff", "dashboard", exId, unitId],
    queryFn: () => getStaffDashboard(exId, unitId),
    enabled: exId > 0 && unitId > 0,
  });
}
