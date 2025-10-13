import { safeQuery } from "../services/dbconn.js";

type FeatureQueryOptions = {
  limit?: number | string | null;
  status?: string | null;
};

type FeatureQueryResult = {
  featureImages: any[];
  exhibitions: any[];
};

export async function getFeature(
  options: FeatureQueryOptions = {}
): Promise<FeatureQueryResult> {
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

  const featureImages = await safeQuery<any[]>(
    `SELECT image_path AS image, href
     FROM feature_banners
     WHERE is_active = 1
     ORDER BY sort_order ASC, banner_id DESC
     LIMIT 10`
  );

  const exhibitions = await safeQuery<any[]>(
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

  return {
    featureImages,
    exhibitions,
  };
}
