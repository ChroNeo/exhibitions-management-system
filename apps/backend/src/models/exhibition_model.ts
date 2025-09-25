export const EXHIBITION_STATUSES = [
  "draft",
  "published",
  "ongoing",
  "ended",
  "archived",
] as const;

export type ExhibitionStatus = (typeof EXHIBITION_STATUSES)[number];

export interface AddExhibitionPayload {
  title: string;
  description?: string;
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  location?: string;
  organizer_name: string;
  picture_path?: string;
  status?: ExhibitionStatus;
  created_by: number;
}

export type UpdateExhibitionPayload = Partial<{
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  organizer_name: string;
  picture_path: string | null;
  status: ExhibitionStatus;
}>;
