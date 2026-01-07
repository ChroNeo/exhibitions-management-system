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

export interface QuestionWithSet extends Question {
  question_sets: QuestionSet;
}

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
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
