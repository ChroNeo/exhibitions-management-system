export type Unit = {
  id: string;
  exhibitionId: number;
  name: string;
  type: "booth" | "activity";
  description?: string; // plain text
  descriptionHtml?: string;
  descriptionDelta?: string;
  staffUserId?: number;
  staffName?: string;
  posterUrl?: string;
  posterPath?: string;
  startsAt: string | number | Date;
  endsAt: string | number | Date;
};

export interface UnitApi {
  unit_id: number;
  exhibition_id: number;
  unit_name: string;
  unit_type: string;
  description?: string | null;
  description_delta?: string | Record<string, unknown> | null;
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
  description_delta?: string;
  staff_user_id?: number;
  poster_url?: string;
  posterFile?: File;
  starts_at: string;
  ends_at: string;
};

export type UnitUpdatePayload = Partial<UnitCreatePayload>;
