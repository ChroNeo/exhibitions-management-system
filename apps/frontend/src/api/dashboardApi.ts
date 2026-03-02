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

// ── Staff Dashboard Types ───────────────────────────────────────────────────

export interface StaffDashboardData {
  staff_info: { id: number; name: string };
  unit_detail: {
    id: number;
    code: string;
    name: string;
    type: "activity" | "booth" | string;
    description: string;
    poster_url: string;
    detail_pdf_url: string;
    schedule: { starts_at: string; ends_at: string };
  };
  exhibition_context: {
    id: number;
    title: string;
    location: string;
    status: "ongoing" | "draft" | "closed" | string;
  };
  stats: {
    total_checkins: number;
    total_reviews: number;
    average_rating: number;
  };
  feedback_breakdown: Array<{
    qt_id: number;
    topic: string;
    score: number;
    response_count: number;
  }>;
}

// ── API ────────────────────────────────────────────────────────────────────

export async function getStaffDashboard(
  exId: number,
  unitId: number
): Promise<StaffDashboardData> {
  const res = await api.get<{ status: string; data: StaffDashboardData }>(
    `/dashboard/staff/${exId}/${unitId}`
  );
  return res.data.data;
}

export async function getOrgDashboard(
  exhibitionId: number
): Promise<OrgDashboardData> {
  const res = await api.get<{ status: string; data: OrgDashboardData }>(
    `/dashboard/organizer/${exhibitionId}`
  );
  return res.data.data;
}
