import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMasterQuestions } from "../api/survey";
import type { MasterQuestionSet, QuestionType } from "../types/survey";

type Opts = Omit<UseQueryOptions<MasterQuestionSet[], Error>, "queryKey" | "queryFn">;

/**
 * Hook to fetch master question sets by type
 * @param type - Question type (EXHIBITION or UNIT)
 * @param opts - Additional react-query options
 */
export function useMasterQuestions(type: QuestionType, opts?: Opts) {
  return useQuery<MasterQuestionSet[], Error>({
    queryKey: ["survey", "master-questions", type],
    queryFn: () => getMasterQuestions(type),
    ...opts,
  });
}
