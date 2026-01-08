import api from "./client";
import type {
  Question,
  QuestionWithSet,
  QuestionSetWithQuestions,
  MasterQuestionSet,
  CreateQuestionSetPayload,
  GetQuestionsParams,
  QuestionType,
} from "../types/survey";

const SURVEY_BASE = "/surveys";

/**
 * Get questions by exhibition ID and optional type
 */
export async function getQuestionsByExhibition(
  params: GetQuestionsParams
): Promise<QuestionWithSet[]> {
  const { data } = await api.get<QuestionWithSet[]>(`${SURVEY_BASE}/questions`, {
    params,
  });
  return data;
}

/**
 * Get master question sets by type (EXHIBITION or UNIT)
 * Returns all master question sets with their questions for the specified type
 */
export async function getMasterQuestions(type: QuestionType): Promise<MasterQuestionSet[]> {
  const { data } = await api.get<MasterQuestionSet[]>(`${SURVEY_BASE}/master-questions`, {
    params: { type },
  });
  return data;
}

/**
 * Create a question set for an exhibition
 */
export async function createQuestionSet(
  payload: CreateQuestionSetPayload
): Promise<QuestionSetWithQuestions> {
  const { data } = await api.post<QuestionSetWithQuestions>(
    `${SURVEY_BASE}/questions`,
    payload
  );
  return data;
}

/**
 * Update a question set for an exhibition
 */
export async function updateQuestionSet(
  payload: CreateQuestionSetPayload
): Promise<QuestionSetWithQuestions> {
  const { data } = await api.put<QuestionSetWithQuestions>(
    `${SURVEY_BASE}/questions`,
    payload
  );
  return data;
}
