import type { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import type {
  QuestionSetWithQuestions,
  QuestionsTemplate,
  QuestionWithSet,
  SurveySubmissionResponse,
} from "../models/survey.model.js";
import { pool, safeQuery } from "../services/dbconn.js";

// ─── Questions Template CRUD ───────────────────────────────────────────────

/**
 * Get all questions from the template bank
 */
export async function getQuestionsTemplate(
  category?: string,
): Promise<QuestionsTemplate[]> {
  let query = `SELECT qt_id, content, category FROM questions_template`;
  const params: any[] = [];

  if (category) {
    query += ` WHERE category = ?`;
    params.push(category);
  }

  query += ` ORDER BY qt_id`;
  return (await safeQuery(query, params)) as QuestionsTemplate[];
}

/**
 * Create new question(s) in the template bank
 */
export async function createQuestionsTemplate(
  questions: Array<{ content: string; category?: string | null }>,
): Promise<QuestionsTemplate[]> {
  if (!questions.length) {
    throw new AppError(
      "At least one question is required",
      400,
      "VALIDATION_ERROR",
    );
  }

  const values = questions.map(() => "(?, ?)").join(", ");
  const params: any[] = [];
  questions.forEach((q) => {
    params.push(q.content, q.category ?? null);
  });

  const rows = await safeQuery<ResultSetHeader>(
    `INSERT INTO questions_template (content, category) VALUES ${values}`,
    params,
  );

  // Q4: Re-query using insertId and count instead of assuming contiguous IDs
  const firstId = (rows as any).insertId;
  const count = questions.length;

  return (await safeQuery(
    `SELECT qt_id, content, category FROM questions_template WHERE qt_id >= ? ORDER BY qt_id LIMIT ?`,
    [firstId, count],
  )) as QuestionsTemplate[];
}

/**
 * Update a single question template
 */
export async function updateQuestionTemplate(
  qtId: number,
  content: string,
  category?: string | null,
): Promise<QuestionsTemplate> {
  await safeQuery(
    `UPDATE questions_template SET content = ?, category = ? WHERE qt_id = ?`,
    [content, category ?? null, qtId],
  );

  const rows = await safeQuery(
    `SELECT qt_id, content, category FROM questions_template WHERE qt_id = ?`,
    [qtId],
  );

  if (!(rows as any[]).length) {
    throw new AppError("Question template not found", 404, "NOT_FOUND");
  }

  return (rows as any[])[0] as QuestionsTemplate;
}

/**
 * Delete a question template
 */
export async function deleteQuestionTemplate(qtId: number): Promise<void> {
  const result = await safeQuery<ResultSetHeader>(
    `DELETE FROM questions_template WHERE qt_id = ?`,
    [qtId],
  );

  if ((result as any).affectedRows === 0) {
    throw new AppError("Question template not found", 404, "NOT_FOUND");
  }
}

// ─── Question Sets & Mappings ──────────────────────────────────────────────

/**
 * Get questions for an exhibition by exhibition ID
 * Joins through set_question_mapping → questions_template
 */
export async function getQuestionsByExhibitionId(
  exhibitionId: string | number,
  type?: "EXHIBITION" | "UNIT",
): Promise<QuestionWithSet[]> {
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  let query = `
    SELECT
      qt.qt_id,
      sqm.set_id,
      qt.content,
      sqm.sort_order,
      qs.name as set_name,
      qs.type as set_type,
      qs.is_master
    FROM set_question_mapping sqm
    JOIN questions_template qt ON sqm.qt_id = qt.qt_id
    JOIN question_sets qs ON sqm.set_id = qs.set_id
    JOIN exhibitions e ON (
      (qs.set_id = e.exhibition_set_id AND qs.type = 'EXHIBITION') OR
      (qs.set_id = e.unit_set_id AND qs.type = 'UNIT')
    )
    WHERE e.exhibition_id = ?
  `;

  const params: any[] = [exhibitionId];

  if (type) {
    query += ` AND qs.type = ?`;
    params.push(type);
  }

  query += ` ORDER BY qs.type, sqm.sort_order, qt.qt_id`;

  return (await safeQuery(query, params)) as QuestionWithSet[];
}

/**
 * Get master questions by type (EXHIBITION or UNIT)
 * Returns all master question sets with their questions
 */
export async function getMasterQuestions(
  type: "EXHIBITION" | "UNIT",
): Promise<QuestionSetWithQuestions[]> {
  const rows = await safeQuery(
    `
    SELECT
      qs.set_id,
      qs.name,
      qs.is_master,
      qs.type,
      qt.qt_id,
      qt.content,
      qt.category,
      sqm.sort_order
    FROM question_sets qs
    LEFT JOIN set_question_mapping sqm ON sqm.set_id = qs.set_id
    LEFT JOIN questions_template qt ON sqm.qt_id = qt.qt_id
    WHERE qs.is_master = 1 AND qs.type = ?
    ORDER BY qs.set_id, sqm.sort_order, qt.qt_id
    `,
    [type],
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
        questions: [],
      });
    }

    if (row.qt_id) {
      setsMap.get(row.set_id)!.questions.push({
        qt_id: row.qt_id,
        content: row.content,
        category: row.category,
        sort_order: row.sort_order,
      });
    }
  }

  return Array.from(setsMap.values());
}

