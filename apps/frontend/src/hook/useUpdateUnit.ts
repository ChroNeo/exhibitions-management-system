import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUnit } from "../api/units";
import type { Unit, UnitUpdatePayload } from "../types/units";

type UpdateArgs = {
  exhibitionId: string | number;
  unitId: string | number;
  payload: UnitUpdatePayload;
};

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation<Unit, Error, UpdateArgs>({
    mutationFn: ({ exhibitionId, unitId, payload }) =>
      updateUnit(exhibitionId, unitId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units", variables.exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["unit", variables.unitId] });
    },
  });
}
