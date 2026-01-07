import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuestionSet } from "../api/survey";
import type { QuestionSetWithQuestions, CreateQuestionSetPayload } from "../types/survey";

/**
 * Hook to create a question set for an exhibition
 */
export function useCreateQuestionSet() {
  const queryClient = useQueryClient();

  return useMutation<
    QuestionSetWithQuestions,
    Error,
    CreateQuestionSetPayload
  >({
    mutationFn: (payload) => createQuestionSet(payload),
    onSuccess: (data) => {
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["survey", "questions", data.exhibition_id],
      });
    },
  });
}
