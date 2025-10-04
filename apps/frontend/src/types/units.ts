export type Unit = {
  id: string;
  exhibitionId: number;
  code: string;
  name: string;
  type: "booth" | "activity"; // adjust enum as needed
  description?: string;
  staffUserId?: number;
  posterUrl?: string;
  startsAt: string | number | Date;
  endsAt: string | number | Date;
};

// API model
export interface UnitApi {
  unit_id: number;
  exhibition_id: number;
  unit_code: string;
  unit_name: string;
  unit_type: string;
  description?: string | null;
  staff_user_id?: number | null;
  poster_url?: string | null;
  starts_at: string;
  ends_at: string;
}