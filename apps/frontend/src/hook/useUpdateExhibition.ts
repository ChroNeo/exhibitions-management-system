// hook/useUpdateExhibition.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExhibitionApi } from "../api/exhibitions";
import type { ExhibitionUpdatePayload } from "../api/exhibitions";
import type { Exhibition } from "../types/exhibition";

type MutationArgs = { id: string; payload: ExhibitionUpdatePayload };

export function useUpdateExhibition() {
  const queryClient = useQueryClient();

  return useMutation<Exhibition, Error, MutationArgs>({
    mutationFn: ({ id, payload }) => updateExhibitionApi(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["exhibition", id] });
      queryClient.invalidateQueries({ queryKey: ["exhibitions"] });
    },
  });
}

