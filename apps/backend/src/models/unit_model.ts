export const UNIT_TYPES = [
  "booth",
  "activity",
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export interface AddUnitPayload {
  exhibition_id: number;          // FK → exhibitions.exhibition_id
  unit_name: string;
  unit_type: UnitType;
  description?: string | null;
  description_delta?: string | null;
  staff_user_id?: number | null;  // FK → normal_users.user_id
  staff_user_ids?: number[];
  poster_url?: string | null;
  detail_pdf_url?: string | null;
  starts_at?: string | null;      // ISO datetime string
  ends_at?: string | null;        // ISO datetime string
}

export type UpdateUnitPayload = Partial<{
  unit_name: string;
  unit_type: UnitType;
  description: string | null;
  description_delta: string | null;
  staff_user_id: number | null;
  staff_user_ids: number[];
  poster_url: string | null;
  detail_pdf_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
}>;

export type UnitRowBase = {
  unit_id: number;
  exhibition_id: number;
  unit_name: string;
  unit_type: string;
  description: string | null;
  description_delta: string | null;
  poster_url: string | null;
  detail_pdf_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export type UnitRowWithStaff = UnitRowBase & {
  staff_user_id: number | null;
  staff_name: string | null;
  staff_user_ids: number[];
  staff_names: string[];
};

export type UnitStaffRow = {
  unit_id: number;
  staff_user_id: number;
  full_name: string | null;
};