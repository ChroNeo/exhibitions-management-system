import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExhibition } from "../api/exhibitions";
import type { Exhibition } from "../types/exhibition";

export function useCreateExhibition() {
  const queryClient = useQueryClient();

  return useMutation<Exhibition, Error, Parameters<typeof createExhibition>[0]>({
    mutationFn: (payload) => createExhibition(payload),
    onSuccess: () => {
      // เคลียร์/รีเฟรช cache ของ list
      queryClient.invalidateQueries({ queryKey: ["exhibitions"] });
    },
  });
}
