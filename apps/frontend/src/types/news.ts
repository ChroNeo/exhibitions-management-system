export interface NewsLists {
  announcement_id: number;
  exhibition_id: number;
  topic: string;
  description: string | null;
  description_delta: string | null;
  image_url: string | null;
  is_active: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateNewsPayload {
  exhibition_id: number;
  topic: string;
  description: string | null;
  description_delta?: string | null;
  is_active: number | null;
  file?: File;
}

export interface UpdateNewsPayload {
  exhibition_id?: number;
  topic?: string;
  description?: string | null;
  description_delta?: string | null;
  is_active?: number | null;
  file?: File;
}
