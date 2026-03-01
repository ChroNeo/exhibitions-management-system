export type UnitDashboardResponse = {
  status: "success";
  data: {
    staff_info: { id: number; name: string };
    unit_detail: {
      id: number;
      code: string;
      name: string;
      type: "activity" | "booth" | string;
      description: string;
      poster_url: string;
      detail_pdf_url: string;
      schedule: { starts_at: string; ends_at: string };
    };
    exhibition_context: {
      id: number;
      title: string;
      location: string;
      status: "ongoing" | "draft" | "closed" | string;
    };
    stats: {
      total_checkins: number;
      total_reviews: number;
      average_rating: number;
    };
    feedback_breakdown: Array<{
      qt_id: number;
      topic: string;
      score: number;
      response_count: number;
    }>;
  };
};

export const mockUnitDashboardById: Record<number, UnitDashboardResponse> = {
  19: {
    status: "success",
    data: {
      staff_info: { id: 3, name: "วิชัย สตาฟ" },
      unit_detail: {
        id: 19,
        code: "EX20250901",
        name: "Workshop: AI Robot Arm Control",
        type: "activity",
        description: "<p>เรียนรู้วิธีการควบคุมแขนกล AI เบื้องต้น...</p>",
        poster_url: "https://example.com/uploads/poster-ai-arm.jpg",
        detail_pdf_url: "https://example.com/uploads/docs/manual-v1.pdf",
        schedule: {
          starts_at: "2025-11-05T10:00:00Z",
          ends_at: "2025-11-05T12:00:00Z",
        },
      },
      exhibition_context: {
        id: 17,
        title: "Future Tech Expo 2026",
        location: "BITEC Bangna, Hall 98",
        status: "ongoing",
      },
      stats: { total_checkins: 128, total_reviews: 45, average_rating: 4.75 },
      feedback_breakdown: [
        {
          qt_id: 5,
          topic: "ความสุภาพและเป็นมิตรของเจ้าหน้าที่",
          score: 4.95,
          response_count: 45,
        },
        {
          qt_id: 6,
          topic: "ความกระตือรือร้นในการให้บริการ",
          score: 4.8,
          response_count: 45,
        },
        {
          qt_id: 7,
          topic: "ความชัดเจนในการตอบคำถาม",
          score: 4.5,
          response_count: 44,
        },
        {
          qt_id: 8,
          topic: "บุคลิกภาพและการแต่งกาย",
          score: 4.75,
          response_count: 45,
        },
      ],
    },
  },
  // อยากเพิ่มอีกบูธก็ใส่ id ใหม่ตรงนี้
};
