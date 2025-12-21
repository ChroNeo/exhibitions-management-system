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
