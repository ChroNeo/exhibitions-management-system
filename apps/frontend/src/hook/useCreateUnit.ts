import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUnit } from "../api/units";
import type { Unit, UnitCreatePayload } from "../types/units";

export function useCreateUnit(exhibitionId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<Unit, Error, UnitCreatePayload>({
    mutationFn: async (payload) => {
      if (exhibitionId === undefined || exhibitionId === null) {
        throw new Error("ต้องระบุรหัสนิทรรศการก่อนสร้างกิจกรรม");
      }
      return createUnit(exhibitionId, payload);
    },
    onSuccess: () => {
      if (exhibitionId === undefined || exhibitionId === null) return;
      queryClient.invalidateQueries({ queryKey: ["units", exhibitionId] });
    },
  });
}
