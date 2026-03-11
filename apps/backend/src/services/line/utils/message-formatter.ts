import type {
  LineExhibitionDetailRow,
  LineExhibitionSummaryRow,
} from "../../../queries/line-query.js";
import type { LineMessage } from "../types.js";

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function stripHtml(input: string): string {
  return input
    .replace(/<\/?[^>]+>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength - 3)}...`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

export function formatUpcomingExhibitions(
  rows: LineExhibitionSummaryRow[],
): string {
  const lines = rows.map((row, index) => {
    const start = formatDate(row.start_date);
    const location = row.location ? ` @ ${row.location}` : "";
    return `${index + 1}. ${row.title}\n   รหัส ${row.exhibition_code}\n   เริ่ม ${start}${location}`;
  });
  return `งานที่กำลังเปิดอยู่:\n${lines.join("\n\n")}`;
}

export function formatExhibitionDetail(row: LineExhibitionDetailRow): string {
  const start = formatDate(row.start_date);
  const end = formatDate(row.end_date);
  const description = row.description
    ? truncateText(stripHtml(row.description), 280)
    : null;
  const segments = [
    `${row.title} (${row.exhibition_code})`,
    `ช่วงจัดงาน: ${start} - ${end}`,
    `สถานที่: ${row.location ?? "-"}`,
    `ผู้จัด: ${row.organizer_name}`,
  ];

  if (description) {
    segments.push("");
    segments.push(`รายละเอียด: ${description}`);
  }

  return segments.join("\n");
}

export const HELP_TEXT = `สวัสดีครับ! ยินดีต้อนรับสู่นิทรรศการนะครับ สำหรับการใช้งานเมนูต่างๆ สามารถดูรายละเอียดได้ตามนี้เลยครับ

    📷 QR Code: กดเพื่อเปิด "คิวอาร์โค้ดประจำตัว" ของคุณ ให้เจ้าหน้าที่ประจำบูธหรือกิจกรรมสแกนเพื่อทำการเช็คอินครับ

    📰 ข่าวสาร (NEWS): ติดตามอัปเดตข้อมูลของนิทรรศการ และรับการแจ้งเตือนกิจกรรมที่กำลังจะเกิดขึ้นครับ

    🎓 เกียรติบัตร (CERTIFICATE): ตรวจสอบและรับเกียรติบัตรการเข้าร่วมงาน (เงื่อนไข: ต้องเช็คอินตามบูธต่างๆ ให้ครบตามที่กำหนดก่อนนะครับ ถึงจะสามารถรับได้ครับ)

    📝 แบบสอบถาม (SURVEY): ทำแบบประเมินและร่วมแสดงความคิดเห็นเกี่ยวกับนิทรรศการ เพื่อให้เรานำไปพัฒนาต่อไปครับ

    ❓ ช่วยเหลือ (HELP): หากมีข้อสงสัยเกี่ยวกับการใช้งาน หรือต้องการความช่วยเหลือเพิ่มเติม สามารถกดที่ปุ่มนี้ได้เลยครับ

    🔙 กลับ (BACK): กดเพื่อย้อนกลับไปยังหน้า "เลือกนิทรรศการ" ครับ"
  `;
export const staff_Help_text = `สวัสดีครับ! สำหรับเมนูการใช้งานของเจ้าหน้าที่ (Staff) ประจำบูธ สามารถดูรายละเอียดได้ตามนี้เลยครับ

    📷 QR Code: กดเพื่อเปิดกล้องสำหรับ "สแกนคิวอาร์โค้ด" ของผู้เข้าร่วมงาน เพื่อทำการเช็คอินเข้าบูธหรือร่วมกิจกรรมครับ

    📊 รายละเอียด (DETAIL): กดเพื่อดูข้อมูลและรายละเอียดต่างๆ ของบูธกิจกรรมที่คุณดูแลอยู่ครับ

    📝 แบบสอบถาม (SURVEY): กดเพื่อทำแบบประเมินและร่วมแสดงความคิดเห็นเกี่ยวกับนิทรรศการ เพื่อนำไปพัฒนาต่อไปครับ

    ❓ ช่วยเหลือ (HELP): หากมีข้อสงสัยเกี่ยวกับการใช้งานระบบ หรือต้องการความช่วยเหลือเพิ่มเติม สามารถกดที่ปุ่มนี้ได้เลยครับ

    🔙 กลับ (BACK): กดเพื่อย้อนกลับไปยังหน้า "เลือกนิทรรศการ" ครับ`;

const DEFAULT_IMAGE = "https://placehold.co/1920x1080?text=Image%20Not%20Found";

export function buildExhibitionFlexCarousel(
  rows: LineExhibitionSummaryRow[],
  baseUrl: string,
): LineMessage {
  const bubbles = rows.map((row) => {
    const start = formatDate(row.start_date);
    const end = formatDate(row.end_date);
    const imageUrl = row.picture_path
      ? `${baseUrl}/${row.picture_path}`
      : DEFAULT_IMAGE;

    return {
      type: "bubble" as const,
      hero: {
        type: "image" as const,
        url: imageUrl,
        size: "full" as const,
        aspectRatio: "16:9" as const,
        aspectMode: "cover" as const,
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        contents: [
          {
            type: "text" as const,
            text: row.title,
            weight: "bold" as const,
            size: "lg" as const,
            wrap: true,
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            margin: "lg" as const,
            spacing: "sm" as const,
            contents: [
              {
                type: "box" as const,
                layout: "baseline" as const,
                spacing: "sm" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "📅",
                    size: "sm" as const,
                    flex: 0,
                  },
                  {
                    type: "text" as const,
                    text: `${start} - ${end}`,
                    wrap: true,
                    color: "#666666",
                    size: "sm" as const,
                    flex: 1,
                  },
                ],
              },
              {
                type: "box" as const,
                layout: "baseline" as const,
                spacing: "sm" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "📍",
                    size: "sm" as const,
                    flex: 0,
                  },
                  {
                    type: "text" as const,
                    text: row.location ?? "-",
                    wrap: true,
                    color: "#666666",
                    size: "sm" as const,
                    flex: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: "#27ACB2",
            action: {
              type: "postback" as const,
              label: "เข้าร่วมนิทรรศการ",
              data: `action=enter_exhibition&exhibitionId=${row.exhibition_id}`,
              displayText: `เข้าร่วม ${row.title}`,
            },
          },
        ],
      },
    };
  });

  return {
    type: "flex",
    altText: "งานที่กำลังเปิดอยู่",
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}
