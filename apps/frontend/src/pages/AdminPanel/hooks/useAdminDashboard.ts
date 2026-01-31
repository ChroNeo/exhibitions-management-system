import { useQuery } from "@tanstack/react-query";
import {
  getDashboardExhibitions,
  getExhibitionRegistrations,
} from "../../../api/adminDashboardApi";

export function useAdminExhibitions() {
  return useQuery({
    queryKey: ["admin", "exhibitions"],
    queryFn: getDashboardExhibitions,
  });
}

export function useExhibitionRegistrations(exhibitionId: number | null) {
  return useQuery({
    queryKey: ["admin", "registrations", exhibitionId],
    queryFn: () => getExhibitionRegistrations(exhibitionId!),
    enabled: exhibitionId !== null,
  });
}
