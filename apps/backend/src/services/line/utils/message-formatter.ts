import type {
  LineExhibitionDetailRow,
  LineExhibitionSummaryRow,
} from "../../../queries/line-query.js";

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function stripHtml(input: string): string {
  return input.replace(/<\/?[^>]+>/gi, " ").replace(/\s+/g, " ").trim();
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

export function formatUpcomingExhibitions(rows: LineExhibitionSummaryRow[]): string {
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
  const description = row.description ? truncateText(stripHtml(row.description), 280) : null;
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
  'พิมพ์ "list" หรือ "ดูงาน" เพื่อดูกิจกรรมที่กำลังเปิดอยู่\nพิมพ์รหัสงาน เช่น EX202501 เพื่อดูรายละเอียด\nพิมพ์ "ticket" หรือ "บัตร" เพื่อดู QR Code บัตรของคุณ\nพิมพ์ "profile" เพื่อเปิดหน้าโปรไฟล์ LIFF\nพิมพ์ "help" เพื่อดูคำสั่งนี้อีกครั้ง';
