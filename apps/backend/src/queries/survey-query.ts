import { AppError } from "../errors.js";
import { safeQuery, pool } from "../services/dbconn.js";
import type { Question, QuestionWithSet, QuestionSetWithQuestions, SurveySubmissionResponse } from "../models/survey.model.js";
import type { ResultSetHeader } from "mysql2";

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

/**
 * Get master questions by type (EXHIBITION or UNIT)
 * Returns all master question sets with their questions for the specified type
 */
export async function getMasterQuestions(
  type: "EXHIBITION" | "UNIT"
): Promise<QuestionSetWithQuestions[]> {
  const rows = await safeQuery(
    `
    SELECT
      qs.set_id,
      qs.name,
      qs.is_master,
      qs.type,
      q.question_id,
      q.topic
    FROM question_sets qs
    LEFT JOIN questions q ON q.set_id = qs.set_id
    WHERE qs.is_master = 1 AND qs.type = ?
    ORDER BY qs.set_id, q.question_id
    `,
    [type]
  );

  // Group questions by set
  const setsMap = new Map<number, QuestionSetWithQuestions>();

  for (const row of rows as any[]) {
    if (!setsMap.has(row.set_id)) {
      setsMap.set(row.set_id, {
        set_id: row.set_id,
        name: row.name,
        is_master: row.is_master,
        type: row.type,
        questions: []
      });
    }

    // Add question if it exists
    if (row.question_id) {
      setsMap.get(row.set_id)!.questions.push({
        question_id: row.question_id,
        set_id: row.set_id,
        topic: row.topic
      });
    }
  }

  return Array.from(setsMap.values());
}

/**
 * Update questions in an existing question set
 * Replaces all questions in the set with new ones
 */
