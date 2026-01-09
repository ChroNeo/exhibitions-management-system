export interface UserTicket {
  registration_id: number;
  exhibition_id: number;
  title: string;
  code: string;
  location: string | null;
  start_date: string;
  end_date: string;
  picture_path: string | null;
  status: string;
  registered_at: string;
}

export interface QRTokenResponse {
  qr_token: string;
  expires_in: number;
}

export interface VisitorInfo {
  full_name: string;
  picture_url: string | null;
  checkin_at: Date;
}

export interface ScanResult {
  success: boolean;
  message: string;
  visitor?: VisitorInfo;
  code?: string;
}
