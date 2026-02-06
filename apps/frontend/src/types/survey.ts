export type QuestionType = "EXHIBITION" | "UNIT";

export interface QuestionsTemplate {
  qt_id: number;
  content: string;
  category: string | null;
}

export interface QuestionInSet {
  qt_id: number;
  content: string;
  category: string | null;
  sort_order: number;
}

export interface QuestionWithSet {
  qt_id: number;
  set_id: number;
  content: string;
  sort_order: number;
  set_name: string;
  set_type: QuestionType;
  is_master: number;
}

export interface QuestionSet {
  set_id: number;
  name: string;
  is_master: number;
  type: QuestionType;
}

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: QuestionInSet[];
}

export interface MasterQuestionSet {
  set_id: number;
  name: string;
  is_master: number;
  type: QuestionType;
  questions: QuestionInSet[];
}

export interface CreateQuestionSetPayload {
  exhibition_id: number;
  type: QuestionType;
  questions: {
    qt_id: number;
    sort_order: number;
  }[];
}

export interface GetQuestionsParams {
  exhibition_id: string;
  type?: QuestionType;
}
