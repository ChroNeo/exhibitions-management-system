import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuestionSet } from "../../../api/survey";
import type {
  CreateQuestionSetPayload,
  QuestionSetWithQuestions,
} from "../../../types/survey";

/**
 * Hook to create a question set for an exhibition
 */
export function useCreateQuestionSet() {
  const queryClient = useQueryClient();

  return useMutation<QuestionSetWithQuestions, Error, CreateQuestionSetPayload>(
    {
      mutationFn: (payload) => createQuestionSet(payload),
      onSuccess: (_data, variables) => {
        // Invalidate related queries to refresh the data
        queryClient.invalidateQueries({
          queryKey: ["survey", "questions", variables.exhibition_id],
        });
      },
    },
  );
}
