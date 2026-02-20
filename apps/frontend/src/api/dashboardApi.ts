import api from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface OrgLabelValue {
  label: string;
  value: number;
}

export interface OrgAgeGroup {
  label: string;
  value: number;
  percent: number;
}

export interface OrgFeedbackTopic {
  topic: string;
  score: number;
}

export interface OrgUnitStat {
  id: number;
  name: string;
  type: string;
  checkins: number;
  rating: number;
  feedback_details: OrgFeedbackTopic[];
  recent_comments: string[];
}

export interface OrgDashboardData {
  exhibition_info: {
    id: number;
    title: string;
    status: string;
    location: string;
  };
  kpis: {
    total_registrations: number;
    total_units: number;
    total_checkins: number;
    exhibition_avg_score: number | null;
  };
  demographics: {
    gender: OrgLabelValue[];
    age_groups: OrgAgeGroup[];
  };
  feedback_breakdown: OrgFeedbackTopic[];
  all_units_stats: OrgUnitStat[];
}

// ── API ────────────────────────────────────────────────────────────────────

export async function getOrgDashboard(
  exhibitionId: number
): Promise<OrgDashboardData> {
  const res = await api.get<{ status: string; data: OrgDashboardData }>(
    `/dashboard/organizer/${exhibitionId}`
  );
  return res.data.data;
}
