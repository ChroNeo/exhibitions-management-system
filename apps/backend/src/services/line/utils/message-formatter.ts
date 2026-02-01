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

export const HELP_TEXT =
  "สวัสดีครับ! คุณสามารถใช้งานผ่าน Rich Menu ด้านล่างได้เลยครับ";

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
