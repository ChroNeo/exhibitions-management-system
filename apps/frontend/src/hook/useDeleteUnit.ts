import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUnit } from "../api/units";

type DeleteArgs = {
  exhibitionId: string | number;
  unitId: string | number;
};

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteArgs>({
    mutationFn: ({ exhibitionId, unitId }) => deleteUnit(exhibitionId, unitId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units", variables.exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["unit", variables.unitId] });
    },
  });
}
