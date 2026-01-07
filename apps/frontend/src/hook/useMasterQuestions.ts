import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMasterQuestions } from "../api/survey";
import type { Question, QuestionType } from "../types/survey";

type Opts = Omit<UseQueryOptions<Question[], Error>, "queryKey" | "queryFn">;

/**
 * Hook to fetch master survey questions by type
 * @param type - Question type (EXHIBITION or UNIT)
 * @param opts - Additional react-query options
 */
export function useMasterQuestions(type: QuestionType, opts?: Opts) {
  return useQuery<Question[], Error>({
    queryKey: ["survey", "master-questions", type],
    queryFn: () => getMasterQuestions(type),
    ...opts,
  });
}
