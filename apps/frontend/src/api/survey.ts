import api from "./client";
import liffClient from './liffClient';
import type {
  QuestionWithSet,
  QuestionSetWithQuestions,
  MasterQuestionSet,
  CreateQuestionSetPayload,
  GetQuestionsParams,
  QuestionType,
} from "../types/survey";

const SURVEY_BASE = "/surveys";

/**
 * Get questions by exhibition ID and optional type (for LIFF - uses ID token)
 */
export async function getQuestionsByExhibitionLiff(
  params: GetQuestionsParams
): Promise<QuestionWithSet[]> {
  const response = await liffClient.get<QuestionWithSet[]>(
    `${SURVEY_BASE}/questions`,
    { params }
  );

  return response.data;
}

/**
 * Get questions by exhibition ID and optional type (regular auth)
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

// Survey submission types
export interface SurveyAnswer {
  question_id: number;
  score: number;
}

export interface SubmitSurveyPayload {
  exhibition_id: number;
  unit_id?: number;
  comment?: string;
  answers: SurveyAnswer[];
}

export interface SurveySubmissionResponse {
  submission_id: number;
  exhibition_id: number;
  unit_id: number | null;
  user_id: number;
  comment: string | null;
  created_at: string;
  answers: {
    answer_id: number;
    question_id: number;
    score: number;
  }[];
}
/**
 * Submit survey responses (for LIFF - uses ID token)
 */
export async function submitSurveyLiff(
  payload: SubmitSurveyPayload
): Promise<SurveySubmissionResponse> {
  const response = await liffClient.post<SurveySubmissionResponse>(
    `${SURVEY_BASE}/submit`,
    payload
  );

  return response.data;
}

/**
 * Check if user has completed a survey for an exhibition or unit (for LIFF)
 */
export async function checkSurveyCompletedLiff(
  exhibitionId: string | number,
  unitId?: string | number
): Promise<boolean> {
  const params: any = {
    exhibition_id: String(exhibitionId),
  };

  if (unitId !== undefined) {
    params.unit_id = String(unitId);
  }

  const response = await liffClient.get<{ is_completed: boolean }>(
    `${SURVEY_BASE}/check-completed`,
    { params }
  );

  return response.data.is_completed;
}
