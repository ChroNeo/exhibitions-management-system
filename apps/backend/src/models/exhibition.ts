export interface AddExhibitionPayload {
  title: string;
  description?: string;
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  location?: string;
  organizer_name: string;
  picture_path?: string;
  status?: "draft" | "published" | "ongoing" | "ended" | "archived";
  created_by: number;
}
