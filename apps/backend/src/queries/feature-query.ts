import { safeQuery } from "../services/dbconn.js";
import type { FeatureQuery, FeatureResponse } from "../models/feature.model.js";

export async function getFeature(
  options: FeatureQuery = {}
): Promise<FeatureResponse> {
  const limitRaw = options.limit ?? 6;
  const parsedLimit =
    typeof limitRaw === "string" ? Number.parseInt(limitRaw, 10) : Number(limitRaw);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 6;

  const statusRaw = typeof options.status === "string" ? options.status : "";
  const statusList = statusRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const status = statusList.length ? statusList.join(",") : "published,ongoing";

  const exhibitionRows = await safeQuery<any[]>(
    `WITH picked AS (
       SELECT e.exhibition_id, e.exhibition_code, e.title, e.picture_path,
              e.status, e.start_date, e.end_date, e.location
       FROM v_exhibitions e
       WHERE FIND_IN_SET(e.status, ?)
       ORDER BY CASE WHEN e.status='ongoing' THEN 0 ELSE 1 END,
                e.start_date ASC
       LIMIT ?
     )
     SELECT * FROM picked`,
    [status, limit]
  );

  const featureImages = exhibitionRows.map((exhibition) => ({
    image: exhibition.picture_path,
    picture_path: exhibition.picture_path,
    href: `/exhibitions/${exhibition.exhibition_id}`,
    ref_id: exhibition.exhibition_id,
  }));
  
  const exhibitions = exhibitionRows.map((exhibition) => ({
    exhibition_id: exhibition.exhibition_id,
    title: exhibition.title,
    picture_path: exhibition.picture_path,
    status: exhibition.status,
    start_date: exhibition.start_date,
    end_date: exhibition.end_date,
    location: exhibition.location,
  }));
  return {
    featureImages,
    exhibitions,
  };
}
