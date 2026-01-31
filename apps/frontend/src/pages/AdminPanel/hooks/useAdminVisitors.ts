import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVisitors,
  getVisitorDetail,
  getVisitorExhibitions,
  getUnitCheckins,
  toggleCheckin,
} from "../../../api/adminVisitorApi";

export function useVisitors() {
  return useQuery({
    queryKey: ["admin", "visitors"],
    queryFn: getVisitors,
  });
}

export function useVisitorDetail(userId: number | null) {
  return useQuery({
    queryKey: ["admin", "visitor", userId],
    queryFn: () => getVisitorDetail(userId!),
    enabled: userId !== null,
  });
}

export function useVisitorExhibitions(userId: number | null) {
  return useQuery({
    queryKey: ["admin", "visitor-exhibitions", userId],
    queryFn: () => getVisitorExhibitions(userId!),
    enabled: userId !== null,
  });
}

export function useUnitCheckins(userId: number | null, exhibitionId: number | null) {
  return useQuery({
    queryKey: ["admin", "unit-checkins", userId, exhibitionId],
    queryFn: () => getUnitCheckins(userId!, exhibitionId!),
    enabled: userId !== null && exhibitionId !== null,
  });
}

export function useToggleCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: number; exhibitionId: number; unitId: number }) =>
      toggleCheckin(params.userId, params.exhibitionId, params.unitId),
    onSuccess: (_data, params) => {
      qc.invalidateQueries({
        queryKey: ["admin", "unit-checkins", params.userId, params.exhibitionId],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "visitor-exhibitions", params.userId],
      });
    },
  });
}
