import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExhibition } from "../api/exhibitions";

export function useDeleteExhibition() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteExhibition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibitions"] });
    },
  });
}
