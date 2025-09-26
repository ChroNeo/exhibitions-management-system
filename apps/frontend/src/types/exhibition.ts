export type Exhibition = {
    picture_path: string | undefined;
    organizer_name: string | undefined;
    end_date: string | number | Date;
    start_date: string | number | Date;
    id: string;
    title: string;
    description?: string;
    dateText: string;
    location: string;
    coverUrl?: string;
    isPinned?: boolean;
};

export interface ExhibitionApi {
  exhibition_id: number;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  location?: string | null;
  organizer_name: string;
  picture_path?: string | null;
}