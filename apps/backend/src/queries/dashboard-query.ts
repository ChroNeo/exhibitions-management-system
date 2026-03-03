import { DashboardResponse, OrgDashboardResponse } from "../models/dashboard.model.js";
import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

export async function getStaffUnitByUserId(
  userId: number,
): Promise<{ ex_id: number; unit_id: number }> {
  const [row] = await safeQuery<Array<{ unit_id: number; exhibition_id: number }>>(
    `SELECT us.unit_id, u.exhibition_id
     FROM unit_staffs us
     JOIN units u ON us.unit_id = u.unit_id
     WHERE us.staff_user_id = ?
     LIMIT 1`,
    [userId],
  );
  if (!row) throw new AppError("No unit assigned to this staff", 404, "NO_UNIT_ASSIGNED");
  return { ex_id: row.exhibition_id, unit_id: row.unit_id };
}

export async function getStaffDashboard(
  exId: number,
  unitId: number,
): Promise<DashboardResponse> {
  const [main] = await safeQuery<any[]>(
    `
    SELECT
      -- Staff Info
      nu.user_id        AS staff_id,
      nu.full_name      AS staff_name,

      -- Unit Detail
      v.unit_id,
      v.unit_code,
      v.unit_name,
      v.unit_type,
      v.description,
      v.description_delta,
      v.poster_url,
      v.detail_pdf_url,
      v.starts_at,
      v.ends_at,

      -- Exhibition Context
      v.exhibition_id,
      v.exhibition_title,
      v.exhibition_location,
      v.exhibition_status,

      -- Stats
      v.total_visitors,
      v.total_reviews,
      CAST(v.average_score AS DECIMAL(10,2)) AS average_score

    FROM v_staff_dashboard_stats v
    JOIN normal_users nu ON v.staff_user_id = nu.user_id
    WHERE v.exhibition_id = ?
      AND v.unit_id = ?
    LIMIT 1;
    `,
    [exId, unitId],
  );

  if (!main) throw new AppError("Staff not found", 404, "NOT_FOUND");

  const feedback = await safeQuery<any[]>(
    `
    SELECT
      qt_id,
      question_topic AS topic,
      CAST(average_score AS DECIMAL(10,2)) AS score,
      response_count
    FROM v_staff_dashboard_question_scores
    WHERE unit_id = ?;
    `,
    [unitId],
  );

  const result = {
    status: "success" as const,
    data: {
      staff_info: {
        id: main.staff_id,
        name: main.staff_name,
      },
      unit_detail: {
        id: main.unit_id,
        code: main.unit_code,
        name: main.unit_name,
        type: main.unit_type,
        description: main.description,
        description_delta: main.description_delta,
        poster_url: main.poster_url,
        detail_pdf_url: main.detail_pdf_url,
        schedule: {
          starts_at: main.starts_at,
          ends_at: main.ends_at,
        },
      },
      exhibition_context: {
        id: main.exhibition_id,
        title: main.exhibition_title,
        location: main.exhibition_location,
        status: main.exhibition_status,
      },
      stats: {
        total_checkins: main.total_visitors,
        total_reviews: main.total_reviews,
        average_rating: main.average_score,
      },
      feedback_breakdown: feedback,
    },
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function getOrgDashboard(
  exhibitionId: number,
): Promise<OrgDashboardResponse> {
  // KPI
  const [kpi] = await safeQuery<any[]>(
    `SELECT * FROM v_org_dashboard_kpis WHERE exhibition_id = ?`,
    [exhibitionId],
  );

  // Demographics – gender
  const genderRows = await safeQuery<any[]>(
    `SELECT gender AS label, COUNT(*) AS value
     FROM normal_users u
     JOIN registrations r ON u.user_id = r.user_id
     WHERE r.exhibition_id = ?
     GROUP BY gender`,
    [exhibitionId],
  );

  // Demographics – age groups
  const ageRows = await safeQuery<any[]>(
    `SELECT
       CASE
         WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) < 18 THEN 'ต่ำกว่า 18 ปี'
         WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 18 AND 24 THEN '18 - 24 ปี'
         WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 25 AND 34 THEN '25 - 34 ปี'
         ELSE '35 ปีขึ้นไป'
       END AS label,
       COUNT(*) AS value
     FROM normal_users u
     JOIN registrations r ON u.user_id = r.user_id
     WHERE r.exhibition_id = ? AND birthdate IS NOT NULL
     GROUP BY label`,
    [exhibitionId],
  );

  // Calculate percent for age groups
  const totalAge = ageRows.reduce((sum: number, r: any) => sum + Number(r.value), 0);
  const age_groups = ageRows.map((r: any) => ({
    label: r.label,
    value: Number(r.value),
    percent: totalAge > 0 ? Math.round((Number(r.value) / totalAge) * 100) : 0,
  }));

  // Feedback breakdown (exhibition-level)
  const feedbackRows = await safeQuery<any[]>(
    `SELECT topic, score FROM v_org_exhibition_feedback_stats WHERE exhibition_id = ?`,
    [exhibitionId],
  );

  // Recent comments for the exhibition overall (unit_id IS NULL)
  const exhibitionCommentRows = await safeQuery<any[]>(
    `SELECT comment
     FROM survey_submissions
     WHERE exhibition_id = ? AND unit_id IS NULL AND comment IS NOT NULL AND comment != ''
     ORDER BY created_at DESC
     LIMIT 5`,
    [exhibitionId],
  );

  // All units stats
  const unitRows = await safeQuery<any[]>(
    `SELECT id, name, type, checkins, IFNULL(rating, 0) AS rating
     FROM v_org_unit_stats
     WHERE exhibition_id = ?
     ORDER BY checkins DESC`,
    [exhibitionId],
  );

  // For each unit, fetch feedback details and recent comments in parallel
  const all_units_stats = await Promise.all(
    unitRows.map(async (unit: any) => {
      const [feedbackDetails, commentRows] = await Promise.all([
        safeQuery<any[]>(
          `SELECT qt.content AS topic, ROUND(AVG(a.score), 2) AS score
           FROM survey_submissions s
           JOIN survey_answers a ON s.submission_id = a.submission_id
           JOIN questions_template qt ON a.qt_id = qt.qt_id
           WHERE s.unit_id = ?
           GROUP BY qt.qt_id, qt.content`,
          [unit.id],
        ),
        safeQuery<any[]>(
          `SELECT comment
           FROM survey_submissions
           WHERE unit_id = ? AND comment IS NOT NULL AND comment != ''
           ORDER BY created_at DESC
           LIMIT 3`,
          [unit.id],
        ),
      ]);

      return {
        id: unit.id,
        name: unit.name,
        type: unit.type,
        checkins: Number(unit.checkins),
        rating: Number(unit.rating),
        feedback_details: feedbackDetails.map((f: any) => ({
          topic: f.topic,
          score: Number(f.score),
        })),
        recent_comments: commentRows.map((c: any) => c.comment),
      };
    }),
  );

  return {
    status: "success" as const,
    data: {
      exhibition_info: {
        id: kpi.exhibition_id,
        title: kpi.title,
        description: kpi.description ?? null,
        status: kpi.status,
        location: kpi.location,
      },
      kpis: {
        total_registrations: Number(kpi.total_registrations),
        total_units: Number(kpi.total_units),
        total_checkins: Number(kpi.total_checkins),
        exhibition_avg_score: kpi.exhibition_avg_score !== null ? Number(kpi.exhibition_avg_score) : null,
      },
      demographics: {
        gender: genderRows.map((r: any) => ({ label: r.label, value: Number(r.value) })),
        age_groups,
      },
      feedback_breakdown: feedbackRows.map((r: any) => ({
        topic: r.topic,
        score: Number(r.score),
      })),
      recent_comments: exhibitionCommentRows.map((c: any) => c.comment),
      all_units_stats,
    },
  };
}
