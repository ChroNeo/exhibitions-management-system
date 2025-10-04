export type Unit = {
  id: string;
  exhibitionId: number;
  name: string;
  type: "booth" | "activity"; // adjust enum as needed
  description?: string;
  staffUserId?: number;
  staffName?: string;
  posterUrl?: string;
  startsAt: string | number | Date;
  endsAt: string | number | Date;
};

// API model
export interface UnitApi {
  unit_id: number;
  exhibition_id: number;
  unit_name: string;
  unit_type: string;
  description?: string | null;
  staff_user_id?: number | null;
  staff_name?: string | null;
  poster_url?: string | null;
  starts_at: string;
  ends_at: string;
}

export type UnitCreatePayload = {
  unit_name: string;
  unit_type: "booth" | "activity";
  description?: string;
  staff_user_id?: number;
  poster_url?: string;
  starts_at: string;
  ends_at: string;
};

export type UnitUpdatePayload = Partial<UnitCreatePayload>;
