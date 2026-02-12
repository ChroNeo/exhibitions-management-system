import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNews,
  deleteNews,
  getNewsByExhibitionId,
  updateNews,
} from "../../../api/newsApi";
import type { CreateNewsPayload, UpdateNewsPayload } from "../../../types/news";

export function useNewsList(exhibitionId: number) {
  return useQuery({
    queryKey: ["news", exhibitionId],
    queryFn: () => getNewsByExhibitionId(exhibitionId),
    enabled: !!exhibitionId,
  });
}

export function useCreateNews(exhibitionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNewsPayload) => createNews(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news", exhibitionId] });
    },
  });
}

export function useUpdateNews(exhibitionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNewsPayload }) =>
      updateNews(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news", exhibitionId] });
    },
  });
}

export function useDeleteNews(exhibitionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news", exhibitionId] });
    },
  });
}
