export type QuestionType = "EXHIBITION" | "UNIT";

export interface Question {
  question_id: number;
  topic: string;
  is_master: boolean;
  created_at: string;
}

export interface QuestionSet {
  question_set_id: number;
  exhibition_id: number;
  type: QuestionType;
  created_at: string;
}

export interface QuestionWithSet {
  question_id: number;
  set_id: number;
  topic: string;
  set_name: string;
  set_type: QuestionType;
  is_master: number;
}

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
}

export interface MasterQuestionSet {
  set_id: number;
  name: string;
  is_master: number;
  type: QuestionType;
  questions: {
    question_id: number;
    set_id: number;
    topic: string;
  }[];
}

export interface CreateQuestionSetPayload {
  exhibition_id: number;
  type: QuestionType;
  questions: {
    topic: string;
  }[];
}

export interface GetQuestionsParams {
  exhibition_id: string;
  type?: QuestionType;
}
