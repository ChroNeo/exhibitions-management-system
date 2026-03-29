import type {
  CreateQuestionSetPayload,
  GetQuestionsParams,
  MasterQuestionSet,
  QuestionSetWithQuestions,
  QuestionsTemplate,
  QuestionType,
  QuestionWithSet,
} from "../types/survey";
import api from "./client";
import liffClient from "./liffClient";

const SURVEY_BASE = "/surveys";

// ─── Questions Template CRUD ───────────────────────────────────────────────

/**
 * Get all questions from the template bank
 */
export async function getQuestionsTemplateApi(
  category?: string,
): Promise<QuestionsTemplate[]> {
  const { data } = await api.get<QuestionsTemplate[]>(
    `${SURVEY_BASE}/questions-template`,
    {
      params: category ? { category } : {},
    },
  );
  return data;
}

/**
 * Create new question(s) in the template bank
 */
export async function createQuestionsTemplateApi(
  questions: Array<{ content: string; category?: string | null }>,
): Promise<QuestionsTemplate[]> {
  const { data } = await api.post<QuestionsTemplate[]>(
    `${SURVEY_BASE}/questions-template`,
    { questions },
  );
  return data;
}

/**
 * Update a question template
 */
export async function updateQuestionTemplateApi(
  qtId: number,
  payload: { content: string; category?: string | null },
): Promise<QuestionsTemplate> {
  const { data } = await api.put<QuestionsTemplate>(
    `${SURVEY_BASE}/questions-template/${qtId}`,
    payload,
  );
  return data;
}

/**
 * Delete a question template
 */
export async function deleteQuestionTemplateApi(qtId: number): Promise<void> {
  await api.delete(`${SURVEY_BASE}/questions-template/${qtId}`);
}

// ─── Question Sets ─────────────────────────────────────────────────────────

/**
 * Get questions by exhibition ID and optional type (for LIFF - uses ID token)
 */
export async function getQuestionsByExhibitionLiff(
  params: GetQuestionsParams,
): Promise<QuestionWithSet[]> {
  const response = await liffClient.get<QuestionWithSet[]>(
    `${SURVEY_BASE}/questions`,
    { params },
  );

  return response.data;
}

/**
 * Get questions by exhibition ID and optional type (regular auth)
 */
export async function getQuestionsByExhibition(
  params: GetQuestionsParams,
): Promise<QuestionWithSet[]> {
  const { data } = await api.get<QuestionWithSet[]>(
    `${SURVEY_BASE}/questions`,
    {
      params,
    },
  );
  return data;
}

/**
 * Get master question sets by type (EXHIBITION or UNIT)
 * Returns all master question sets with their questions for the specified type
 */
export async function getMasterQuestions(
  type: QuestionType,
): Promise<MasterQuestionSet[]> {
  const { data } = await api.get<MasterQuestionSet[]>(
    `${SURVEY_BASE}/master-questions`,
    {
      params: { type },
    },
  );
  return data;
}

/**
 * Create a question set for an exhibition
 */
export async function createQuestionSet(
  payload: CreateQuestionSetPayload,
): Promise<QuestionSetWithQuestions> {
  const { data } = await api.post<QuestionSetWithQuestions>(
    `${SURVEY_BASE}/questions`,
    payload,
  );
  return data;
}

/**
 * Update a question set for an exhibition
 */
export async function updateQuestionSet(
  payload: CreateQuestionSetPayload,
): Promise<QuestionSetWithQuestions> {
  const { data } = await api.put<QuestionSetWithQuestions>(
    `${SURVEY_BASE}/questions`,
    payload,
  );
  return data;
}

// ─── Survey Submission ─────────────────────────────────────────────────────

export interface SurveyAnswer {
  qt_id: number;
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
  comment: string | null;
  created_at: string;
  answers: {
    answer_id: number;
    set_id: number;
    qt_id: number;
    score: number;
  }[];
}

/**
 * Submit survey responses (for LIFF - uses ID token)
 */
export async function submitSurveyLiff(
  payload: SubmitSurveyPayload,
): Promise<SurveySubmissionResponse> {
  const response = await liffClient.post<SurveySubmissionResponse>(
    `${SURVEY_BASE}/submit`,
    payload,
  );

  return response.data;
}

/**
 * Check if user has completed a survey for an exhibition or unit (for LIFF)
 */
export async function checkSurveyCompletedLiff(
  exhibitionId: string | number,
  unitId?: string | number,
): Promise<boolean> {
  const params: any = {
    exhibition_id: String(exhibitionId),
  };

  if (unitId !== undefined) {
    params.unit_id = String(unitId);
  }

  const response = await liffClient.get<{ is_completed: boolean }>(
    `${SURVEY_BASE}/check-completed`,
    { params },
  );

  return response.data.is_completed;
}