/**
 * Create question set for an exhibition using qt_ids from the template bank
 */
export async function createQuestionSetForExhibition(
  exhibitionId: number,
  type: "EXHIBITION" | "UNIT",
  qtIds: Array<{ qt_id: number; sort_order: number }>,
): Promise<QuestionSetWithQuestions> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Validate exhibition exists
    const [exhibitionRows] = await connection.query<any[]>(
      `SELECT exhibition_id, exhibition_code, exhibition_set_id, unit_set_id
       FROM exhibitions WHERE exhibition_id = ?`,
      [exhibitionId],
    );

    if (!exhibitionRows.length) {
      throw new AppError("Exhibition not found", 404, "NOT_FOUND");
    }

    const exhibition = exhibitionRows[0];

    // Step 2: Check for duplicate
    const columnToCheck =
      type === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    if (exhibition[columnToCheck] !== null) {
      throw new AppError(
        `Exhibition already has a ${type} question set`,
        409,
        "DUPLICATE",
      );
    }

    // Step 3: Validate qt_ids
    if (!qtIds || qtIds.length === 0) {
      throw new AppError(
        "At least one question is required",
        400,
        "VALIDATION_ERROR",
      );
    }

    // Step 4: Create new question set
    const newSetName = `Questions for Exhibition ${exhibition.exhibition_code} (${type})`;
    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO question_sets (name, is_master, type) VALUES (?, 0, ?)`,
      [newSetName, type],
    );
    const newSetId = insertResult.insertId;

    // Step 5: Insert mappings
    const values = qtIds.map(() => "(?, ?, ?)").join(", ");
    const params: any[] = [];
    qtIds.forEach((item) => {
      params.push(newSetId, item.qt_id, item.sort_order);
    });
    await connection.query<ResultSetHeader>(
      `INSERT INTO set_question_mapping (set_id, qt_id, sort_order) VALUES ${values}`,
      params,
    );

    // Step 6: Update exhibition foreign key
    const columnToUpdate =
      type === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    await connection.query(
      `UPDATE exhibitions SET ${columnToUpdate} = ? WHERE exhibition_id = ?`,
      [newSetId, exhibitionId],
    );

    await connection.commit();

    // Step 7: Retrieve complete result
    const [resultRows] = await connection.query<any[]>(
      `SELECT
        qs.set_id,
        qs.name,
        qs.is_master,
        qs.type,
        qt.qt_id,
        qt.content,
        qt.category,
        sqm.sort_order
       FROM question_sets qs
       LEFT JOIN set_question_mapping sqm ON sqm.set_id = qs.set_id
       LEFT JOIN questions_template qt ON sqm.qt_id = qt.qt_id
       WHERE qs.set_id = ?
       ORDER BY sqm.sort_order, qt.qt_id`,
      [newSetId],
    );

    if (!resultRows.length) {
      throw new AppError(
        "Failed to retrieve created question set",
        500,
        "DB_ERROR",
      );
    }

    const questionSet: QuestionSetWithQuestions = {
      set_id: resultRows[0].set_id,
      name: resultRows[0].name,
      is_master: resultRows[0].is_master,
      type: resultRows[0].type,
      questions: resultRows
        .filter((row: any) => row.qt_id !== null)
        .map((row: any) => ({
          qt_id: row.qt_id,
          content: row.content,
          category: row.category,
          sort_order: row.sort_order,
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
 * Update questions in an existing question set
 * Replaces all mappings with new qt_ids
 */
export async function updateQuestionSet(
  exhibitionId: number,
  type: "EXHIBITION" | "UNIT",
  qtIds: Array<{ qt_id: number; sort_order: number }>,
): Promise<QuestionSetWithQuestions> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Validate exhibition exists and get the set_id
    const columnToCheck =
      type === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    const [exhibitionRows] = await connection.query<any[]>(
      `SELECT exhibition_id, exhibition_code, ${columnToCheck} as set_id
       FROM exhibitions WHERE exhibition_id = ?`,
      [exhibitionId],
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
        "NOT_FOUND",
      );
    }

    // Step 2: Validate qt_ids
    if (!qtIds || qtIds.length === 0) {
      throw new AppError(
        "At least one question is required",
        400,
        "VALIDATION_ERROR",
      );
    }

    // Step 3: Delete all existing mappings
    await connection.query(
      `DELETE FROM set_question_mapping WHERE set_id = ?`,
      [setId],
    );

    // Step 4: Insert new mappings
    const values = qtIds.map(() => "(?, ?, ?)").join(", ");
    const params: any[] = [];
    qtIds.forEach((item) => {
      params.push(setId, item.qt_id, item.sort_order);
    });
    await connection.query<ResultSetHeader>(
      `INSERT INTO set_question_mapping (set_id, qt_id, sort_order) VALUES ${values}`,
      params,
    );

    await connection.commit();

    // Step 5: Retrieve complete result
    const [resultRows] = await connection.query<any[]>(
      `SELECT
        qs.set_id,
        qs.name,
        qs.is_master,
        qs.type,
        qt.qt_id,
        qt.content,
        qt.category,
        sqm.sort_order
       FROM question_sets qs
       LEFT JOIN set_question_mapping sqm ON sqm.set_id = qs.set_id
       LEFT JOIN questions_template qt ON sqm.qt_id = qt.qt_id
       WHERE qs.set_id = ?
       ORDER BY sqm.sort_order, qt.qt_id`,
      [setId],
    );

    if (!resultRows.length) {
      throw new AppError(
        "Failed to retrieve updated question set",
        500,
        "DB_ERROR",
      );
    }

    const questionSet: QuestionSetWithQuestions = {
      set_id: resultRows[0].set_id,
      name: resultRows[0].name,
      is_master: resultRows[0].is_master,
      type: resultRows[0].type,
      questions: resultRows
        .filter((row: any) => row.qt_id !== null)
        .map((row: any) => ({
          qt_id: row.qt_id,
          content: row.content,
          category: row.category,
          sort_order: row.sort_order,
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

// ─── Survey Submission ─────────────────────────────────────────────────────

/**
 * Check if user has already submitted a survey for a specific unit or exhibition
 */
export async function checkSurveyCompleted(
  userId: number,
  exhibitionId: number,
  unitId?: number,
): Promise<boolean> {
  if (typeof userId !== "number" || userId <= 0) {
    throw new AppError("invalid user id", 400, "VALIDATION_ERROR");
  }

  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  if (unitId !== undefined && !/^\d+$/.test(String(unitId))) {
    throw new AppError("invalid unit id", 400, "VALIDATION_ERROR");
  }

  // Use sentinel 0 for exhibition-level surveys in survey_tracking
  const trackingUnitId = unitId ?? 0;

  const query = `
    SELECT COUNT(*) as count FROM survey_tracking
    WHERE user_id = ? AND exhibition_id = ? AND unit_id = ?
  `;
  const params = [userId, exhibitionId, trackingUnitId];

  const rows = await safeQuery<any[]>(query, params);
  return rows[0].count > 0;
}

/**
 * Submit a survey response for an exhibition or unit
 * Creates a survey submission with answers referencing (set_id, qt_id)
 * Also inserts into survey_tracking for duplicate prevention (anonymous submissions)
 */
export async function submitSurvey(
  userId: number,
  exhibitionId: number,
  unitId: number | undefined,
  comment: string | undefined,
  answers: Array<{ qt_id: number; score: number }>,
): Promise<SurveySubmissionResponse> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Validate user is registered for the exhibition
    const [registrationRows] = await connection.query<any[]>(
      `SELECT * FROM registrations WHERE user_id = ? AND exhibition_id = ?`,
      [userId, exhibitionId],
    );

    if (!registrationRows.length) {
      throw new AppError(
        "User not registered for this exhibition",
        403,
        "NOT_REGISTERED",
      );
    }

    // Step 2: Insert into survey_tracking for duplicate prevention
    // Uses sentinel 0 for exhibition-level surveys; UNIQUE constraint prevents duplicates
    const trackingUnitId = unitId ?? 0;
    try {
      await connection.query<ResultSetHeader>(
        `INSERT INTO survey_tracking (user_id, exhibition_id, unit_id) VALUES (?, ?, ?)`,
        [userId, exhibitionId, trackingUnitId],
      );
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        throw new AppError(
          "Survey already submitted",
          409,
          "DUPLICATE_SUBMISSION",
        );
      }
      throw err;
    }

    // Step 3: Determine the set_id for this survey
    const surveyType = unitId === undefined ? "EXHIBITION" : "UNIT";
    const setColumn =
      surveyType === "EXHIBITION" ? "exhibition_set_id" : "unit_set_id";
    const [exhRows] = await connection.query<any[]>(
      `SELECT ${setColumn} as set_id FROM exhibitions WHERE exhibition_id = ?`,
      [exhibitionId],
    );

    if (!exhRows.length || !exhRows[0].set_id) {
      throw new AppError(
        "No question set found for this exhibition",
        404,
        "NOT_FOUND",
      );
    }

    const setId = exhRows[0].set_id;

    // Step 4: Insert anonymous survey submission (no user_id)
    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO survey_submissions (exhibition_id, unit_id, comment)
       VALUES (?, ?, ?)`,
      [exhibitionId, unitId ?? null, comment ?? null],
    );
    const submissionId = insertResult.insertId;

    // Step 5: Bulk insert answers with (set_id, qt_id)
    if (answers.length > 0) {
      const values = answers.map(() => "(?, ?, ?, ?)").join(", ");
      const params: any[] = [];
      answers.forEach((answer) => {
        params.push(submissionId, setId, answer.qt_id, answer.score);
      });

      await connection.query<ResultSetHeader>(
        `INSERT INTO survey_answers (submission_id, set_id, qt_id, score) VALUES ${values}`,
        params,
      );
    }

    await connection.commit();

    // Step 6: Retrieve complete submission with answers
    const [submissionRows] = await connection.query<any[]>(
      `SELECT
        s.submission_id,
        s.exhibition_id,
        s.unit_id,
        s.comment,
        s.created_at
       FROM survey_submissions s
       WHERE s.submission_id = ?`,
      [submissionId],
    );

    const [answerRows] = await connection.query<any[]>(
      `SELECT answer_id, set_id, qt_id, score
       FROM survey_answers
       WHERE submission_id = ?
       ORDER BY answer_id`,
      [submissionId],
    );

    if (!submissionRows.length) {
      throw new AppError("Failed to retrieve submission", 500, "DB_ERROR");
    }

    const submission = submissionRows[0];

    return {
      submission_id: submission.submission_id,
      exhibition_id: submission.exhibition_id,
      unit_id: submission.unit_id,
      comment: submission.comment,
      created_at:
        submission.created_at instanceof Date
          ? submission.created_at.toISOString()
          : String(submission.created_at),
      answers: answerRows.map((row: any) => ({
        answer_id: row.answer_id,
        set_id: row.set_id,
        qt_id: row.qt_id,
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
