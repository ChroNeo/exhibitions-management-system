import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuestionSet } from "../../../api/survey";
import type {
  CreateQuestionSetPayload,
  QuestionSetWithQuestions,
} from "../../../types/survey";

/**
 * Hook to update a question set for an exhibition
 */
export function useUpdateQuestionSet() {
  const queryClient = useQueryClient();

  return useMutation<QuestionSetWithQuestions, Error, CreateQuestionSetPayload>(
    {
      mutationFn: (payload) => updateQuestionSet(payload),
      onSuccess: (_data, variables) => {
        // Invalidate related queries to refresh the data
        queryClient.invalidateQueries({
          queryKey: ["survey", "questions", variables.exhibition_id],
        });
      },
    },
  );
}
