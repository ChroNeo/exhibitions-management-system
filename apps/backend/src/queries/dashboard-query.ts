import { DashboardResponse } from "../models/dashboard.model.js";
import { safeQuery } from "../services/dbconn.js";

export async function getStaffDashboard(
  staffUserId: number,
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
    WHERE v.staff_user_id = ?
    LIMIT 1;
    `,
    [staffUserId],
  );

  const feedback = await safeQuery<any[]>(
    `
    SELECT
      qt_id,
      question_topic AS topic,
      CAST(average_score AS DECIMAL(10,2)) AS score,
      response_count
    FROM v_staff_dashboard_question_scores
    WHERE staff_user_id = ?
      AND unit_id = ?;
    `,
    [staffUserId, main.unit_id],
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
