import { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { LIFF_CONFIG } from '../config/liff';

// Interface
export interface Ticket {
  registration_id: number;
  exhibition_id: number;
  title: string;
  status: string;
  picture_path: string | null;
  start_date: string;
  location: string;
}

export interface UserProfile {
  displayName: string;
  pictureUrl?: string;
}

// Config
const API_URL = import.meta.env.VITE_BASE || 'https://28dbf038a9c8.ngrok-free.app';

export function useWalletData() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Init LIFF (ถ้า init แล้วจะไม่ทำซ้ำ)
      // เช็ค liff.id เพื่อดูว่า init หรือยัง (ป้องกันการ init ซ้ำ)
      if (!liff.id) {
          await liff.init({ liffId: LIFF_CONFIG.TICKET });
      }

      // 2. Check Login
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return; // หยุดทำงานเพื่อรอ Redirect
      }

      // 3. Get Profile
      const profile = await liff.getProfile();
      setUserProfile({
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });

      // 4. Get ID Token
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error("No ID Token");

      // 5. Fetch API
      const response = await axios.get<Ticket[]>(
        `${API_URL}/api/v1/ticket/`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      setTickets(response.data);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถโหลดข้อมูลบัตรได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, []);

  // เรียกใช้ครั้งแรก
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tickets, userProfile, loading, error, refetch: fetchData };
}