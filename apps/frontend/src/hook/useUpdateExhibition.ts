// hook/useUpdateExhibition.ts
import { useMutation } from "@tanstack/react-query";
import { updateExhibitionApi } from "../api/exhibitions";
import type { ExhibitionUpdatePayload } from "../api/exhibitions";
import type { Exhibition } from "../types/exhibition";

type MutationArgs = { id: string; payload: ExhibitionUpdatePayload };

export function useUpdateExhibition() {
  return useMutation<Exhibition, Error, MutationArgs>({
    mutationFn: ({ id, payload }) => updateExhibitionApi(id, payload),
  });
}