export async function updateQuestionSet(
  exhibitionId: number,
  type: "EXHIBITION" | "UNIT",
  questionTopics: string[]
): Promise<QuestionSetWithQuestions> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Validate exhibition exists and get the set_id
    const columnToCheck = type === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    const [exhibitionRows] = await connection.query<any[]>(
      `SELECT exhibition_id, exhibition_code, ${columnToCheck} as set_id
       FROM exhibitions WHERE exhibition_id = ?`,
      [exhibitionId]
    );

    if (!exhibitionRows.length) {
      throw new AppError("Exhibition not found", 404, "NOT_FOUND");
    }

    const exhibition = exhibitionRows[0];
    const setId = exhibition.set_id;

    if (!setId) {
      throw new AppError(
        `No ${type} question set found for this exhibition`,
        404,
        "NOT_FOUND"
      );
    }

    // Step 2: Validate questions array
    if (!questionTopics || questionTopics.length === 0) {
      throw new AppError(
        "At least one question is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Step 3: Delete all existing questions from this set
    await connection.query(
      `DELETE FROM questions WHERE set_id = ?`,
      [setId]
    );

    // Step 4: Insert new questions
    const values = questionTopics.map(() => "(?, ?)").join(", ");
    const params: any[] = [];
    questionTopics.forEach((topic: string) => {
      params.push(setId, topic);
    });
    await connection.query<ResultSetHeader>(
      `INSERT INTO questions (set_id, topic) VALUES ${values}`,
      params
    );

    // Commit transaction
    await connection.commit();

    // Step 5: Retrieve complete result
    const [resultRows] = await connection.query<any[]>(
      `SELECT
        qs.set_id,
        qs.name,
        qs.is_master,
        qs.type,
        q.question_id,
        q.set_id as q_set_id,
        q.topic
       FROM question_sets qs
       LEFT JOIN questions q ON q.set_id = qs.set_id
       WHERE qs.set_id = ?
       ORDER BY q.question_id`,
      [setId]
    );

    if (!resultRows.length) {
      throw new AppError(
        "Failed to retrieve updated question set",
        500,
        "DB_ERROR"
      );
    }

    // Transform to nested structure
    const questionSet: QuestionSetWithQuestions = {
      set_id: resultRows[0].set_id,
      name: resultRows[0].name,
      is_master: resultRows[0].is_master,
      type: resultRows[0].type,
      questions: resultRows
        .filter((row: any) => row.question_id !== null)
        .map((row: any) => ({
          question_id: row.question_id,
          set_id: row.q_set_id,
          topic: row.topic,
        })),
    };

    return questionSet;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Create question set for an exhibition with custom questions
 * Creates a new question_set, inserts custom questions, and links to exhibition
 */
export async function createQuestionSetForExhibition(
  exhibitionId: number,
  type: "EXHIBITION" | "UNIT",
  questionTopics: string[]
): Promise<QuestionSetWithQuestions> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Validate exhibition exists and get info
    const [exhibitionRows] = await connection.query<any[]>(
      `SELECT exhibition_id, exhibition_code, exhibition_set_id, unit_set_id
       FROM exhibitions WHERE exhibition_id = ?`,
      [exhibitionId]
    );

    if (!exhibitionRows.length) {
      throw new AppError("Exhibition not found", 404, "NOT_FOUND");
    }

    const exhibition = exhibitionRows[0];

    // Step 2: Check for duplicate
    const columnToCheck = type === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    if (exhibition[columnToCheck] !== null) {
      throw new AppError(
        `Exhibition already has a ${type} question set`,
        409,
        "DUPLICATE"
      );
    }

    // Step 3: Validate questions array
    if (!questionTopics || questionTopics.length === 0) {
      throw new AppError(
        "At least one question is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Step 4: Create new question set
    const newSetName = `Questions for Exhibition ${exhibition.exhibition_code} (${type})`;
    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO question_sets (name, is_master, type) VALUES (?, 0, ?)`,
      [newSetName, type]
    );
    const newSetId = insertResult.insertId;

    // Step 5: Insert custom questions (bulk INSERT)
    const values = questionTopics.map(() => "(?, ?)").join(", ");
    const params: any[] = [];
    questionTopics.forEach((topic: string) => {
      params.push(newSetId, topic);
    });
    await connection.query<ResultSetHeader>(
      `INSERT INTO questions (set_id, topic) VALUES ${values}`,
      params
    );

    // Step 7: Update exhibition foreign key
    const columnToUpdate = type === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    await connection.query(
      `UPDATE exhibitions SET ${columnToUpdate} = ? WHERE exhibition_id = ?`,
      [newSetId, exhibitionId]
    );

    // Commit transaction
    await connection.commit();

    // Step 8: Retrieve complete result
    const [resultRows] = await connection.query<any[]>(
      `SELECT
        qs.set_id,
        qs.name,
        qs.is_master,
        qs.type,
        q.question_id,
        q.set_id as q_set_id,
        q.topic
       FROM question_sets qs
       LEFT JOIN questions q ON q.set_id = qs.set_id
       WHERE qs.set_id = ?
       ORDER BY q.question_id`,
      [newSetId]
    );

    if (!resultRows.length) {
      throw new AppError(
        "Failed to retrieve created question set",
        500,
        "DB_ERROR"
      );
    }

    // Transform to nested structure
    const questionSet: QuestionSetWithQuestions = {
      set_id: resultRows[0].set_id,
      name: resultRows[0].name,
      is_master: resultRows[0].is_master,
      type: resultRows[0].type,
      questions: resultRows
        .filter((row: any) => row.question_id !== null)
        .map((row: any) => ({
          question_id: row.question_id,
          set_id: row.q_set_id,
          topic: row.topic,
        })),
    };

    return questionSet;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
/**
 * Check if user has already submitted a survey for a specific unit or exhibition
 */
export async function checkSurveyCompleted(
  userId: number,
  exhibitionId: number,
  unitId?: number
): Promise<boolean> {
  // Validate userId
  if (typeof userId !== 'number' || userId <= 0) {
    throw new AppError("invalid user id", 400, "VALIDATION_ERROR");
  }

  // Validate exhibitionId
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  // Validate unitId if provided
  if (unitId !== undefined && !/^\d+$/.test(String(unitId))) {
    throw new AppError("invalid unit id", 400, "VALIDATION_ERROR");
  }

  let query: string;
  let params: any[];

  if (unitId === undefined) {
    // Exhibition survey
    query = `
      SELECT COUNT(*) as count FROM survey_submissions
      WHERE user_id = ? AND exhibition_id = ? AND unit_id IS NULL
    `;
    params = [userId, exhibitionId];
  } else {
    // Unit survey
    query = `
      SELECT COUNT(*) as count FROM survey_submissions
      WHERE user_id = ? AND exhibition_id = ? AND unit_id = ?
    `;
    params = [userId, exhibitionId, unitId];
  }

  const rows = await safeQuery<any[]>(query, params);
  return rows[0].count > 0;
}

/**
 * Submit a survey response for an exhibition or unit
 * Creates a survey submission with answers
 */
export async function submitSurvey(
  userId: number,
  exhibitionId: number,
  unitId: number | undefined,
  comment: string | undefined,
  answers: Array<{ question_id: number; score: number }>
): Promise<SurveySubmissionResponse> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Validate user is registered for the exhibition
    const [registrationRows] = await connection.query<any[]>(
      `SELECT * FROM registrations WHERE user_id = ? AND exhibition_id = ?`,
      [userId, exhibitionId]
    );

    if (!registrationRows.length) {
      throw new AppError(
        "User not registered for this exhibition",
        403,
        "NOT_REGISTERED"
      );
    }

    // Step 2: Check for duplicate submission
    let duplicateCheckQuery: string;
    let duplicateCheckParams: any[];

    if (unitId === undefined) {
      // Exhibition survey
      duplicateCheckQuery = `
        SELECT * FROM survey_submissions
        WHERE user_id = ? AND exhibition_id = ? AND unit_id IS NULL
      `;
      duplicateCheckParams = [userId, exhibitionId];
    } else {
      // Unit survey
      duplicateCheckQuery = `
        SELECT * FROM survey_submissions
        WHERE user_id = ? AND exhibition_id = ? AND unit_id = ?
      `;
      duplicateCheckParams = [userId, exhibitionId, unitId];
    }

    const [existingSubmissions] = await connection.query<any[]>(
      duplicateCheckQuery,
      duplicateCheckParams
    );

    if (existingSubmissions.length > 0) {
      throw new AppError(
        "Survey already submitted",
        409,
        "DUPLICATE_SUBMISSION"
      );
    }

    // Step 3: Insert survey submission
    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO survey_submissions (exhibition_id, unit_id, user_id, comment)
       VALUES (?, ?, ?, ?)`,
      [exhibitionId, unitId ?? null, userId, comment ?? null]
    );
    const submissionId = insertResult.insertId;

    // Step 4: Bulk insert answers
    if (answers.length > 0) {
      const values = answers.map(() => "(?, ?, ?)").join(", ");
      const params: any[] = [];
      answers.forEach((answer) => {
        params.push(submissionId, answer.question_id, answer.score);
      });

      await connection.query<ResultSetHeader>(
        `INSERT INTO survey_answers (submission_id, question_id, score) VALUES ${values}`,
        params
      );
    }

    // Commit transaction
    await connection.commit();

    // Step 5: Retrieve complete submission with answers
    const [submissionRows] = await connection.query<any[]>(
      `SELECT
        s.submission_id,
        s.exhibition_id,
        s.unit_id,
        s.user_id,
        s.comment,
        s.created_at
       FROM survey_submissions s
       WHERE s.submission_id = ?`,
      [submissionId]
    );

    const [answerRows] = await connection.query<any[]>(
      `SELECT answer_id, question_id, score
       FROM survey_answers
       WHERE submission_id = ?
       ORDER BY answer_id`,
      [submissionId]
    );

    if (!submissionRows.length) {
      throw new AppError(
        "Failed to retrieve submission",
        500,
        "DB_ERROR"
      );
    }

    const submission = submissionRows[0];

    return {
      submission_id: submission.submission_id,
      exhibition_id: submission.exhibition_id,
      unit_id: submission.unit_id,
      user_id: submission.user_id,
      comment: submission.comment,
      created_at: submission.created_at instanceof Date
        ? submission.created_at.toISOString()
        : new Date(submission.created_at).toISOString(),
      answers: answerRows.map((row: any) => ({
        answer_id: row.answer_id,
        question_id: row.question_id,
        score: row.score,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
