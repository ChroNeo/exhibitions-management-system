// ── User Management ──
export interface OrganizerUser {
  user_id: number;
  username: string;
  email: string | null;
  role: string;
  last_login_at: string | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  email?: string | null;
  role: "admin" | "organizer";
}

// ── Dashboard ──
export interface ExhibitionWithStats {
  exhibition_id: number;
  exhibition_code: string;
  title: string;
  status: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  organizer_name: string;
  picture_path: string | null;
  total_registrations: number;
}

export interface RegistrationRow {
  registration_id: number;
  user_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  registered_at: string | null;
}

// ── Visitor Management ──
export interface Visitor {
  user_id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  picture_url: string | null;
  registration_count: number;
}

export interface VisitorDetail {
  user_id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  gender: string | null;
  birthdate: string | null;
  picture_url: string | null;
}

export interface VisitorExhibition {
  exhibition_id: number;
  exhibition_code: string;
  title: string;
  status: string | null;
  start_date: string;
  end_date: string;
  registered_at: string | null;
  total_units: number;
  checked_in_units: number;
}

export interface UnitCheckin {
  unit_id: number;
  unit_name: string;
  unit_type: string;
  checkin_id: number | null;
  checkin_at: string | null;
  checked_in: boolean;
}
