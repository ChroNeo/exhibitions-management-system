import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";
import type { Question, QuestionWithSet } from "../models/survey.model.js";

/**
 * Get questions for an exhibition by exhibition ID
 * Returns both EXHIBITION and UNIT questions based on the exhibition's question sets
 */
export async function getQuestionsByExhibitionId(
  exhibitionId: string | number,
  type?: "EXHIBITION" | "UNIT"
): Promise<QuestionWithSet[]> {
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError(
      "invalid exhibition id",
      400,
      "VALIDATION_ERROR"
    );
  }

  let query = `
    SELECT
      q.question_id,
      q.set_id,
      q.topic,
      qs.name as set_name,
      qs.type as set_type,
      qs.is_master
    FROM questions q
    JOIN question_sets qs ON q.set_id = qs.set_id
    JOIN exhibitions e ON (
      (qs.set_id = e.exhibition_set_id AND qs.type = 'EXHIBITION') OR
      (qs.set_id = e.unit_set_id AND qs.type = 'UNIT')
    )
    WHERE e.exhibition_id = ?
  `;

  const params: any[] = [exhibitionId];

  // Filter by type if provided
  if (type) {
    query += ` AND qs.type = ?`;
    params.push(type);
  }

  query += ` ORDER BY qs.type, q.question_id`;

  const rows = await safeQuery(query, params);
  return rows as QuestionWithSet[];
}

/**
 * Get all questions from a specific question set
 */
export async function getQuestionsBySetId(
  setId: string | number
): Promise<Question[]> {
  if (!/^\d+$/.test(String(setId))) {
    throw new AppError("invalid set id", 400, "VALIDATION_ERROR");
  }

  const rows = await safeQuery(
    `
    SELECT
      question_id,
      set_id,
      topic
    FROM questions
    WHERE set_id = ?
    ORDER BY question_id
    `,
    [setId]
  );

  return rows as Question[];
}
