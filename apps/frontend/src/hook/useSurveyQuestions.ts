import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getQuestionsByExhibition } from "../api/survey";
import type { QuestionWithSet, GetQuestionsParams } from "../types/survey";

type Opts = Omit<
  UseQueryOptions<QuestionWithSet[], Error>,
  "queryKey" | "queryFn"
>;

/**
 * Hook to fetch survey questions for an exhibition
 * @param params - Exhibition ID and optional type filter
 * @param opts - Additional react-query options
 */
export function useSurveyQuestions(
  params: GetQuestionsParams,
  opts?: Opts
) {
  return useQuery<QuestionWithSet[], Error>({
    queryKey: ["survey", "questions", params.exhibition_id, params.type],
    queryFn: () => getQuestionsByExhibition(params),
    enabled: !!params.exhibition_id && (opts?.enabled ?? true),
    ...opts,
  });
}
